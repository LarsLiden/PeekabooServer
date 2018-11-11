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
    INVALID = "INVALID"
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
