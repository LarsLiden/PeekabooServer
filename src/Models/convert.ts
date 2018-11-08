import { Person } from "./person";
import { Relationship } from "./relationship"
import { PerfType, QuizPerson, LibraryPerson } from './models'
import dataProvider from "../dataProvider";

export function toQuizPerson(person: Person, perfType: PerfType): QuizPerson {
    return {
        guid: person.guid,
        fullName: `${person.firstName} ${person.lastName}`,
        description: person.description,
        blobNames: person.photoFilenames,
        performance: person.performance(perfType),
        } as QuizPerson
}

export function toLibraryPerson(person: Person, perfType: PerfType): LibraryPerson {
    return {
        guid: person.guid,
        fullName: person.fullName(),
        blobName: person.photoFilenames[0],
        tags: person.tags
        } as LibraryPerson 
}

export function toDisplayPerson(person: Person): Person {
    let dPerson: Person = JSON.parse(JSON.stringify(person))

    dPerson.relationships = dPerson.relationships.map( r => {
        let sourcePerson = dataProvider.getPerson(r.guid)
        if (sourcePerson) {
            return {...r, name: sourcePerson.fullName()} as Relationship
        }
        else {
            return {...r, name: "MISSING PERSON"} as Relationship
        }
    })
    return dPerson 
}
