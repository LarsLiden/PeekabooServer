"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const blobHandler_1 = require("./Utils/blobHandler");
class DataProvider {
    constructor() {
        this._people = null;
    }
    static Instance() {
        if (!this._instance) {
            this._instance = new DataProvider();
        }
        return this._instance;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._people == null) {
                this._people = yield blobHandler_1.default.getPeopleAsync();
            }
        });
    }
    get people() {
        if (this._people == null) {
            throw new Error("DataProvider not initialized!");
        }
        return this._people;
    }
}
exports.default = DataProvider.Instance();
//# sourceMappingURL=dataProvider.js.map