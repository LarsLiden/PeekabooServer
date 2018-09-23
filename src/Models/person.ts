import { Relationship, SocialNet } from "./performance";

export interface Person {
    _photoFNs: string[]
    _nextPhotoIndex: number
    _tags: string[]    // ENUM
    _keyValues: any[]  // TODO
    _photoPerformance: Performance
    _namePerformance: Performance
    _descPerformance: Performance
    _socialNets: SocialNet[]
    _events: [{}]  // ??
    _relationships: Relationship[]
    NickName: string
    MaidenName: string
    MyGuid: string
    IsArchived: boolean
    FirstName: string
    LastName: string
    FullName: string
    FullMaidenName: string
    FullNickName: string
    AlternateName: string
    FullAternateName: string
    LongName: string
    DescriptionWithKeyValues: string
    AllKeyValues: string
    Description: string
    PersonType: number, // enum
    CreationDate: string
    DirName: string
}