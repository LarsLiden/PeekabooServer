import { Performance } from "./performance";
import { Relationship } from "./relationship"
import { Event, KeyValue, SocialNet } from './models'

export interface Person {
    photoFilenames: string[]
    tags: string[]  
    keyValues: KeyValue[]
    photoPerformance: Performance
    namePerformance: Performance
    descPerformance: Performance
    socialNets: SocialNet[]
    events: Event
    relationships: Relationship[]
    nickName: string
    maidenName: string
    guid: string
    isArchived: boolean
    firstName: string
    lastName: string
    fullMaidenName: string
    fullNickName: string
    alternateName: string
    fullAternateName: string
    saveName: string
    descriptionWithKeyValues: string
    allKeyValues: string
    description: string
    creationDate: string
}