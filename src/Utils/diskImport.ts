/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as fs from 'fs'
import * as path from 'path'
import * as util from './util'
import { Cache } from '../Models/cache'
import { Person } from '../Models/person'
import { Performance } from '../Models/performance'
import { RelationshipType, Relationship } from '../Models/relationship'
import { Event, SocialNetType, SocialNet } from '../Models/models'
import { User } from '../Models/user'
import BlobService from './blobService'

// DISABLE
const MAX_UPLOAD = 0
const NO_UPLOAD = true

const dataPath = path.join(process.cwd(), './data')
export default class DiskImport {

    public static async UploadLocalFiles(user: User) {
        let diskImport = new DiskImport()
        await diskImport.UploadLocalFiles(user)
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
                value: kv.Value,
                keyValueId: util.generateGUID()
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
                eventId: util.generateGUID(),
                date: date.toJSON(),  
                description: e.Description,
                location: e.Location
            } as Event
        })
        
        let socialNets = rawPerson._socialNets.map((sn: any) => {
            return {
                socialNetId: util.generateGUID(),
                URL: sn.URL,
                profileID: sn.profileId,
                netType: sn.netType === 0 ? SocialNetType.LINKEDIN : SocialNetType.FACEBOOK
            } as SocialNet
        })

        let person = {
            importGUID: rawPerson.MyGuid,
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
            personId: util.generateSaveName(rawPerson.FirstName, rawPerson.LastName),
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
            const photoName = util.getNextPhotoName(person)
            const photoBlobName = util.getPhotoBlobName(person, photoName)

            person.photoFilenames.push(photoName)
            
            let containername = person.isArchived 
                ? util.GetContainer(user, util.ContainerType.ARCHIVE_PHOTOS)
                : util.GetContainer(user, util.ContainerType.PHOTOS)

            if (!NO_UPLOAD) {
                BlobService.uploadLocalFile(containername, photoBlobName, localPhotoFile)
            }
        })
        return person
    }

    public connectRelationships(people: Person[]) {
        people.forEach(person => {
            person.relationships.forEach(relationship => {
                if (!relationship.relationshipId) {
                    let relationshipId = util.generateGUID()
                    relationship.relationshipId = relationshipId

                    // Find reverse person
                    let partner = people.find(p => p.importGUID === relationship.personId)
                    if (partner) {
                        // Replace old guid with personId
                        relationship.personId = partner.personId

                        // find reverse relationship
                        let reverse = partner.relationships.find(r => r.personId === person.importGUID)
                        if (reverse) {
                            // Add matching relationshipId
                            reverse.relationshipId = relationshipId
                            // Replace old guid with personId
                            reverse.personId = person.personId
                        }
                        else {
                            console.log(`making: ${person.firstName} ${person.lastName} ${relationship.type.from} ${partner.firstName} ${partner.lastName} `)
                            let reverseRelationship: Relationship =  {
                                relationshipId: relationship.relationshipId,
                                personId: person.personId,
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

    private async deleteBlob(containerId: string) {
        // Delete blobs
        await BlobService.blobDeleteContainer(`${util.ContainerType.PHOTOS}${containerId}`)
        await BlobService.blobDeleteContainer(`${util.ContainerType.DATA}${containerId}`)
        await BlobService.blobDeleteContainer(`${util.ContainerType.ARCHIVE_DATA}${containerId}`)
        await BlobService.blobDeleteContainer(`${util.ContainerType.ARCHIVE_PHOTOS}${containerId}`)
    }

    public async UploadLocalFiles(user: User): Promise<void> {
        //Manual Cleanup
        this.deleteBlob("727a504f-4ba1-459c-bbbd-36ae2c9280e6")
            
        // Create storage containers
        let photoContainer = util.GetContainer(user, util.ContainerType.PHOTOS)
        await BlobService.blobCreateContainer(photoContainer, false) 

        let dataContainer = util.GetContainer(user, util.ContainerType.DATA)
        await BlobService.blobCreateContainer(dataContainer, true) 

        let photoArchiveContainer = util.GetContainer(user, util.ContainerType.ARCHIVE_PHOTOS)
        await BlobService.blobCreateContainer(photoArchiveContainer, false) 

        let dataArchiveContainer = util.GetContainer(user, util.ContainerType.ARCHIVE_DATA)
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
        let uploadCount = 0

        let people: Person[] = []
        personFiles.forEach(personFile => {
            uploadCount = uploadCount + 1
            if (uploadCount < MAX_UPLOAD) {
            try {
                people.push(this.importPersonFile(user, personFile, photoFiles))
            }
            catch (error) {
                console.log("ERR: "+JSON.stringify(error))
            }
        }
        })

        this.connectRelationships(people)

        for (let person of people) {
            // Upload the person file (don't await)
            if (!NO_UPLOAD) {
                await BlobService.uploadPerson(user, person)
                console.log(`Uploaded: ${person.personId}`)
            }
        }
        Cache.ClearAll()
        console.log("DONE!")
    }
}

