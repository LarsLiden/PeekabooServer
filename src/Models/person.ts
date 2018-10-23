import { Performance, SocialNet } from "./performance";
import { Relationship } from "./relationship"
import { PerfType, QuizPerson, LibraryPerson } from './models'

export class Person {
    photoFilenames: string[] = []
    tags: string[] = []   
    keyValues: { [s: string]: string }  = {} 
    photoPerformance: Performance = new Performance()
    namePerformance: Performance = new Performance()
    descPerformance: Performance = new Performance()
    socialNets: SocialNet[] = []
    events: Event[]  = [] 
    relationships: Relationship[] = []
    nickName: string = ""
    maidenName: string= ""
    guid: string= ""
    isArchived: boolean = false
    firstName: string = ""
    lastName: string = ""
    fullName: string = ""
    fullMaidenName: string = ""
    fullNickName: string = ""
    alternateName: string = ""
    fullAternateName: string = ""
    longName: string = ""
    descriptionWithKeyValues: string = ""
    allKeyValues: string = ""
    description: string = ""
    //personType: number = 0 // LARS not used
    creationDate: string = ""
    //dirName: string = "" // LARS not used

    public constructor(init?: Partial<Person>) {
        Object.assign(this, init)
    }

    public toQuizPerson(perfType: PerfType): QuizPerson {
        return {
            guid: this.guid,
            fullName: this.fullName,
            blobNames: this.photoFilenames,
            performance: this.performance(perfType)
          } as QuizPerson
    }

    public toLibraryPerson(perfType: PerfType): LibraryPerson {
        return {
            guid: this.guid,
            fullName: this.fullName,
            blobName: this.photoFilenames[0],
            tags: this.tags
          } as LibraryPerson 
    }

    public performance(perfType: PerfType): Performance {
        switch (perfType) {
            case PerfType.PHOTO: 
                return new Performance(this.photoPerformance)
            case PerfType.DESC:
                return new Performance(this.descPerformance)
            case PerfType.NAME:
                return new Performance(this.namePerformance)
        }
        throw new Error("invalid perfType")
    }

    // Does person have data to take test type?
    public hasTestData(perfType: PerfType): boolean
    {
        // Excluce people that don't have data for test type
        switch (perfType)
        {
            case PerfType.PHOTO:
                return (this.photoFilenames.length > 0);
            case PerfType.NAME:
                return (this.fullName != "");
            case PerfType.DESC:
                return (this.description != "");
            case PerfType.ALPHA:
                return true;
        }
        return false;
    }
    
}