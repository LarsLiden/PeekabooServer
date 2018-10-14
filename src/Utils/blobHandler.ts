import * as azure from 'azure-storage'
import * as models from '../Models/person'
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
    

    public async getPeopleAsync(): Promise<models.Person[]> {
        let listBlobsSegmentedAsync = promisify(this._blobService.listBlobsSegmented).bind(this._blobService)
        let peopleBlobs: BlobResult[] = []
        try {
            peopleBlobs = (await listBlobsSegmentedAsync(personContainer, null as any)).entries
        }
        catch (err) {
            console.log(JSON.stringify(err))
        }

        let people: models.Person[] = []
        for (let blobInfo of peopleBlobs) {
            let blobFile = await this.getBlobAsTextAsync(personContainer, blobInfo.name)
            if (blobFile) {
                people.push(new models.Person(JSON.parse(blobFile)))
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
            console.log(JSON.stringify(err))
        }
    }

    public uploadText(containerName: string, blobName: string, text: string) {
        console.log(`${containerName}: ${blobName}`)

        this._blobService.createBlockBlobFromText(containerName, blobName, text, 
            (error, result, response) => {
                if (!error) {
                    console.log(`${containerName}: ${blobName}`)
                }
                else {
                    console.log(JSON.stringify(error))
                }
              })
    }

    public uploadFile(containerName: string, blobName: string, localFileName: string) {
        console.log(`${containerName}: ${blobName}`)
return
        this._blobService.createBlockBlobFromLocalFile(containerName, blobName, localFileName, 
        (error, result, response) => {
            if (!error) {
                console.log(`${containerName}: ${blobName}`)
            }
            else {
                console.log(`${localFileName} ${JSON.stringify(error)}`)
            }
          })
/*
          BlobHandler.blobService.listBlobsSegmentedWithPrefix("faces","S/", undefined as any, (error, result, response) => {
            if (!error) {
                console.log(JSON.stringify(result))
                console.log(JSON.stringify(response))
            }
            else {
                console.log(JSON.stringify(error))
            }
          });*/
    }
}

export default BlobService.Instance()