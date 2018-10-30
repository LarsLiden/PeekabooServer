import * as azure from 'azure-storage'
import { Person } from '../Models/person'
import { promisify } from 'util'

//const imageContainer = 'faces'
const personContainer = 'data'

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
    

    public async getPeopleAsync(): Promise<Person[]> {
        let listBlobsSegmentedAsync = promisify(this._blobService.listBlobsSegmented).bind(this._blobService)
        let peopleBlobs: BlobResult[] = []
        try {
            peopleBlobs = (await listBlobsSegmentedAsync(personContainer, null as any)).entries
        }
        catch (err) {
            console.log("ERR: "+JSON.stringify(err))
        }

        let people: Person[] = []
        for (let blobInfo of peopleBlobs) {
            let blobFile = await this.getBlobAsTextAsync(personContainer, blobInfo.name)
            if (blobFile) {
                let person = new Person(JSON.parse(blobFile))
                people.push(person)
            }
        }
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

    public uploadText(containerName: string, blobName: string, text: string) {
        console.log(`Upload: ${containerName}: ${blobName}`)

        this._blobService.createBlockBlobFromText(containerName, blobName, text, 
            (error, result, response) => {
                if (error) {
                    console.log(`ERR: ${blobName} ${JSON.stringify(error)}`)
                }
              })
    }

    public uploadPerson(person: Person): void {
        // Upload the person file
        let dataContainerName = person.isArchived ? "archive-data" : "data"
        const savePrefix = person.saveName[0].toUpperCase()
        let dataBlobPath = savePrefix +'\\' + person.saveName +'.json'
        this.uploadText(dataContainerName, dataBlobPath, JSON.stringify(person))
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