/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as fs from 'fs'
import * as path from 'path'
import { Cache } from '../Models/cache'
import { Person } from '../Models/person'
import { Performance } from '../Models/performance'
import { RelationshipType, Relationship } from '../Models/relationship'
import { Event, SocialNetType, SocialNet } from '../Models/models'
import { User } from '../Models/user'
import BlobService from './blobService'

const MAX_UPLOAD = 50
const NO_UPLOAD = false

const dataPath = path.join(process.cwd(), './data')
class Util {

    private static instance: Util

    public static Instance() : Util {
        if (!this.instance) {
            this.instance = new Util()
        }
        return this.instance
    }

    // List all files in a directory in Node.js recursively in a synchronous fashion
    public walkSync(dir: string, filelist: string[]): string[] {
    
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(file => {
            if (fs.statSync(dir + '\\' + file).isDirectory()) {
                filelist = this.walkSync(dir+ '\\' + file + '\\', filelist);
            }
            else {
                filelist.push(dir + '\\' + file);
            }
        });
        return filelist;
    }

    public getPersonFromFile(fileName: string): Person {
        let fileContent = fs.readFileSync(fileName, 'utf-8')
        let rawPerson = JSON.parse(fileContent) 

        let photoPerformance = {
            bestTime: rawPerson._photoPerformance.BestTime,
            avgTime : rawPerson._photoPerformance.AvgTime,
            worstTime: rawPerson._photoPerformance.WorstTime,
            numPresentations: rawPerson._photoPerformance.NumPresentations,
            frequency: rawPerson._photoPerformance.Frequency,
            rank: rawPerson._photoPerformance.Rank,
            lastTested: rawPerson._photoPerformance.lastTested,
            familiarity: rawPerson._photoPerformance.Familiarity,
            frequencyOffsetStart: rawPerson._photoPerformance.FrequencyOffset,
            frequencyOffsetEnd: rawPerson._photoPerformance.FrequencyOffsetEnd
        } as Performance

        let namePerformance = {
            bestTime: rawPerson._namePerformance.BestTime,
            avgTime : rawPerson._namePerformance.AvgTime,
            worstTime: rawPerson._namePerformance.WorstTime,
            numPresentations: rawPerson._namePerformance.NumPresentations,
            frequency: rawPerson._namePerformance.Frequency,
            rank: rawPerson._namePerformance.Rank,
            lastTested: rawPerson._namePerformance.lastTested,
            familiarity: rawPerson._namePerformance.Familiarity,
            frequencyOffsetStart: rawPerson._namePerformance.FrequencyOffset,
            frequencyOffsetEnd: rawPerson._namePerformance.FrequencyOffsetEnd
        } as Performance

        let descPerformance = {
            bestTime: rawPerson._descPerformance.BestTime,
            avgTime : rawPerson._descPerformance.AvgTime,
            worstTime: rawPerson._descPerformance.WorstTime,
            numPresentations: rawPerson._descPerformance.NumPresentations,
            frequency: rawPerson._descPerformance.Frequency,
            rank: rawPerson._descPerformance.Rank,
            lastTested: rawPerson._descPerformance.lastTested,
            familiarity: rawPerson._descPerformance.Familiarity,
            frequencyOffsetStart: rawPerson._descPerformance.FrequencyOffset,
            frequencyOffsetEnd: rawPerson._descPerformance.FrequencyOffsetEnd
        } as Performance

        let keyValues = rawPerson._keyValues.map((kv: any) => {
            return {
                key: kv.Key,
                value: kv.Value
            }
        })

        let relationships = rawPerson._relationships.map((r: any) => {
            return {
                personId: r._guid,
                type: RelationshipType.getRelationshipType(r._type._name)
            } as Relationship
        })

        let events = rawPerson._events.map((e: any) => {
            let date = new Date(e.Date) 
            return {
                id: generateGUID(),
                date: date.toJSON(),  
                description: e.Description,
                location: e.Location
            } as Event
        })
        
        let socialNets = rawPerson._socialNets.map((sn: any) => {
            return {
                id: generateGUID(),
                URL: sn.URL,
                profileID: sn.profileId,
                netType: sn.netType === 0 ? SocialNetType.LINKEDIN : SocialNetType.FACEBOOK
            } as SocialNet
        })

        let person = {
            guid: rawPerson.MyGuid,
            photoFilenames: rawPerson._photoFNs,
            tags: rawPerson._tags,
            keyValues,
            photoPerformance,
            namePerformance,
            descPerformance,
            socialNets: socialNets,
            events,
            relationships,
            nickName: rawPerson.NickName,
            maidenName: rawPerson.MaidenName,
            isArchived: rawPerson.IsArchived,
            firstName: rawPerson.FirstName,
            lastName: rawPerson.LastName,
            fullMaidenName: rawPerson.FullMaidenName,
            fullNickName: rawPerson.FullNickName,
            alternateName: rawPerson.AlternateName,
            fullAternateName: rawPerson.FullAternateName,
            saveName: `${rawPerson.FirstName}_${rawPerson.LastName}`.replace(/[\W_]+/g,"").replace(" ",""),
            descriptionWithKeyValues: rawPerson.DescriptionWithKeyValues,
            allKeyValues: rawPerson.AllKeyValues,
            description: rawPerson.Description,
            creationDate: rawPerson.CreationDate
        } as Person

        person.photoPerformance.lastTested = Date.now()
        person.namePerformance.lastTested = Date.now()
        person.descPerformance.lastTested = Date.now() 

        return person
    }

    private importPersonFile(user: User, personFile: string, imageFiles: string[]): Person {
       
        // Get name from person file
        let cutPos = dataPath.length + 1
        let personFileSplit = personFile.substr(cutPos).split(`\\\\`)
        let nameString = personFileSplit[1]

        // Retrieve image files for this name
        let myPhotoFiles = imageFiles.filter(ifilename => {
            let imageFileSplit = ifilename.substr(cutPos).split(`\\\\`)
            return imageFileSplit[1] === nameString
        })

        // Load the person
        let person = this.getPersonFromFile(personFile)

        // Upload photos and update links
        if (person.photoFilenames.length != myPhotoFiles.length) {
            throw new Error("Wrong number of files found")
        }
        person.photoFilenames = []
        myPhotoFiles.forEach(localPhotoFile => {
            const photoName = getNextPhotoName(person)
            const photoBlobName = getPhotoBlobName(person, photoName)

            person.photoFilenames.push(photoName)
            
            let containername = person.isArchived 
                ? GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
                : GetContainer(user, ContainerType.PHOTOS)

            if (!NO_UPLOAD) {
                BlobService.uploadLocalFile(containername, photoBlobName, localPhotoFile)
            }
        })

        person.saveName = personFileSplit[1]

        return person
    }

    public connectRelationships(people: Person[]) {
        people.forEach(person => {
            person.relationships.forEach(relationship => {
                if (!relationship.id) {
                    let id = generateGUID()
                    relationship.id = id
                    // Find reverse relationship
                    let partner = people.find(p => p.guid === relationship.personId)
                    if (partner) {
                        let reverse = partner.relationships.find(r => r.personId === person.guid)
                        if (reverse) {
                            reverse.id = id
                        }
                        else {
                            console.log(`making: ${person.firstName} ${person.lastName} ${relationship.type.from} ${partner.firstName} ${partner.lastName} `)
                            let reverseRelationship: Relationship =  {
                                id: relationship.id,
                                personId: person.guid,
                                type: RelationshipType.getRelationshipType(relationship.type.to)
                            }
                            partner.relationships.push(reverseRelationship)
                        }
                    }
                    else {
                        console.log(`!!!! Connect: Missing person: ${person.firstName} ${person.lastName}`)
                    }
                }
            })
        })
    }

    public async UploadLocalFiles(user: User): Promise<void> {
        Cache.ClearAll()

        // Create storate containers
        let photoContainer = GetContainer(user, ContainerType.PHOTOS)
        await BlobService.blobCreateContainer(photoContainer, false) 

        let dataContainer = GetContainer(user, ContainerType.DATA)
        await BlobService.blobCreateContainer(dataContainer, true) 

        let photoArchiveContainer = GetContainer(user, ContainerType.ARCHIVE_PHOTOS)
        await BlobService.blobCreateContainer(photoArchiveContainer, false) 

        let dataArchiveContainer = GetContainer(user, ContainerType.ARCHIVE_DATA)
        await BlobService.blobCreateContainer(dataArchiveContainer, true) 

        let fileNames = this.walkSync(dataPath, [])   

        let photoFiles: string[] = []
        let personFiles: string[] = []
        for (let i=0;i<fileNames.length;i++) {
            let df = fileNames[i]
  
            // Sort the files into types
            if (df.endsWith('json')) {
                personFiles.push(df)
            }
            else if (!df.endsWith('pbd')) {
                photoFiles.push(df)
            }   
        }
        let temp = 0

        let people: Person[] = []
        personFiles.forEach(personFile => {
            temp = temp + 1
            if (temp < MAX_UPLOAD) {
            try {
                people.push(this.importPersonFile(user, personFile, photoFiles))
            }
            catch (error) {
                console.log("ERR: "+JSON.stringify(error))
            }
        }
        })

        this.connectRelationships(people)

        people.forEach(person => {
            // Upload the person file (don't await)
            if (!NO_UPLOAD) {
                BlobService.uploadPerson(user, person)
            }
        })
        console.log("DONE!")
    }
}

export enum ContainerType { 
    PHOTOS = "photos-",
    DATA = "data-hwm-",
    ARCHIVE_PHOTOS = "archive-photos-",
    ARCHIVE_DATA = "archive-data-hwm-"
}

export function GetContainer(user: User, type: ContainerType) {
    return `${type}${user.containerId}`
}

export function generateGUID(): string {
    let d = new Date().getTime()
    let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      let r = ((d + Math.random() * 16) % 16) | 0
      d = Math.floor(d / 16)
      return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    return guid
}

export function cacheKey(user: User, letter: string): string {
    return `${letter}_${user.containerId}`
} 

export function cacheKeyFromUser(user: User, person: Person): string {
    return `${personKey(person)}_${user.containerId}`
} 

export function keyFromSaveName(saveName: string): string {
    return saveName![0].toUpperCase()
}
export function personKey(person: Person): string {
    return keyFromSaveName(person.saveName)
} 

export function getPhotoBlobName(person: Person, photoName: string) {
    return `${personKey(person)}/${person.saveName}/${photoName}`
}

export function getNextPhotoName(person: Person): string {
    let index = 1
    while (true) {
        let saveName = `${person.saveName}_${index}.png`
        if (person.photoFilenames.includes(saveName)) {
            index = index + 1
        }
        else {
            return saveName
        }
    }
}

export default Util.Instance()