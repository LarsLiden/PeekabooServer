export interface CacheItem {
    key: string
    value: any
    timestamp: number
}


/**
 * Copyright (c) Lars Liden. All rights reserved.  
 * Licensed under the MIT License.
 */
export class Cache {
    static cacheItems: CacheItem[] = []

    public static Invalidate(rawkey: string) {
        const key = rawkey.toUpperCase()
        this.cacheItems = this.cacheItems.filter(i => i.key !== key)
    }

    public static Get(rawkey: string): any {
        const key = rawkey.toUpperCase()
        let cacheObj = this.cacheItems.find(i => i.key === key)
        if (cacheObj) {
            cacheObj.timestamp = Date.now()
            return cacheObj.value
        }
        return null
    }

    public static Set(rawkey: string, value: any) {
        const key = rawkey.toUpperCase()
        if (value ===  null) {
            this.Invalidate(key)
            return
        }
        let cacheItem = this.Get(key)
        if (cacheItem) {
            this.cacheItems = this.cacheItems.filter(i => i.key != key)
        }

        let newCacheItem = {
            key,
            value,
            timestamp: Date.now()
        }
        this.cacheItems.push(newCacheItem)
    }
}