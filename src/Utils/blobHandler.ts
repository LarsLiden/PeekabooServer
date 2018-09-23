import * as azure from 'azure-storage'

export class BlobHandler {
    private static blobService: azure.BlobService

    public static init() {
        let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
        if (!connectionString) {
            throw new Error('No Blob Connection String')
        }
        BlobHandler.blobService = azure.createBlobService(
            connectionString
        )
    }

    public static uploadImage(containerName: string, blobName: string, localFileName: string) {
     /*   BlobHandler.blobService.createBlockBlobFromLocalFile(containerName, blobName, localFileName, 
        (error, result, response) => {
            if (!error) {
                console.log(JSON.stringify(result))
                console.log(JSON.stringify(response))
            }
            else {
                console.log(JSON.stringify(error))
            }
          });*/

          BlobHandler.blobService.listBlobsSegmentedWithPrefix("faces","S/", undefined as any, (error, result, response) => {
            if (!error) {
                console.log(JSON.stringify(result))
                console.log(JSON.stringify(response))
            }
            else {
                console.log(JSON.stringify(error))
            }
          });
    }
}