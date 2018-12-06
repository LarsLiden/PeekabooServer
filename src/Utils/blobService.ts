/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as azure from 'azure-storage'
import { Person } from '../Models/person'
import { User } from '../Models/user'
import { GetContainer, ContainerType, getPersonBlobName, getPhotoBlobName, getPhotoURI, keyFromPersonId } from '../Utils/util'
import { promisify } from 'util'

const ADMIN_CONTAINER = 'admin'
const USER_BLOB = "users"

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
        try {
            let blobFile = await this.blobGetAsText(ADMIN_CONTAINER, USER_BLOB)
            if (blobFile) {
                let users: User[] = JSON.parse(blobFile)
                return users
            }
            return []
        }
        catch (error) {
            // TODO - error message of some kind?  Or pass up
            return []
        }
    }

    public async updateUsers(users: User[]): Promise<void> {
        await this.blobUploadText(ADMIN_CONTAINER, USER_BLOB, JSON.stringify(users))
    }

    public async uploadPerson(user: User, person: Person): Promise<void> {
        // Upload the person file
        let dataContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_DATA)
                : GetContainer(user, ContainerType.DATA)

        let dataBlobPath = getPersonBlobName(person)
        await this.blobUploadText(dataContainerName, dataBlobPath, JSON.stringify(person))
    }

    public async copyPerson(sourceUser: User, destUser: User, person: Person): Promise<void> {
        // Copy Person
        let dataBlobPath = getPersonBlobName(person)
        let dataContainerName = GetContainer(destUser, ContainerType.DATA)
        await this.blobUploadText(dataContainerName, dataBlobPath, JSON.stringify(person))

        // Copy Photos
        let sourcePhotoContainerName = GetContainer(sourceUser, ContainerType.PHOTOS)
        let destPhotoContainerName = GetContainer(destUser, ContainerType.PHOTOS)
        for (let photoName of person.photoFilenames) {
            const photoURI = getPhotoURI(sourcePhotoContainerName, person, photoName)
            const photoBlobName = getPhotoBlobName(person, photoName)
            await this.blobCopyBlob(photoURI, destPhotoContainerName, photoBlobName)
        }
    }

    public async getPerson(user: User, personId: string): Promise<Person | null> {
        // Upload the person file
        let dataContainerName = GetContainer(user, ContainerType.DATA)

        const savePrefix = keyFromPersonId(personId)
        let dataBlobPath = savePrefix +'\\' + personId +'.json'

        let blobFile = await this.blobGetAsText(dataContainerName, dataBlobPath)
        if (blobFile) {
            let person: Person = JSON.parse(blobFile)
            if (person.personId !== personId) {
                throw new Error("Person personId invalid")
            }
            return person
        }
        return null
    }

    public async deletePerson(user: User, person: Person): Promise<void> {

        // Delete photos first
        let promises = this.deletePhotos(user, person)

        let dataContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_DATA)
                : GetContainer(user, ContainerType.DATA)

        let dataBlobPath = getPersonBlobName(person)
        promises.push(this.blobDelete(dataContainerName, dataBlobPath))
        await Promise.all(promises)
    }

    public async deletePhoto(user: User, person: Person, blobName: string): Promise<void> {

        let faceContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
                : GetContainer(user, ContainerType.PHOTOS)

        await this.blobDelete(faceContainerName, blobName)
    }

    public deletePhotos(user: User, person: Person): Promise<void>[] {
        let faceContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
                : GetContainer(user, ContainerType.PHOTOS)

        let promises: Promise<void>[] = []
        person.photoFilenames.forEach(blob =>
            promises.push(this.blobDelete(faceContainerName, blob))
        )  
        return promises
    }
    
    public async archivePerson(user: User, person: Person): Promise<void> {
        
        // Copy person to archive   
        let archivePerson = {...person, isArchived: true}
        await this.uploadPerson(user, archivePerson)
        await this.archivePhotos(user, person)

        // Delete person
        let dataContainerName = GetContainer(user, ContainerType.DATA)
        let dataBlobPath = getPersonBlobName(person)
        await this.blobDelete(dataContainerName, dataBlobPath)
    }

    public async archivePhotos(user: User, person: Person): Promise<void> {
        let photoContainerName = GetContainer(user, ContainerType.PHOTOS)
        let archiveContainerName = GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
        person.photoFilenames.forEach(async (photoName) => {
            const photoURI = getPhotoURI(photoContainerName, person, photoName)
            const photoBlobName = getPhotoBlobName(person, photoName)
            await this.blobCopyBlob(photoURI, archiveContainerName, photoBlobName)
            await this.blobDelete(photoContainerName, photoBlobName)
        })  
    }

    public async getPeopleStartingWith(user: User, letter: string): Promise<Person[]> {

        let containerName = GetContainer(user, ContainerType.DATA)

        let containerExists = await this.blobDoesContainerExist(containerName)
        if (!containerExists) {
            return []
        }
 
        let peopleBlobs = await this.blobListWithPrefix(containerName, letter)

        let people: Person[] = []
        for (let blobInfo of peopleBlobs) {
            let blobFile = await this.blobGetAsText(containerName, blobInfo.name)
            if (blobFile) {
                let person = JSON.parse(blobFile)
                people.push(person)
            }
        }
        console.log(`Library loaded ${letter}`)
        return people
    }

    public async uploadPhoto(user: User, person: Person, blobName: string, photoData: string) {

        let faceContainerName = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
                : GetContainer(user, ContainerType.PHOTOS)

        let matches = photoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let type = matches![1];
        let buffer = new Buffer(matches![2], 'base64');

        const options: azure.BlobService.CreateBlobRequestOptions = {
            contentSettings: {contentType:type}
        }
        await this.blobUploadText(faceContainerName, blobName, buffer, options)
    }

    public async uploadLocalFile(containerName: string, blobName: string, localFileName: string) {
        let blobData = await this.blobDoesExist(containerName, blobName)
        if (blobData.exists) {
            console.log(`ALREADY EXISTS: ${localFileName}`)
            return
        }
        await this.blobCreateFromLocalFile(containerName, blobName, localFileName)
    }

    
    public async blobCopyBlob(sourceBlobURI: string, targetcontainerName: string, targetBlobName: string): Promise<void> {
        const startCopyBlobAsync = promisify(this._blobService.startCopyBlob.bind(this._blobService))
        await startCopyBlobAsync(sourceBlobURI, targetcontainerName, targetBlobName,{})
    }

    public async blobGetAsText(containerName: string, blobName: string) {
        const getBlobToTextAsync = promisify(this._blobService.getBlobToText).bind(this._blobService)
        return await getBlobToTextAsync(containerName, blobName)
    }

    public async blobUploadStream(containerName: string, blobName: string, stream: any): Promise<void> {
        let createBlockBlobFromStreamAsync = promisify(this._blobService.createBlockBlobFromStream).bind(this._blobService)
        await createBlockBlobFromStreamAsync(containerName, blobName, stream)
    }

    public async blobUploadText(containerName: string, blobName: string, text: string | Buffer, options: azure.BlobService.CreateBlobRequestOptions = {}) {

        const createBlockBlobFromText = promisify(this._blobService.createBlockBlobFromText).bind(this._blobService)
        await createBlockBlobFromText(containerName, blobName, text, options)
    }

    public async blobDelete(containerName: string, blobName: string) {
        let deleteBlobAsync = promisify(this._blobService.deleteBlobIfExists).bind(this._blobService)
        await deleteBlobAsync(containerName, blobName)
    }

    public async blobDoesContainerExist(containerName: string): Promise<boolean> {
        let doesContainerExistAsync = promisify(this._blobService.doesContainerExist).bind(this._blobService)
        return (await doesContainerExistAsync(containerName, null as any)).exists
    }

    public async blobListWithPrefix(containerName: string, letter: string) {
        let listBlobsSegmentedAsync = promisify(this._blobService.listBlobsSegmentedWithPrefix).bind(this._blobService)
        return (await listBlobsSegmentedAsync(containerName, letter, null as any)).entries
    }

    public async blobDoesExist(containerName: string, blobName: string) {
        let doesBlobExistAsync = promisify(this._blobService.doesBlobExist).bind(this._blobService)
        return await doesBlobExistAsync(containerName, blobName)
    }
 
    public async blobDeleteContainer(containerName: string) {
        let deleteContainerAsync = promisify(this._blobService.deleteContainerIfExists).bind(this._blobService)
        await deleteContainerAsync(containerName)
    }

    public async blobCreateContainer(containerName: string, isPrivate: boolean) {
        let createContainerIfNotExists = promisify(this._blobService.createContainerIfNotExists).bind(this._blobService)
        await createContainerIfNotExists(containerName, 
            {
            publicAccessLevel: isPrivate ? null : 'blob'
          })
    }

    public async blobCreateFromLocalFile(containerName: string, blobName: string, localFileName: string) {
        let createBlockBlobFromLocalFileAsync = promisify(this._blobService.createBlockBlobFromLocalFile).bind(this._blobService)
        return await createBlockBlobFromLocalFileAsync(containerName, blobName, localFileName)
    }
}

export default BlobService.Instance()