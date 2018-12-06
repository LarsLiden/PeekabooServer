/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
export const MAX_TIME = 10000

export interface Performance {
    bestTime: number
    avgTime: number
    worstTime: number
    numPresentations: number
    frequency: number
    rank: number
    lastTested: number 
    familiarity: number
    frequencyOffsetStart: number
    frequencyOffsetEnd: number
}

export function newPerformance(): Performance {
    return {
        bestTime: MAX_TIME,
        avgTime: MAX_TIME,
        worstTime: 0,
        numPresentations: 0,
        frequency: 0,
        rank: 0,
        lastTested: 0,
        familiarity: 0,
        frequencyOffsetStart: 0,
        frequencyOffsetEnd: 0,
    }
}
    
export function addResult(performance: Performance, elapsedTime: number): void {
    // Make sure it's a valid time
    if (elapsedTime < 0) {
        throw new Error("invalid elapsed time")
    }
    else if (elapsedTime > MAX_TIME) {
        throw new Error("invalid elapsed time")
    }

    performance.lastTested = Date.now()

    // Is it the first real presentation, then average it with the
    // worst possible time.  This assures a bias towards new people
    if (performance.numPresentations === 0) {
        performance.bestTime	= elapsedTime
        performance.worstTime	= elapsedTime

        // Calculate new average
        performance.avgTime = (MAX_TIME + elapsedTime) / 2
        performance.numPresentations = performance.numPresentations + 1
        return
    }

    // Put cap on times
    if (elapsedTime > MAX_TIME) {
        elapsedTime = MAX_TIME
    }

    // Is it the new min?
    if (elapsedTime < performance.bestTime) {
        performance.bestTime = elapsedTime
    }

    // Is it the new max?
    if (elapsedTime > performance.worstTime) {
        performance.worstTime = elapsedTime
    }

    //----------------------------------------
    // Calculate new average of last 20 trials
    //----------------------------------------
    if (performance.numPresentations < 20) {
        performance.avgTime = ((performance.numPresentations * performance.avgTime) + elapsedTime) / (performance.numPresentations + 1)
    }
    else {
        performance.avgTime = ((19 * performance.avgTime) + elapsedTime) / 20
    }
    // Increase presentation count
    performance.numPresentations++
}

export interface TestResult {
    personId: string,
    result: number
}


