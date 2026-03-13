// Mock BlobService to avoid importing azure-storage transitively
jest.mock('../src/Utils/blobService', () => ({
    __esModule: true,
    default: {},
}))

import { replace } from '../src/dataProvider'

describe('replace', () => {
    it('replaces an item by id', () => {
        const items = [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
            { id: 3, name: 'Carol' },
        ]
        const updated = { id: 2, name: 'Bobby' }
        const result = replace(items, updated, x => x.id)

        expect(result).toHaveLength(3)
        expect(result[0]).toEqual({ id: 1, name: 'Alice' })
        expect(result[1]).toEqual({ id: 2, name: 'Bobby' })
        expect(result[2]).toEqual({ id: 3, name: 'Carol' })
    })

    it('throws when item is not found', () => {
        const items = [{ id: 1, name: 'Alice' }]
        const updated = { id: 99, name: 'Ghost' }

        expect(() => replace(items, updated, x => x.id)).toThrow(
            /you attempted to replace item/i
        )
    })

    it('replaces the first item', () => {
        const items = [
            { id: 'a', val: 1 },
            { id: 'b', val: 2 },
        ]
        const result = replace(items, { id: 'a', val: 10 }, x => x.id)

        expect(result[0]).toEqual({ id: 'a', val: 10 })
        expect(result[1]).toEqual({ id: 'b', val: 2 })
    })

    it('replaces the last item', () => {
        const items = [
            { id: 'a', val: 1 },
            { id: 'b', val: 2 },
        ]
        const result = replace(items, { id: 'b', val: 20 }, x => x.id)

        expect(result[0]).toEqual({ id: 'a', val: 1 })
        expect(result[1]).toEqual({ id: 'b', val: 20 })
    })

    it('does not mutate the original array', () => {
        const items = [{ id: 1, name: 'Alice' }]
        const result = replace(items, { id: 1, name: 'Alicia' }, x => x.id)

        expect(items[0].name).toBe('Alice')
        expect(result[0].name).toBe('Alicia')
        expect(result).not.toBe(items)
    })
})
