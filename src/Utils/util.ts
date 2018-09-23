import * as fs from 'fs'
import * as path from 'path'
import { Person } from '../Models/person'

const dataPath = path.join(process.cwd(), './data')
class Util {

    private static instance: Util

    public static Instance() : Util {
        if (!Util.instance) {
            Util.instance = new Util()
        }
        return Util.instance
    }

    // List all files in a directory in Node.js recursively in a synchronous fashion
    public walkSync(dir: string, filelist: string[]) {
    
        let files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(file => {
            if (fs.statSync(dir + '\\' + file).isDirectory()) {
                filelist = this.walkSync(dir+ '\\' + file + '\\', filelist);
            }
            else {
                filelist.push(dir + '\\' + file);
            }
        });
        return filelist;
    }

    public GetPeople(filelist: string[]) : Person[] {
        let people = filelist
            .filter(s => s.endsWith(".json"))
            .map(filename => {
                let fileContent = fs.readFileSync(filename, 'utf-8')
                return JSON.parse(fileContent)
            })
        return people
    }
    public GetAllFiles() {
        let dataFiles = this.walkSync(dataPath, [])
        let people = this.GetPeople(dataFiles)
        console.log(JSON.stringify(people[0]))
    }
}

export default Util.Instance()