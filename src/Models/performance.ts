import { MAX_TIME } from './const'

export class Performance {
    public BestTime = MAX_TIME
    public AvgTime = MAX_TIME
    public WorstTime = 0
    public NumPresentations = 0
    public Frequency: number = 0
    public Rank = 0
    public LastTested = 0 
    public Familiarity = 0
    public FrequencyOffset = 0
    public FrequencyOffsetEnd = 0

    public constructor(init?: Partial<Performance>) {
        Object.assign(this, init)
    }

    /// Time bias to add to testing frequency based on how long it's been
    /// since this person was tested last
    public ageBias(): number
    {
        // LARS recheck this math
        let millisecondsPassed = Date.now() - Date.now() - 10// TEMP -this.LastTested
        let daysPassed = (millisecondsPassed / (1000*60*60*24));
        return daysPassed * (MAX_TIME / 30);
    }

    public Reset()
		{
		    this.BestTime	= 0
			this.WorstTime	= 0

            // Set ave to the worst
            // time to bias towards new people
			this.AvgTime	= MAX_TIME
			this.NumPresentations = 0
            this.LastTested = 0
        }
        
    public AddResult(elapsedTime: number)
		{
            // Make sure it's a valid time
            if (elapsedTime < 0)
            {
                throw new Error("invalid elapsed time")
               //lars elapsedTime = 0
            }
            else if (elapsedTime > MAX_TIME)
            {
                throw new Error("invalid elapsed time")
                //larselapsedTime = MAX_TIME
            }

            this.LastTested = Date.now()

			// Is it the first real presentation, then average it with the
            // worst possible time.  This assures a bias towards new people
			if (this.NumPresentations == 0) 
			{
				this.BestTime	= elapsedTime
				this.WorstTime	= elapsedTime

                // Calculate new average
                this.AvgTime = (MAX_TIME + elapsedTime) / 2
				this.NumPresentations++
				return
			}

			// Put cap on times
			if (elapsedTime > MAX_TIME) 
			{
				elapsedTime = MAX_TIME
			}

			// Is it the new min?
			if (elapsedTime < this.BestTime) 
			{
				this.BestTime = elapsedTime
			}

			// Is it the new max?
			if (elapsedTime > this.WorstTime)
			{
				this.WorstTime = elapsedTime
			}

            //----------------------------------------
			// Calculate new average of last 20 trials
            //----------------------------------------
            if (this.NumPresentations < 20)
            {
                this.AvgTime = ((this.NumPresentations * this.AvgTime) + elapsedTime) / (this.NumPresentations + 1)
            }
            else
            {
                this.AvgTime = ((19 * this.AvgTime) + elapsedTime) / 20
            }
			// Increase presentation count
			this.NumPresentations++

            // TODO
			// Save
		}
 
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