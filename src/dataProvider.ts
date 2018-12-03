/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import { Person } from './Models/person'
import { User } from './Models/user'
import { generateGUID, GetContainer, ContainerType, getNextPhotoName, cacheKey, keyFromSaveName, cacheKeyFromUser, getPhotoBlobName } from './Utils/util'
import { TestResult, addResult} from './Models/performance'
import { Cache } from './Models/cache'
import BlobService from './Utils/blobService'

export function replace<T>(xs: T[], updatedX: T, getId: (x: T) => object | number | string): T[] {
    const index = xs.findIndex(x => getId(x) === getId(updatedX))
    if (index < 0) {
        throw new Error(`You attempted to replace item in list with id: ${getId(updatedX)} but no item could be found.  Perhaps you meant to add the item to the list or it was already removed.`)
    }

    return [...xs.slice(0, index), updatedX, ...xs.slice(index + 1)]
}

// TODO - make into namespace not a class
class DataProvider {
 
    private static _instance: DataProvider
    private users: User[] | null = null
 
    public static Instance(): DataProvider {
        if (!this._instance) {
            this._instance = new DataProvider()
        }
        return this._instance
    }

    public async userFromId(hwmid: string): Promise<User | undefined> {
        if (!this.users) {
            this.users = await BlobService.getUsers()
        }
        return this.users.find(u => u.hwmid === hwmid)
    }

    public async deleteUser(containerId: string): Promise<void> {
        await BlobService.blobDeleteContainer(`${ContainerType.PHOTOS}${containerId}`)
        await BlobService.blobDeleteContainer(`${ContainerType.DATA}${containerId}`)
        await BlobService.blobDeleteContainer(`${ContainerType.ARCHIVE_DATA}${containerId}`)
        await BlobService.blobDeleteContainer(`${ContainerType.ARCHIVE_PHOTOS}${containerId}`)
    }

    public async getUser(user: User): Promise<User> {
        if (!this.users) {
            this.users = await BlobService.getUsers()
        }

        await this.deleteUser("06c44648-70e6-4d35-9ca5-2be34bf06ccc")
        await this.deleteUser("f27afe7c-7cfa-4610-93df-8a01216652fd")

        // TODO: validate client
        let foundUser = this.users.find(u => u.googleId === user.googleId)

        if (foundUser) {
            foundUser.lastUsedDatTime = new Date().toJSON()
            let users = this.users.filter(u => u.googleId != user.googleId)
            users.push(foundUser)
            BlobService.updateUsers(this.users)
            return foundUser
        }
        // Add a new user
        user.hwmid = generateGUID()
        user.containerId = generateGUID()
        user.createdDateTime = new Date().toJSON()
        user.lastUsedDatTime = new Date().toJSON()
        this.users.push(user)
        BlobService.updateUsers(this.users)

        // Create storate containers
        let photoContainer = GetContainer(user, ContainerType.PHOTOS)
        await BlobService.blobCreateContainer(photoContainer, false) 

        let dataContainer = GetContainer(user, ContainerType.DATA)
        await BlobService.blobCreateContainer(dataContainer, true) 
        return user
    }

    public async getPeopleStartingWith(user: User, letter: string) {
        let cKey = cacheKey(user, letter)
        let people: Person[] = Cache.Get(cKey)
        if (!people) {
            people = await BlobService.getPeopleStartingWith(user, letter)
            Cache.Set(cKey, people)
        }
        return people
    }

    public async postTestResults(user: User, testResults: TestResult[]) : Promise<Person[]>
    {
        // Generate list of changed people
        let changedPeople: Person[] = []
        for (const testResult of testResults) {
            // Add copy if haven't already added
            if (!changedPeople.find(p => p.guid === testResult.guid)) {
                let existingPerson = await this.getPerson(user, testResult.saveName, testResult.guid)
                if (!existingPerson) {
                    throw Error("Unknown Person")
                }
                let personCopy = {...existingPerson}
                changedPeople.push(personCopy)
            }
        }

        // Now add test results to copy
        for (const testResult of testResults) {
            let editPerson = changedPeople.find(p => p.guid === testResult.guid)      
            
            // TODO: cover all perf types
            addResult(editPerson!.photoPerformance, testResult.result)
        }

        // Now save changed people
        for (const person of changedPeople) {
            await BlobService.uploadPerson(user, person) 
            // Update cache
            this.cacheReplacePerson(user, person)
        }
        return changedPeople
    }

    public async getPerson(user: User, saveName: string, guid: string): Promise<Person | null> {

        // First look in cache
        let key = keyFromSaveName(saveName)
        let cKey = cacheKey(user, key)
        let people: Person[] = Cache.Get(cKey)
        if (people) {
            let person = people.find(p => p.guid === guid)
            if (person) {
                return person
            }
        }
        // Otherwise load it
        return await BlobService.getPerson(user, saveName, guid)
    }

    public async getPersonSlow(user: User, key: string, personGUID: string) : Promise<Person> {
        let cKey = cacheKey(user, key)
        let people: Person[] = Cache.Get(cKey)
        // If not in cache load
        if (!people) {
            people = await this.getPeopleStartingWith(user, key)
        }
        let person = people.find(p => p.guid === personGUID)
        if (!person) {
            throw new Error("Can't find person")
        }
        return person
    }

    public async deletePerson(user: User, key: string, personGUID: string) : Promise<void>
    {
        let person = await this.getPersonSlow(user, key, personGUID)
        await BlobService.deletePerson(user, person)

        // Update cache
        this.cacheDeletePerson(user, person)
    }

    public async putPhoto(user: User, key: string, personGUID: string, photoData: string) : Promise<string>
    {
        let person = await this.getPersonSlow(user, key, personGUID)
        const photoName = getNextPhotoName(person)
        
        try {
            const blobPhotoName = getPhotoBlobName(person, photoName)
            await BlobService.uploadPhoto(user, person, blobPhotoName, photoData)

            // Add to person
            person.photoFilenames.push(photoName)
            
            // Update cache
            this.cacheReplacePerson(user, person)

            // Replace data on server
            await BlobService.uploadPerson(user, person)

            return photoName
        }
        catch (error) {
            throw error
        }
    }

    public async deletePhoto(user: User, key: string, personGUID: string, photoName: string) : Promise<void>
    {
        let person = await this.getPersonSlow(user, key, personGUID)
        const photoBlobName = getPhotoBlobName(person, photoName)
        await BlobService.deletePhoto(user, person, photoBlobName)

        // Update person
        person.photoFilenames = person.photoFilenames.filter(p => p !== photoName)
        this.cacheReplacePerson(user, person)
    }
 
    public async archive(user: User, key: string, personGUID: string) : Promise<void> {
        let person = await this.getPersonSlow(user, key, personGUID)
        await BlobService.archivePerson(user, person)
        this.cacheDeletePerson(user, person)
    }

    public async putPerson(user: User, person: Person) : Promise<void>
    {        
        // Replace data on server
        await BlobService.uploadPerson(user, person)

        // Update cache
        this.cacheReplacePerson(user, person)
    }

    public cacheReplacePerson(user: User, person: Person) : void {
        const cKey = cacheKeyFromUser(user, person)
        let peopleCache: Person[] = Cache.Get(cKey)
        if (peopleCache) {
            peopleCache = peopleCache.filter(p => p.guid !== person.guid)
            peopleCache.push(person)
            Cache.Set(cKey, peopleCache)
        }
    }

    public cacheDeletePerson(user: User, person: Person) : void {
        const cKey = cacheKeyFromUser(user, person)
        let peopleCache: Person[] = Cache.Get(cKey)
        if (peopleCache) {
            peopleCache = peopleCache.filter(p => p.guid !== person.guid)
            Cache.Set(cKey, peopleCache)
        }
    }
}

export default DataProvider.Instance()