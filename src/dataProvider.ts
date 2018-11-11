import { Person } from './Models/person'
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
 
    public static Instance(): DataProvider {
        if (!this._instance) {
            this._instance = new DataProvider()
        }
        return this._instance
    }

    public async getPeopleStartingWith(letter: string) {
        let people: Person[] = Cache.Get(letter)
        if (!people) {
            people = await BlobService.getPeopleStartingWith(letter)
            Cache.Set(letter, people)
        }
        return people
    }

    public postTestResults(testResults: TestResult[]) : void
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

    public putPersonImage(personGUID: string, image: Buffer) : void
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

    public putPerson(person: Person) : void
    {        
        // Invalidate cache
        const cacheKey = person.saveName[0]
        Cache.Invalidate(cacheKey)

        // Replace data on server
        BlobService.uploadPerson(person)
    }
}

export default DataProvider.Instance()