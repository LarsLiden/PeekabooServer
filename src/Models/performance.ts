export interface Performance {
    BestTime: number
    AvgTime: number
    NumPresentations: number
    Frequency: number
    Rank: number
    LastTested: string // LARS datetime
    Familiarity: number,
    FrequencyOffset: number
}

export interface SocialNet {
    URL: string
    profileID: string
    netType: number // LARS enum
}

export interface Relationship {
    _type: RelationshipType
    _guid: string
}

export interface RelationshipType {
    _name: string  // LARS enum
}