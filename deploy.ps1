<#
.SYNOPSIS
    Deploy PeekabooServer to Azure App Service

.DESCRIPTION
    Builds TypeScript, creates a deployment zip, and deploys to Azure.
    Optionally commits changes to git first.

.PARAMETER CommitMessage
    If provided, commits all changes with this message before deploying

.PARAMETER SkipGit
    Skip git operations entirely

.PARAMETER SkipBuild
    Skip the TypeScript build step

.EXAMPLE
    .\deploy.ps1
    # Build and deploy current code to Azure

.EXAMPLE
    .\deploy.ps1 -CommitMessage "Fix tag merging in copy"
    # Commit changes, push to GitHub, then build and deploy

.EXAMPLE
    .\deploy.ps1 -SkipBuild
    # Deploy without rebuilding (uses existing dist/)
#>

param(
    [string]$CommitMessage,
    [switch]$SkipGit,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$AppName = "PeekabooServer"
$ResourceGroup = "peekaboo"

Write-Host "`n=== PeekabooServer Deployment ===" -ForegroundColor Cyan

# Ensure az CLI is available
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

# Git operations
if (-not $SkipGit) {
    $status = git status --porcelain

    if ($status -and $CommitMessage) {
        Write-Host "`nCommitting changes..." -ForegroundColor Yellow
        git add -A
        git commit -m $CommitMessage

        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
    }
    elseif ($status -and -not $CommitMessage) {
        Write-Host "`nUncommitted changes detected:" -ForegroundColor Yellow
        git status --short
        Write-Host "`nTip: Use -CommitMessage 'your message' to commit first" -ForegroundColor Gray
    }

    # Check if ahead of origin
    $ahead = git rev-list --count origin/main..HEAD 2>$null
    if ($ahead -gt 0) {
        Write-Host "Pushing $ahead commit(s) to GitHub..." -ForegroundColor Yellow
        git push origin main
    }
}

# Build
if (-not $SkipBuild) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install --legacy-peer-deps

    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n=== Build Failed ===" -ForegroundColor Red
        exit 1
    }
    Write-Host "Build succeeded." -ForegroundColor Green
}

# Create deployment zip (include dist/, node_modules/, package.json)
Write-Host "`nCreating deployment package..." -ForegroundColor Yellow
$zipPath = Join-Path $env:TEMP "peekaboo-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

Compress-Archive -Path dist, node_modules, package.json, web.config -DestinationPath $zipPath -CompressionLevel Fastest
if (-not (Test-Path $zipPath)) {
    Write-Host "`n=== Packaging Failed ===" -ForegroundColor Red
    exit 1
}
Write-Host "Package created: $([math]::Round((Get-Item $zipPath).Length / 1MB, 1)) MB" -ForegroundColor Gray

# Deploy to Azure
Write-Host "`nDeploying to Azure..." -ForegroundColor Cyan
az webapp deploy --name $AppName --resource-group $ResourceGroup --src-path $zipPath --type zip --timeout 300

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
    Write-Host "Live API: https://peekabooserver.azurewebsites.net/api" -ForegroundColor Cyan

    # Clean up
    Remove-Item $zipPath -ErrorAction SilentlyContinue
}
else {
    Write-Host "`n=== Deployment Failed ===" -ForegroundColor Red
    Write-Host "Check the logs: az webapp log tail --name $AppName --resource-group $ResourceGroup"
    Remove-Item $zipPath -ErrorAction SilentlyContinue
}
