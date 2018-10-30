import { MAX_TIME } from './const'

export class Performance {
    public bestTime = MAX_TIME
    public avgTime = MAX_TIME
    public worstTime = 0
    public numPresentations = 0
    public frequency: number = 0
    public rank = 0
    public lastTested = 0 
    public familiarity = 0
    public frequencyOffsetStart = 0
    public frequencyOffsetEnd = 0

    public constructor(init?: Partial<Performance>) {
        Object.assign(this, init)
    }

    /// Time bias to add to testing frequency based on how long it's been
    /// since this person was tested last
    public ageBias(): number
    {
        // LARS recheck this math
        let millisecondsPassed = Date.now() - this.lastTested
        let daysPassed = (millisecondsPassed / (1000*60*60*24));
        return daysPassed * (MAX_TIME / 30);
    }

    public Reset()
		{
		    this.bestTime	= 0
			this.worstTime	= 0

            // Set ave to the worst
            // time to bias towards new people
			this.avgTime	= MAX_TIME
			this.numPresentations = 0
            this.lastTested = 0
        }
        
    public AddResult(elapsedTime: number)
		{
            // Make sure it's a valid time
            if (elapsedTime < 0)
            {
                throw new Error("invalid elapsed time")
            }
            else if (elapsedTime > MAX_TIME)
            {
                throw new Error("invalid elapsed time")
            }

            this.lastTested = Date.now()

			// Is it the first real presentation, then average it with the
            // worst possible time.  This assures a bias towards new people
			if (this.numPresentations == 0) 
			{
				this.bestTime	= elapsedTime
				this.worstTime	= elapsedTime

                // Calculate new average
                this.avgTime = (MAX_TIME + elapsedTime) / 2
				this.numPresentations++
				return
			}

			// Put cap on times
			if (elapsedTime > MAX_TIME) 
			{
				elapsedTime = MAX_TIME
			}

			// Is it the new min?
			if (elapsedTime < this.bestTime) 
			{
				this.bestTime = elapsedTime
			}

			// Is it the new max?
			if (elapsedTime > this.worstTime)
			{
				this.worstTime = elapsedTime
			}

            //----------------------------------------
			// Calculate new average of last 20 trials
            //----------------------------------------
            if (this.numPresentations < 20)
            {
                this.avgTime = ((this.numPresentations * this.avgTime) + elapsedTime) / (this.numPresentations + 1)
            }
            else
            {
                this.avgTime = ((19 * this.avgTime) + elapsedTime) / 20
            }
			// Increase presentation count
			this.numPresentations++

            // TODO
			// Save
		}
 
}

export interface TestResult {
    guid: string,
    result: number
}


