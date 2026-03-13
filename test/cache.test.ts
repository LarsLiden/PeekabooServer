import { Cache } from '../src/Models/cache'

describe('Cache', () => {
    beforeEach(() => {
        Cache.ClearAll()
    })

    it('returns null for missing key', () => {
        expect(Cache.Get('missing')).toBeNull()
    })

    it('stores and retrieves a value', () => {
        Cache.Set('key1', [1, 2, 3])
        expect(Cache.Get('key1')).toEqual([1, 2, 3])
    })

    it('is case-insensitive', () => {
        Cache.Set('MyKey', 'hello')
        expect(Cache.Get('mykey')).toBe('hello')
        expect(Cache.Get('MYKEY')).toBe('hello')
    })

    it('overwrites existing value', () => {
        Cache.Set('key1', 'old')
        Cache.Set('key1', 'new')
        expect(Cache.Get('key1')).toBe('new')
    })

    it('invalidates a specific key', () => {
        Cache.Set('key1', 'val1')
        Cache.Set('key2', 'val2')

        Cache.Invalidate('key1')

        expect(Cache.Get('key1')).toBeNull()
        expect(Cache.Get('key2')).toBe('val2')
    })

    it('invalidates matching keys', () => {
        Cache.Set('A_container123', 'data-a')
        Cache.Set('B_container123', 'data-b')
        Cache.Set('A_other456', 'data-other')

        Cache.InvalidateMatching('container123')

        expect(Cache.Get('A_container123')).toBeNull()
        expect(Cache.Get('B_container123')).toBeNull()
        expect(Cache.Get('A_other456')).toBe('data-other')
    })

    it('sets null to invalidate', () => {
        Cache.Set('key1', 'val')
        Cache.Set('key1', null)
        expect(Cache.Get('key1')).toBeNull()
    })

    it('clears all items', () => {
        Cache.Set('a', 1)
        Cache.Set('b', 2)
        Cache.ClearAll()
        expect(Cache.Get('a')).toBeNull()
        expect(Cache.Get('b')).toBeNull()
    })
})
