import { Person } from './Models/person'
import { Relationship } from './Models/relationship'
import { QuizSet, LibrarySet, Tag, Filter } from './Models/models'
import { MAX_TIME, BIAS } from './Models/const'
import BlobService from './Utils/blobHandler'

class DataProvider {
 
    private static _instance: DataProvider
    private _people: Person[] | null = null
    private _tags: Tag[] = []
 
    public static Instance(): DataProvider {
        if (!this._instance) {
            this._instance = new DataProvider()
        }
        return this._instance
    }

    private extractTags(people: Person[]) : Tag[] {

        let tags: Tag[] = []
        people.map(p => {
            p.tags.map(t => {
                const tag = tags.find(tag => tag.name == t)
                if(tag) {
                    tag.count++
                }
                else {
                    tags.push({name: t, count: 1})
                } 
            }) 
        })
        tags = tags.sort((a, b) => {
            if (a.name < b.name) return -1
            else if (b.name < a.name) return 1
            else return 0
        })
        return tags
    }

    public async init() {
        if (this._people == null) {
            this._people = await BlobService.getPeopleAsync() 
            this._tags = this.extractTags(this._people)
        }
    }

    public filteredTags(filter: Filter): Tag[] {
        let people = this.filteredPeople(filter)
        return this.extractTags(people)
    }

    public filteredPeople(filter: Filter): Person[] {
     
        if (filter.blocked.length === 0 && filter.required.length === 0) {
            return this.people
        }
        return this.people.filter(p => {
            // Reject if doesn't have appropriate test data
            if (!p.hasTestData(filter.perfType)) {
                return false
            }
            let pass = true
            filter.required.forEach(f => 
                {
                    if (!p.tags.includes(f)) {
                        pass = false
                    }
                })
            filter.blocked.forEach(f => 
                { 
                    if (p.tags.includes(f)) {
                        pass = false
                    }
                })
            return pass
        })
    }

    public quizSet(filter: Filter): QuizSet
    {
        // Filter people by tags
        let quizPeople = this.filteredPeople(filter).map(p => {
            return p.toQuizPerson(filter.perfType)
        })

        if (quizPeople.length == 0) {
            return {quizPeople: [], frequencyTotal: 0}
        }

        // Find longest and shortest times
        let maxAverageTime  = 0;
        let minAverageTime = MAX_TIME
        quizPeople.forEach(person =>
        {
            // Only for people with at least one presentation
            if (person.performance.numPresentations > 0)
            {
                const averageTime = person.performance.avgTime
                if (averageTime > maxAverageTime) 
                {
                    maxAverageTime = averageTime
                }
                if (averageTime < minAverageTime)
                {
                    minAverageTime = averageTime
                }
            }
        })

        quizPeople = quizPeople.sort((a, b) => a.performance.avgTime < b.performance.avgTime ? -1 : a.performance.avgTime > b.performance.avgTime ? 1 : 0)

        //-------------------------------------------
        // Now weight them for appearance in testing
        //-------------------------------------------

        // If very first test set all frequencies to 1
        if (maxAverageTime == 0) 
        {
            quizPeople.forEach(person =>
            {
                person.performance.frequency = 1
            })
        }
        // Caculate the frequency for each
        else
        {
            let newFrequency = Math.ceil(1 + (BIAS * ((maxAverageTime / minAverageTime) - 1)))
                    	
            quizPeople.forEach(person =>
            {
                // If a new person, use largest time
                if (person.performance.numPresentations === 0)
                {
                    person.performance.frequency = newFrequency
                }
                    // Otherwise use average time
                else
                {
                    // Get average time take to respond
                    let avgTime = person.performance.avgTime

                    // Add time based on how long since last tested - max time after 30 days
                    let ageBias = person.performance.ageBias()
                    
                    // Limit to max time
                    avgTime = Math.min(MAX_TIME,(avgTime+ageBias));

                    // Calculate how often this person should appear
                    let frequency = Math.ceil(1 + (BIAS * ((avgTime / minAverageTime) - 1)))

                    person.performance.frequency = frequency
                }
            })
        }

        // Now give each person a range depending on the frequency
        let frequencyTotal = 0

        console.log("--------" + filter.perfType + "--------");
        console.log("HIGH:" + maxAverageTime);
        console.log("LOW:" + minAverageTime);

        let logstrings: string[] = []
        quizPeople.forEach(person =>
        {
            person.performance.frequencyOffsetStart = frequencyTotal 
            person.performance.frequencyOffsetEnd = frequencyTotal + person.performance.frequency
         //LARS TODO   person.performance.Rank = .SetRank(SortType, _Library._selectedPeople.IndexOf(person));
            person.performance.familiarity = this.calcFamiliarity(minAverageTime, maxAverageTime, person.performance.avgTime)
            frequencyTotal += person.performance.frequency

            logstrings.push(`${person.performance.avgTime+(10*MAX_TIME)} \t${person.performance.frequency} \t${person.performance.frequencyOffsetStart} \t${person.performance.frequencyOffsetEnd} \t${person.fullName}`)
        })

        logstrings.sort()
        logstrings.forEach(ls => console.log(ls))

        return {
            quizPeople,
            frequencyTotal
        }

    }

    public librarySet(filter: Filter): LibrarySet
    {
        // Filter people by tags
        let libraryPeople = this.filteredPeople(filter).map(p => {
            return p.toLibraryPerson(filter.perfType)
        })
        return {libraryPeople}
        // LARS todo - sort by perf type
        /*
        if (libraryPeople.length == 0) {
            return {libraryPeople: []}
        }

        // Find longest and shortest times
        let maxAverageTime  = 0;
        let minAverageTime = MAX_TIME
        libraryPeople.forEach(person =>
        {
            // Only for people with at least one presentation
            if (person.performance.numPresentations > 0)
            {
                const averageTime = person.performance.avgTime
                if (averageTime > maxAverageTime) 
                {
                    maxAverageTime = averageTime
                }
                if (averageTime < minAverageTime)
                {
                    minAverageTime = averageTime
                }
            }
        })

        libraryPeople = libraryPeople.sort((a, b) => a.performance.avgTime < b.performance.avgTime ? -1 : a.performance.avgTime > b.performance.avgTime ? 1 : 0)

        //-------------------------------------------
        // Now weight them for appearance in testing
        //-------------------------------------------

        // If very first test set all frequencies to 1
        if (maxAverageTime == 0) 
        {
            libraryPeople.forEach(person =>
            {
                person.performance.frequency = 1
            })
        }
        // Caculate the frequency for each
        else
        {
            let newFrequency = Math.ceil(1 + (BIAS * ((maxAverageTime / minAverageTime) - 1)))
                    	
            libraryPeople.forEach(person =>
            {
                // If a new person, use largest time
                if (person.performance.numPresentations === 0)
                {
                    person.performance.frequency = newFrequency
                }
                    // Otherwise use average time
                else
                {
                    // Get average time take to respond
                    let avgTime = person.performance.avgTime

                    // Add time based on how long since last tested - max time after 30 days
                    let ageBias = person.performance.ageBias()
                    
                    // Limit to max time
                    avgTime = Math.min(MAX_TIME,(avgTime+ageBias));

                    // Calculate how often this person should appear
                    let frequency = Math.ceil(1 + (BIAS * ((avgTime / minAverageTime) - 1)))

                    person.performance.frequency = frequency
                }
            })
        }

        // Now give each person a range depending on the frequency
        let frequencyTotal = 0

        console.log("--------" + filter.perfType + "--------");
        console.log("HIGH:" + maxAverageTime);
        console.log("LOW:" + minAverageTime);

        let logstrings: string[] = []
        libraryPeople.forEach(person =>
        {
            person.performance.frequencyOffsetStart = frequencyTotal 
            person.performance.frequencyOffsetEnd = frequencyTotal + person.performance.frequency
         //LARS TODO   person.performance.Rank = .SetRank(SortType, _Library._selectedPeople.IndexOf(person));
            person.performance.familiarity = this.calcFamiliarity(minAverageTime, maxAverageTime, person.performance.avgTime)
            frequencyTotal += person.performance.frequency

            logstrings.push(`${person.performance.avgTime+(10*MAX_TIME)} \t${person.performance.frequency} \t${person.performance.frequencyOffsetStart} \t${person.performance.frequencyOffsetEnd} \t${person.fullName}`)
        })

        logstrings.sort()
        logstrings.forEach(ls => console.log(ls))

        return {
            libraryPeople,
            frequencyTotal
        }
*/
    }

    /// Set relative familiarity value, with respect to all people in this category
    public calcFamiliarity(minAverageTime: number, maxAverageTime:number, myAverageTime: number): number
    {
        // If haven't done any testing
        if (maxAverageTime == minAverageTime)
        {
            return 0.5
        }
        // Otherwise calculate relative to other people
        else
        {
            const totalDiff = maxAverageTime - minAverageTime;
            const myOffset = myAverageTime - minAverageTime;
            return 1.0 -  (myOffset / totalDiff);
        }
    }

    public getPerson(guid: string) : Person | null {
        if (this._people == null) {
            throw new Error("DataProvider not initialized!")
        }
        const person = this._people.find(p => p.guid === guid)   
        return person || null 
    }

    public toDisplayPerson(source: Person): Person {
        let dPerson: Person = JSON.parse(JSON.stringify(source))

        dPerson.relationships = dPerson.relationships.map( r => {
            let sourcePerson = this.getPerson(r.guid)
            if (sourcePerson) {
                return {...r, name: sourcePerson.fullName} as Relationship
            }
            else {
                return {...r, name: "MISSING PERSON"} as Relationship
            }
        })
        return dPerson 
    }

    public get people(): Person[] 
    {
        if (this._people == null) {
            throw new Error("DataProvider not initialized!")
        }
        return this._people
    }

    public get tags(): Tag[] {
        if (this._tags == null) {
            throw new Error("DataProvider not initialized!")
        }
        return this._tags
    }
}

export default DataProvider.Instance()