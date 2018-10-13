"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_1 = require("./const");
class Performance {
    constructor(init) {
        this.BestTime = const_1.MAX_TIME;
        this.AvgTime = const_1.MAX_TIME;
        this.WorstTime = 0;
        this.NumPresentations = 0;
        this.Frequency = 0;
        this.Rank = 0;
        this.LastTested = 0;
        this.Familiarity = 0;
        this.FrequencyOffset = 0;
        this.FrequencyOffsetEnd = 0;
        Object.assign(this, init);
    }
    /// Time bias to add to testing frequency based on how long it's been
    /// since this person was tested last
    ageBias() {
        // LARS recheck this math
        let millisecondsPassed = Date.now() - Date.now() - 10; // TEMP -this.LastTested
        let daysPassed = (millisecondsPassed / (1000 * 60 * 60 * 24));
        return daysPassed * (const_1.MAX_TIME / 30);
    }
    Reset() {
        this.BestTime = 0;
        this.WorstTime = 0;
        // Set ave to the worst
        // time to bias towards new people
        this.AvgTime = const_1.MAX_TIME;
        this.NumPresentations = 0;
        this.LastTested = 0;
    }
    AddResult(elapsedTime) {
        // Make sure it's a valid time
        if (elapsedTime < 0) {
            throw new Error("invalid elapsed time");
            //lars elapsedTime = 0
        }
        else if (elapsedTime > const_1.MAX_TIME) {
            throw new Error("invalid elapsed time");
            //larselapsedTime = MAX_TIME
        }
        this.LastTested = Date.now();
        // Is it the first real presentation, then average it with the
        // worst possible time.  This assures a bias towards new people
        if (this.NumPresentations == 0) {
            this.BestTime = elapsedTime;
            this.WorstTime = elapsedTime;
            // Calculate new average
            this.AvgTime = (const_1.MAX_TIME + elapsedTime) / 2;
            this.NumPresentations++;
            return;
        }
        // Put cap on times
        if (elapsedTime > const_1.MAX_TIME) {
            elapsedTime = const_1.MAX_TIME;
        }
        // Is it the new min?
        if (elapsedTime < this.BestTime) {
            this.BestTime = elapsedTime;
        }
        // Is it the new max?
        if (elapsedTime > this.WorstTime) {
            this.WorstTime = elapsedTime;
        }
        //----------------------------------------
        // Calculate new average of last 20 trials
        //----------------------------------------
        if (this.NumPresentations < 20) {
            this.AvgTime = ((this.NumPresentations * this.AvgTime) + elapsedTime) / (this.NumPresentations + 1);
        }
        else {
            this.AvgTime = ((19 * this.AvgTime) + elapsedTime) / 20;
        }
        // Increase presentation count
        this.NumPresentations++;
        // TODO
        // Save
    }
}
exports.Performance = Performance;
//# sourceMappingURL=performance.js.map