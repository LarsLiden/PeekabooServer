"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const azure = require("azure-storage");
class BlobHandler {
    static init() {
        let connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('No Blob Connection String');
        }
        BlobHandler.blobService = azure.createBlobService(connectionString);
    }
    static uploadImage(containerName, blobName, localFileName) {
        /*   BlobHandler.blobService.createBlockBlobFromLocalFile(containerName, blobName, localFileName,
           (error, result, response) => {
               if (!error) {
                   console.log(JSON.stringify(result))
                   console.log(JSON.stringify(response))
               }
               else {
                   console.log(JSON.stringify(error))
               }
             });*/
        BlobHandler.blobService.listBlobsSegmentedWithPrefix("faces", "S/", undefined, (error, result, response) => {
            if (!error) {
                console.log(JSON.stringify(result));
                console.log(JSON.stringify(response));
            }
            else {
                console.log(JSON.stringify(error));
            }
        });
    }
}
exports.BlobHandler = BlobHandler;
//# sourceMappingURL=blobHandler.js.map