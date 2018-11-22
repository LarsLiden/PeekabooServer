/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import { Person } from './Models/person'
import { User } from './Models/models'
import { cacheKey } from './Utils/util'
import { generateGUID, GetContainer, ContainerType } from './Utils/util'
import { TestResult } from './Models/performance'
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

    public async getUser(user: User): Promise<User> {
        if (!this.users) {
            this.users = await BlobService.getUsers()
        }
        let foundUser = this.users.find(u => u.id === user.id)

        if (foundUser) {
            return foundUser
        }
        // Add a new user
        user.hwmid = generateGUID()
        user.containerid = generateGUID()
        this.users.push(user)
        BlobService.updateUsers(this.users)

        // Create storate containers
        let imageContainer = GetContainer(user, ContainerType.FACES)
        await BlobService.createContainer(imageContainer, false) 

        let dataContainer = GetContainer(user, ContainerType.DATA)
        await BlobService.createContainer(dataContainer, true) 
        return user
    }

    public async getPeopleStartingWith(user: User, letter: string) {
        let people: Person[] = Cache.Get(letter)
        if (!people) {
            people = await BlobService.getPeopleStartingWith(user, letter)
            Cache.Set(letter, people)
        }
        return people
    }

    public postTestResults(user: User, testResults: TestResult[]) : void
    {
        // LARS TODO
        /*
        // Generate list of changed people
        let changedPeople: Person[] = []
        for (const testResult of testResults) {
            // Add copy if haven't already added
            if (!changedPeople.find(p => p.guid === testResult.guid)) {
                let foundPerson = this.getPerson(testResult.guid)
                if (!foundPerson) {
                    throw new Error("Can't find person")
                }
                let personCopy = new Person(foundPerson)
                changedPeople.push(personCopy)
            }
        }

        // Now add test results to copy
        for (const testResult of testResults) {
            let editPerson = changedPeople.find(p => p.guid === testResult.guid)      
            
            // TODO: cover all perf types
            editPerson!.photoPerformance.AddResult(testResult.result)
        }

        // Now save changed people
        for (const person of changedPeople) {
            BlobService.uploadPerson(person)
        }*/
    }

    public async deletePerson(user: User, key: string, personGUID: string) : Promise<void>
    {
        let people: Person[] = Cache.Get(key)
        // If not in cache load
        if (!people) {
            people = await this.getPeopleStartingWith(user, key)
        }
        let person = people.find(p => p.guid === personGUID)
        if (!person) {
            throw new Error("Can't find person")
        }

        await BlobService.deletePerson(user, person)

        // Update cache
        this.cacheDeletePerson(user, person)
    }

    public putPersonImage(user: User, personGUID: string, image: Buffer) : void
    {
        // LARS TODO
    /*    let person = this.getPerson(personGUID)
        if (!person) {
            throw new Error("Can't find person")
        }

        // Make a copy
        const personObj = new Person({...person})
        const imageSaveName = personObj.getNextPhotoName()
        
        // Save image
        let containername = person.isArchived ? "archive-faces" : "faces"

        try {
            BlobService.uploadBlob(containername, imageSaveName, image)

            // Add to person
            personObj.photoFilenames.push(imageSaveName)
            
            // Invalidate cache (TODO)

            // Replace data on server
            BlobService.uploadPerson(person)
        }
        catch (error) {
            throw error
        }*/
    }

    public async putPerson(user: User, person: Person) : Promise<void>
    {        
        // Replace data on server
        await BlobService.uploadPerson(user, person)

        // Update cache
        this.cacheReplacePerson(user, person)
    }

    public cacheReplacePerson(user: User, person: Person) : void {
        const key = cacheKey(person)
        let peopleCache: Person[] = Cache.Get(key)
        if (peopleCache) {
            peopleCache = peopleCache.filter(p => p.guid !== person.guid)
            peopleCache.push(person)
            Cache.Set(key, peopleCache)
        }
    }

    public cacheDeletePerson(user: User, person: Person) : void {
        const key = cacheKey(person)
        let peopleCache: Person[] = Cache.Get(key)
        if (peopleCache) {
            peopleCache = peopleCache.filter(p => p.guid !== person.guid)
            Cache.Set(key, peopleCache)
        }
    }
}

export default DataProvider.Instance()