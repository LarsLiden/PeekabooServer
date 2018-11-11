export interface CacheItem {
    key: string
    value: any
    timestamp: number
}


export class Cache {
    static cacheItems: CacheItem[] = []

    public static Invalidate(key: string) {
        this.cacheItems = this.cacheItems.filter(i => i.key !== key)
    }

    public static Get(key: string): any {
        let cacheObj = this.cacheItems.find(i => i.key === key)
        if (cacheObj) {
            cacheObj.timestamp = Date.now()
            return cacheObj.value
        }
        return null
    }

    public static Set(key: string, value: any) {
        if (value ===  null) {
            this.Invalidate(key)
            return
        }
        let cacheItem = this.Get(key)
        if (cacheItem) {
            cacheItem.value = value
            cacheItem.timestamp = Date.now()
        }
        else {
            let newCacheItem = {
                key,
                value,
                timestamp: Date.now()
            }
            this.cacheItems.push(newCacheItem)
        }
    }
}