import * as fs from 'fs'
import * as path from 'path'
import { Person } from '../Models/person'
import { Performance } from '../Models/performance'
import { RelationshipType, Relationship } from '../Models/relationship'
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

        let keyValues: { [s: string]: string } = {}
        rawPerson._keyValues.forEach((kv: any) => {
            keyValues[kv.Key] = kv.Value
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
            }
        })

        let person = {
            photoFilenames: rawPerson._photoFNs,
            tags: rawPerson._tags,
            keyValues,
            photoPerformance,
            namePerformance,
            descPerformance,
            socialNets: rawPerson._socialNets,
            events,
            relationships,
            nickName: rawPerson.NickName,
            maidenName: rawPerson.MaidenName,
            guid: rawPerson.MyGuid,
            isArchived: rawPerson.IsArchived,
            firstName: rawPerson.FirstName,
            lastName: rawPerson.LastName,
            fullName: rawPerson.FullName,
            fullMaidenName: rawPerson.FullMaidenName,
            fullNickName: rawPerson.FullNickName,
            alternateName: rawPerson.AlternateName,
            fullAternateName: rawPerson.FullAternateName,
            longName: rawPerson._LongName,
            descriptionWithKeyValues: rawPerson.DescriptionWithKeyValues,
            allKeyValues: rawPerson.AllKeyValues,
            description: rawPerson._Description,
            creationDate: rawPerson._CreationDate
        } as Person

        if (rawPerson.DescriptionWithKeyValues.length > 2) {
            console.log("EVENTS!")
        }
        if (rawPerson.AllKeyValues.length > 2) {
            console.log("EVENTS!")
        }

        person.photoPerformance.lastTested = Date.now()
        person.namePerformance.lastTested = Date.now()
        person.descPerformance.lastTested = Date.now() 

        return person
    }

    private processPersonFile(personFile: string, imageFiles: string[]): void {
       
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

        // Upload the person file
        let dataContainerName = person.isArchived ? "archive-data" : "data"
        let dataBlobPath = personFileSplit[0]+'\\'+personFileSplit[1]+'.json'
        BlobService.uploadText(dataContainerName, dataBlobPath, JSON.stringify(person))
    }

    public UploadLocalFiles(): void {
        let fileNames = this.walkSync(dataPath, [])   

        let imageFiles: string[] = []
        let personFiles: string[] = []
        for (let i=0;i<200;i++) {
            let df = fileNames[i]
  
            // Sort the files into types
            if (df.endsWith('json')) {
                personFiles.push(df)
            }
            else if (!df.endsWith('pbd')) {
                imageFiles.push(df)
            }   
        }
        personFiles.forEach(personFile => this.processPersonFile(personFile, imageFiles))
    }
}

export default Util.Instance()