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
const azure = require("azure-storage");
const util_1 = require("util");
//const imageContainer = 'faces'
const personContainer = 'data';
class BlobService {
    constructor() {
        let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('No Blob Connection String');
        }
        this._blobService = azure.createBlobService(connectionString);
    }
    static Instance() {
        if (!this._instance) {
            this._instance = new BlobService();
        }
        return this._instance;
    }
    /*
        private static aggregateBlobs(err, result, cb) {
            if (err) {
                cb(er);
            } else {
                blobs = blobs.concat(result.entries);
                if (result.continuationToken !== null) {
                    blobService.listBlobsSegmented(
                        containerName,
                        result.continuationToken,
                        aggregateBlobs);
                } else {
                    cb(null, blobs);
                }
            }
        }*/
    getPeopleAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            let listBlobsSegmentedAsync = util_1.promisify(this._blobService.listBlobsSegmented).bind(this._blobService);
            let peopleBlobs = [];
            try {
                peopleBlobs = (yield listBlobsSegmentedAsync(personContainer, null)).entries;
            }
            catch (err) {
                console.log(JSON.stringify(err));
            }
            let people = [];
            for (let blobInfo of peopleBlobs) {
                let blobFile = yield this.getBlobAsTextAsync(personContainer, blobInfo.name);
                if (blobFile) {
                    people.push(JSON.parse(blobFile));
                }
            }
            return people;
        });
    }
    getBlobAsTextAsync(containerName, blobName) {
        return __awaiter(this, void 0, void 0, function* () {
            const getBlobToTextAsync = util_1.promisify(this._blobService.getBlobToText).bind(this._blobService);
            try {
                return yield getBlobToTextAsync(containerName, blobName);
            }
            catch (err) {
                console.log(JSON.stringify(err));
            }
        });
    }
    uploadText(containerName, blobName, text) {
        console.log(`${containerName}: ${blobName}`);
        this._blobService.createBlockBlobFromText(containerName, blobName, text, (error, result, response) => {
            if (!error) {
                console.log(`${containerName}: ${blobName}`);
            }
            else {
                console.log(JSON.stringify(error));
            }
        });
    }
    uploadFile(containerName, blobName, localFileName) {
        console.log(`${containerName}: ${blobName}`);
        this._blobService.createBlockBlobFromLocalFile(containerName, blobName, localFileName, (error, result, response) => {
            if (!error) {
                console.log(`${containerName}: ${blobName}`);
            }
            else {
                console.log(JSON.stringify(error));
            }
        });
        /*
                  BlobHandler.blobService.listBlobsSegmentedWithPrefix("faces","S/", undefined as any, (error, result, response) => {
                    if (!error) {
                        console.log(JSON.stringify(result))
                        console.log(JSON.stringify(response))
                    }
                    else {
                        console.log(JSON.stringify(error))
                    }
                  });*/
    }
}
exports.BlobService = BlobService;
exports.default = BlobService.Instance();
//# sourceMappingURL=blobHandler.js.map