import * as fs from 'fs'
import * as path from 'path'
import { Person } from '../Models/person'
import { Performance } from '../Models/performance'
import { RelationshipType, Relationship } from '../Models/relationship'
import { Event, SocialNetType, SocialNet } from '../Models/models'
import BlobService from './blobHandler'

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
                guid: r._guid,
                type: RelationshipType.getRelationshipType(r._type._name)
            } as Relationship
        })

        let events = rawPerson._events.map((e: any) => {
            return {
                date: e.Date,
                description: e.Description,
                location: e.Location
            } as Event
        })
        
        let socialNets = rawPerson._socialNets.map((sn: any) => {
            return {
                URL: sn.URL,
                profileID: sn.profileId,
                netType: sn.netType === 0 ? SocialNetType.LINKEDIN : SocialNetType.FACEBOOK
            } as SocialNet
        })

        let person = {
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
            guid: rawPerson.MyGuid,
            isArchived: rawPerson.IsArchived,
            firstName: rawPerson.FirstName,
            lastName: rawPerson.LastName,
            fullMaidenName: rawPerson.FullMaidenName,
            fullNickName: rawPerson.FullNickName,
            alternateName: rawPerson.AlternateName,
            fullAternateName: rawPerson.FullAternateName,
            saveName: rawPerson.LongName,
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

    private importPersonFile(personFile: string, imageFiles: string[]): void {
       
        // Get name from person file
        let cutPos = dataPath.length + 1
        let personFileSplit = personFile.substr(cutPos).split(`\\\\`)
        let nameString = personFileSplit[1]

        // Retrieve image files for this name
        let myImageFiles = imageFiles.filter(ifilename => {
            let imageFileSplit = ifilename.substr(cutPos).split(`\\\\`)
            return imageFileSplit[1] === nameString
        })

        // Load the person
        let person = this.getPersonFromFile(personFile)

        // Upload photos and update links
        if (person.photoFilenames.length != myImageFiles.length) {
            throw new Error("Wrong number of files found")
        }
        person.photoFilenames = []
        myImageFiles.forEach(localImageFile => {
            let imageBlobPath = localImageFile.substr(cutPos).split(`\\\\`).join(`\\`)
            person.photoFilenames.push(imageBlobPath)
            let containername = person.isArchived ? "archive-faces" : "faces"
            BlobService.uploadFile(containername, imageBlobPath, localImageFile)
        })

        person.saveName = personFileSplit[1]

        // Upload the person file
      //TEMP  BlobService.uploadPerson(person)
    }

    public UploadLocalFiles(): void {
        let fileNames = this.walkSync(dataPath, [])   

        let imageFiles: string[] = []
        let personFiles: string[] = []
        for (let i=0;i<fileNames.length;i++) {
            let df = fileNames[i]
  
            // Sort the files into types
            if (df.endsWith('json')) {
                personFiles.push(df)
            }
            else if (!df.endsWith('pbd')) {
                imageFiles.push(df)
            }   
        }
        personFiles.forEach(personFile => {
            try {
                this.importPersonFile(personFile, imageFiles)
            }
            catch (error) {
                console.log("ERR: "+JSON.stringify(error))
            }
        })
        console.log("DONE!")
    }
}

export default Util.Instance()