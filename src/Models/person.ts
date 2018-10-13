import { Performance, Relationship, SocialNet } from "./performance";
import { PerfType, QuizPerson } from './models'

export class Person {
    _photoFNs: string[] = []
    _nextPhotoIndex: number = 0
    _tags: string[] = []    // ENUM LARS
    _keyValues: any[]  = [] // TODO LARS
    _photoPerformance: Performance = new Performance()
    _namePerformance: Performance = new Performance()
    _descPerformance: Performance = new Performance()
    _socialNets: SocialNet[] = []
    _events: [{}]  = [{}] // LARS?? 
    _relationships: Relationship[] = []
    NickName: string = ""
    MaidenName: string= ""
    MyGuid: string= ""
    IsArchived: boolean = false
    FirstName: string = ""
    LastName: string = ""
    FullName: string = ""
    FullMaidenName: string = ""
    FullNickName: string = ""
    AlternateName: string = ""
    FullAternateName: string = ""
    LongName: string = ""
    DescriptionWithKeyValues: string = ""
    AllKeyValues: string = ""
    Description: string = ""
    PersonType: number = 0 // LARS enum
    CreationDate: string = ""
    DirName: string = ""

    public constructor(init?: Partial<Person>) {
        Object.assign(this, init)
    }

    public toQuizPerson(perfType: PerfType): QuizPerson {
        return {
            fullName: this.FullName,
            blobNames: this._photoFNs,
            performance: this.performance(perfType)
          } as QuizPerson
    }

    public performance(perfType: PerfType): Performance {
        switch (perfType) {
            case PerfType.PHOTO: 
                return new Performance(this._photoPerformance)
            case PerfType.DESC:
                return new Performance(this._descPerformance)
            case PerfType.NAME:
                return new Performance(this._namePerformance)
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
                return (this._photoFNs.length > 0);
            case PerfType.NAME:
                return (this.FullName != "");
            case PerfType.DESC:
                return (this.Description != "");
            case PerfType.ALPHA:
                return true;
        }
        return false;
    }
    
}