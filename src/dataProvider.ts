import { Person } from './Models/person'
import BlobService from './Utils/blobHandler'

class DataProvider {
 
    private static _instance: DataProvider
    private _people: Person[] | null = null
 
    public static Instance(): DataProvider {
        if (!this._instance) {
            this._instance = new DataProvider()
        }
        return this._instance
    }

    public async init() {
        if (this._people == null) {
            this._people = await BlobService.getPeopleAsync() 
        }
    }
    public get people(): Person[] 
    {
        if (this._people == null) {
            throw new Error("DataProvider not initialized!")
        }
        return this._people
    }
}

export default DataProvider.Instance()