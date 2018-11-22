/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as azure from 'azure-storage'
import { Person } from '../Models/person'
import { User } from '../Models/models'
import { GetContainer, ContainerType } from '../Utils/util'
import { promisify } from 'util'

const adminContainer = 'admin'
const userBlob = "users"

interface BlobResult {
    name: string;
    containerName: string;
    metadata?: { [key: string]: string; };
}

export class BlobService {
    private static _instance: BlobService
    private _blobService: azure.BlobService

    private constructor() {
        let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
        if (!connectionString) {
            throw new Error('No Blob Connection String')
        }
        this._blobService = azure.createBlobService(connectionString)
    }

    public static Instance(): BlobService {
        if (!this._instance) {
            this._instance = new BlobService()
        }
        return this._instance
    }
    
    public async getUsers(): Promise<User[]> {
        let blobFile = await this.getBlobAsTextAsync(adminContainer, userBlob)
        if (blobFile) {
            let users: User[] = JSON.parse(blobFile)
            return users
        }
        return []
    }

    public async updateUsers(users: User[]): Promise<void> {
        await this.uploadText(adminContainer, userBlob, JSON.stringify(users))
    }

    public async createContainer(containerName: string, isPrivate: boolean) {

        let createContainerIfNotExists = promisify(this._blobService.createContainerIfNotExists).bind(this._blobService)
        
        await createContainerIfNotExists(containerName, 
            {
            publicAccessLevel: isPrivate ? null : 'blob'
          })
    }

/*
    private static aggregateBlobs(err, result, cb) {
        if (err) {
            cb(er);
        } else {
            blobs = blobs.concat(result.entries);
            if (result.continuationToken !== null) {
                blobService.listBlobsSegmented(
                    containerName,
                    result.continuationToken,
                    aggregateBlobs);
            } else {
                cb(null, blobs);
            }
        }
    }*/
    
    public async getPeopleStartingWith(user: User, letter: string): Promise<Person[]> {
        let containerName = GetContainer(user, ContainerType.DATA)
        let listBlobsSegmentedAsync = promisify(this._blobService.listBlobsSegmentedWithPrefix).bind(this._blobService)
        let peopleBlobs: BlobResult[] = []
        try {
            peopleBlobs = (await listBlobsSegmentedAsync(containerName, letter, null as any)).entries
        }
        catch (err) {
            // TODO: allow throw and catch it
            console.log("ERR: "+JSON.stringify(err))
        }

        let people: Person[] = []
        for (let blobInfo of peopleBlobs) {
            let blobFile = await this.getBlobAsTextAsync(containerName, blobInfo.name)
            if (blobFile) {
                let person = JSON.parse(blobFile)
                // Backward compatibility
                delete person.fullName
                people.push(person)
            }
        }
        console.log(`Library loaded ${letter}`)
        return people
    }

    // NOT CURRENTLY USED
    public async getPeopleAsync(user: User): Promise<Person[]> {
        let containerName = GetContainer(user, ContainerType.DATA)
        let listBlobsSegmentedAsync = promisify(this._blobService.listBlobsSegmented).bind(this._blobService)
        let peopleBlobs: BlobResult[] = []
        try {
            peopleBlobs = (await listBlobsSegmentedAsync(containerName, null as any)).entries
        }
        catch (err) {
            console.log("ERR: "+JSON.stringify(err))
        }

        let people: Person[] = []
        for (let blobInfo of peopleBlobs) {
            let blobFile = await this.getBlobAsTextAsync(containerName, blobInfo.name)
            if (blobFile) {
                let person = JSON.parse(blobFile)
                // Backward compatibility
                delete person.fullName
                people.push(person)
            }
            if (people.length > 20) return people // LARS DEV  TEMP
        }
        console.log("Library loaded...")
        return people
    }

  
    public async getBlobAsTextAsync(containerName: string, blobName: string) {
        const getBlobToTextAsync = promisify(this._blobService.getBlobToText).bind(this._blobService)

        try {
            return await getBlobToTextAsync(containerName, blobName)
        }
        catch (err) {
            console.log("ERR: "+JSON.stringify(err))
        }
    }

    public async uploadText(containerName: string, blobName: string, text: string) {
        console.log(`Upload: ${containerName}: ${blobName}`)

        const createBlockBlobFromText = promisify(this._blobService.createBlockBlobFromText).bind(this._blobService)
        await createBlockBlobFromText(containerName, blobName, text)
    }
    
    public async uploadPerson(user: User, person: Person): Promise<void> {
        // Upload the person file
        let dataContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_DATA)
                : GetContainer(user, ContainerType.DATA)

        const savePrefix = person.saveName[0].toUpperCase()
        let dataBlobPath = savePrefix +'\\' + person.saveName +'.json'
        await this.uploadText(dataContainerName, dataBlobPath, JSON.stringify(person))
    }

    public async deletePerson(user: User, person: Person): Promise<void> {

        // Delete photos first
        let promises = this.deletePhotos(user, person)

        let dataContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_DATA)
                : GetContainer(user, ContainerType.DATA)

        const savePrefix = person.saveName[0].toUpperCase()
        let dataBlobPath = savePrefix +'\\' + person.saveName +'.json'
        promises.push(this.deleteBlob(dataContainerName, dataBlobPath))
        await Promise.all(promises)
    }

    public deletePhotos(user: User, person: Person): Promise<void>[] {
        let faceContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_FACES)
                : GetContainer(user, ContainerType.FACES)

        let promises: Promise<void>[] = []
        person.photoFilenames.forEach(blob =>
            promises.push(this.deleteBlob(faceContainerName, blob))
        )  
        return promises
    }

    public async deleteBlob(containerName: string, blobName: string) {
        let deleteBlobAsync = promisify(this._blobService.deleteBlob).bind(this._blobService)
        await deleteBlobAsync(containerName, blobName)
    }

    public async uploadFile(containerName: string, blobName: string, localFileName: string) {
        let doesBlobExistAsync = promisify(this._blobService.doesBlobExist).bind(this._blobService)
        let blobData = await doesBlobExistAsync(containerName, blobName)
        if (blobData.exists) {
            console.log(`EXISTS: ${localFileName}`)
            return
        }
        this._blobService.createBlockBlobFromLocalFile(containerName, blobName, localFileName, 
        (error, result, response) => {
            if (error) {
                console.log(`!!!!!: ${localFileName} ${JSON.stringify(error)}`)
            }
            else {
                console.log(`SAVED: ${localFileName} ${JSON.stringify(error)}`)
            }
          })
    }
}

export default BlobService.Instance()