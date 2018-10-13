"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const performance_1 = require("./performance");
const models_1 = require("./models");
class Person {
    constructor(init) {
        this._photoFNs = [];
        this._nextPhotoIndex = 0;
        this._tags = []; // ENUM LARS
        this._keyValues = []; // TODO LARS
        this._photoPerformance = new performance_1.Performance();
        this._namePerformance = new performance_1.Performance();
        this._descPerformance = new performance_1.Performance();
        this._socialNets = [];
        this._events = [{}]; // LARS?? 
        this._relationships = [];
        this.NickName = "";
        this.MaidenName = "";
        this.MyGuid = "";
        this.IsArchived = false;
        this.FirstName = "";
        this.LastName = "";
        this.FullName = "";
        this.FullMaidenName = "";
        this.FullNickName = "";
        this.AlternateName = "";
        this.FullAternateName = "";
        this.LongName = "";
        this.DescriptionWithKeyValues = "";
        this.AllKeyValues = "";
        this.Description = "";
        this.PersonType = 0; // LARS enum
        this.CreationDate = "";
        this.DirName = "";
        Object.assign(this, init);
    }
    toQuizPerson(perfType) {
        return {
            fullName: this.FullName,
            blobNames: this._photoFNs,
            performance: this.performance(perfType)
        };
    }
    performance(perfType) {
        switch (perfType) {
            case models_1.PerfType.PHOTO:
                return new performance_1.Performance(this._photoPerformance);
            case models_1.PerfType.DESC:
                return new performance_1.Performance(this._descPerformance);
            case models_1.PerfType.NAME:
                return new performance_1.Performance(this._namePerformance);
        }
        throw new Error("invalid perfType");
    }
    // Does person have data to take test type?
    hasTestData(perfType) {
        // Excluce people that don't have data for test type
        switch (perfType) {
            case models_1.PerfType.PHOTO:
                return (this._photoFNs.length > 0);
            case models_1.PerfType.NAME:
                return (this.FullName != "");
            case models_1.PerfType.DESC:
                return (this.Description != "");
            case models_1.PerfType.ALPHA:
                return true;
        }
        return false;
    }
}
exports.Person = Person;
//# sourceMappingURL=person.js.map