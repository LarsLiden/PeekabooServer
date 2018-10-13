import { Performance } from './performance'

export enum PerfType
{
    PHOTO = "PHOTO",
    NAME = "NAME",
    DESC = "DESC",
    ALPHA = "ALPHA"
}

export interface QuizSet {
    quizPeople: QuizPerson[]
    frequencyTotal: number
}

export interface QuizPerson {
    blobNames: string[]
    fullName: string
    performance: Performance
}

export interface Tag {
    name: string
    count: number
}

export interface Filter {
    perfType: PerfType
    required: string[],
    blocked: string[]
}

export enum DisplayType
{
    ALL = "ALL",
    TEST = "TEST"
}