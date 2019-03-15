/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
export enum PerfType
{
    PHOTO = "PHOTO",
    NAME = "NAME",
    DESC = "DESC",
    ALPHA = "ALPHA"
}

export interface Event {
    eventId: string
    date?: string
    description: string
    location: string
}

export interface KeyValue {
    keyValueId: string
    key: string
    value: string
}

export interface Tag {
    tagId: string
    name: string
    parentId: string | null
}

export enum SocialNetType
{
    LINKEDIN = "LINKEDIN",
    FACEBOOK = "FACEBOOK"
}

export interface SocialNet {
    socialNetId: string
    URL: string
    profileID: string
    netType: SocialNetType
}
