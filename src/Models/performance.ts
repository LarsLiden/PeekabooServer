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

export interface TestResult {
    guid: string,
    result: number
}


