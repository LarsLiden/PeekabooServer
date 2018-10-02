"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const blobHandler_1 = require("./blobHandler");
const dataPath = path.join(process.cwd(), './data');
class Util {
    static Instance() {
        if (!this.instance) {
            this.instance = new Util();
        }
        return this.instance;
    }
    // List all files in a directory in Node.js recursively in a synchronous fashion
    walkSync(dir, filelist) {
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(file => {
            if (fs.statSync(dir + '\\' + file).isDirectory()) {
                filelist = this.walkSync(dir + '\\' + file + '\\', filelist);
            }
            else {
                filelist.push(dir + '\\' + file);
            }
        });
        return filelist;
    }
    getPersonFromFile(fileName) {
        let fileContent = fs.readFileSync(fileName, 'utf-8');
        return JSON.parse(fileContent);
    }
    processPersonFile(personFile, imageFiles) {
        // Get name from person file
        let cutPos = dataPath.length + 1;
        let personFileSplit = personFile.substr(cutPos).split(`\\\\`);
        let nameString = personFileSplit[1];
        // Retrieve image files for this name
        let myImageFiles = imageFiles.filter(ifilename => {
            let imageFileSplit = ifilename.substr(cutPos).split(`\\\\`);
            return imageFileSplit[1] === nameString;
        });
        // Load the person
        let person = this.getPersonFromFile(personFile);
        // Upload photos and update links
        if (person._photoFNs.length != myImageFiles.length) {
            throw new Error("Wrong number of files found");
        }
        person._photoFNs = [];
        myImageFiles.forEach(localImageFile => {
            let imageBlobPath = localImageFile.substr(cutPos).split(`\\\\`).join(`\\`);
            person._photoFNs.push(imageBlobPath);
            let containername = person.IsArchived ? "archive-faces" : "faces";
            blobHandler_1.default.uploadFile(containername, imageBlobPath, localImageFile);
        });
        // Upload the person file
        let dataContainerName = person.IsArchived ? "archive-data" : "data";
        let dataBlobPath = personFileSplit[0] + '\\' + personFileSplit[1] + '.json';
        blobHandler_1.default.uploadText(dataContainerName, dataBlobPath, JSON.stringify(person));
    }
    UploadLocalFiles() {
        let fileNames = this.walkSync(dataPath, []);
        let imageFiles = [];
        let personFiles = [];
        for (let i = 0; i < 200; i++) {
            let df = fileNames[i];
            // Sort the files into types
            if (df.endsWith('json')) {
                personFiles.push(df);
            }
            else if (!df.endsWith('pbd')) {
                imageFiles.push(df);
            }
        }
        personFiles.forEach(personFile => this.processPersonFile(personFile, imageFiles));
    }
}
exports.default = Util.Instance();
//# sourceMappingURL=util.js.map