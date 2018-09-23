"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const dataPath = path.join(process.cwd(), './data');
class Util {
    static Instance() {
        if (!Util.instance) {
            Util.instance = new Util();
        }
        return Util.instance;
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
    GetPeople(filelist) {
        let people = filelist
            .filter(s => s.endsWith(".json"))
            .map(filename => {
            let fileContent = fs.readFileSync(filename, 'utf-8');
            return JSON.parse(fileContent);
        });
        return people;
    }
    GetAllFiles() {
        let dataFiles = this.walkSync(dataPath, []);
        let people = this.GetPeople(dataFiles);
        console.log(JSON.stringify(people[0]));
    }
}
exports.default = Util.Instance();
//# sourceMappingURL=util.js.map