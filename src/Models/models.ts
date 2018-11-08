import { Performance } from './performance'

export enum PerfType
{
    PHOTO = "PHOTO",
    NAME = "NAME",
    DESC = "DESC",
    ALPHA = "ALPHA"
}

export enum StartState
{
    READY = "READY",
    WAITING = "WAITNIG",
    INVALID = "INVALID"
}

export interface QuizSet {
    quizPeople: QuizPerson[]
    frequencyTotal: number
}

export interface QuizPerson {
    guid: string
    blobNames: string[]
    fullName: string
    description: string
    performance: Performance
}

export interface LibrarySet {
    libraryPeople: LibraryPerson[]
    selectedIndex: number
}

export interface LibraryPerson {
    guid: string
    blobName: string
    fullName: string
    tags: string[]
}

export interface Tag {
    name: string
    count: number
}

export interface Filter {
    perfType: PerfType
    required: string[]
    blocked: string[]
}

export interface Event {
    date: string
    description: string
    location: string
}

export interface KeyValue {
    key: string
    value: string
}

export enum SocialNetType
{
    LINKEDIN = "LINKEDIN",
    FACEBOOK = "FACEBOOK"
}

export interface SocialNet {
    URL: string
    profileID: string
    netType: SocialNetType
}
