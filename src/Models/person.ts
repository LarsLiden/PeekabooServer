/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
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
    isArchived: boolean
    firstName: string
    lastName: string
    fullMaidenName: string
    fullNickName: string
    alternateName: string
    fullAternateName: string
    personId: string 
    descriptionWithKeyValues: string
    allKeyValues: string
    description: string
    creationDate: string
    importGUID?: string
}