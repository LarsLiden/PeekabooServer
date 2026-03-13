// Mock BlobService before importing dataProvider (which imports it at module level)
const mockBlobService = {
    getUsers: jest.fn(),
    updateUsers: jest.fn(),
    getPerson: jest.fn(),
    getPeopleStartingWith: jest.fn(),
    getAllPeople: jest.fn(),
    uploadPerson: jest.fn(),
    copyPerson: jest.fn(),
    deletePerson: jest.fn(),
    archivePerson: jest.fn(),
    getTags: jest.fn(),
    uploadTags: jest.fn(),
    uploadPhoto: jest.fn(),
    deletePhoto: jest.fn(),
    blobCreateContainer: jest.fn(),
    blobDeleteContainer: jest.fn(),
}

jest.mock('../src/Utils/blobService', () => ({
    __esModule: true,
    BlobService: { Instance: () => mockBlobService },
    default: mockBlobService,
}))

import { Cache } from '../src/Models/cache'
import { Tag } from '../src/Models/models'
import { newPerformance } from '../src/Models/performance'
import { Person } from '../src/Models/person'
import { User } from '../src/Models/user'

// Import the singleton DataProvider instance
import DataProvider from '../src/dataProvider'

function makeUser(overrides: Partial<User> = {}): User {
    return {
        name: 'Test User',
        googleId: 'google-1',
        email: 'test@example.com',
        hwmid: 'hwm-1',
        containerId: 'container-1',
        photoBlobPrefix: '',
        numPeople: 0,
        numPhotos: 0,
        numTestResults: 0,
        createdDateTime: new Date().toJSON(),
        lastUsedDatTime: new Date().toJSON(),
        isAdmin: true,
        ...overrides,
    }
}

function makePerson(overrides: Partial<Person> = {}): Person {
    return {
        personId: 'A-person-1',
        firstName: 'Alice',
        lastName: 'Smith',
        nickName: '',
        maidenName: '',
        fullMaidenName: '',
        fullNickName: '',
        alternateName: '',
        fullAternateName: '',
        description: '',
        descriptionWithKeyValues: '',
        allKeyValues: '',
        creationDate: new Date().toJSON(),
        isArchived: false,
        photoFilenames: [],
        tags: [],
        tagIds: ['tag-1'],
        keyValues: [],
        socialNets: [],
        events: { eventId: '', description: '', location: '' } as any,
        relationships: [],
        photoPerformance: newPerformance(),
        namePerformance: newPerformance(),
        descPerformance: newPerformance(),
        ...overrides,
    }
}

beforeEach(() => {
    Cache.ClearAll()
    jest.resetAllMocks()
    // Reset the internal users list by calling getUsers with a fresh mock
    mockBlobService.getUsers.mockResolvedValue([])
})

describe('DataProvider.getTags', () => {
    const user = makeUser()

    it('fetches tags from BlobService on cache miss', async () => {
        const tags: Tag[] = [{ tagId: 't1', name: 'Friend', parentId: null }]
        mockBlobService.getTags.mockResolvedValue(tags)

        const result = await DataProvider.getTags(user)
        expect(result).toEqual(tags)
        expect(mockBlobService.getTags).toHaveBeenCalledWith(user)
    })

    it('returns cached tags on second call', async () => {
        const tags: Tag[] = [{ tagId: 't1', name: 'Friend', parentId: null }]
        mockBlobService.getTags.mockResolvedValue(tags)

        await DataProvider.getTags(user)
        const result = await DataProvider.getTags(user)

        expect(result).toEqual(tags)
        // Only fetched from blob once
        expect(mockBlobService.getTags).toHaveBeenCalledTimes(1)
    })
})

describe('DataProvider.deleteTag', () => {
    const user = makeUser()

    it('removes tag by id and uploads remaining', async () => {
        const tags: Tag[] = [
            { tagId: 't1', name: 'Friend', parentId: null },
            { tagId: 't2', name: 'Coworker', parentId: null },
        ]
        mockBlobService.getTags.mockResolvedValue(tags)

        await DataProvider.deleteTag(user, 't1')

        expect(mockBlobService.uploadTags).toHaveBeenCalledWith(user, [{ tagId: 't2', name: 'Coworker', parentId: null }])
    })

    it('updates cache after deletion', async () => {
        const tags: Tag[] = [
            { tagId: 't1', name: 'Friend', parentId: null },
            { tagId: 't2', name: 'Coworker', parentId: null },
        ]
        mockBlobService.getTags.mockResolvedValue(tags)

        await DataProvider.deleteTag(user, 't1')

        // Second call should use cache (no additional blob fetch)
        const result = await DataProvider.getTags(user)
        expect(result).toEqual([{ tagId: 't2', name: 'Coworker', parentId: null }])
        expect(mockBlobService.getTags).toHaveBeenCalledTimes(1) // only the initial call
    })
})

describe('DataProvider.updateTag', () => {
    const user = makeUser()

    it('replaces existing tag and uploads', async () => {
        const tags: Tag[] = [
            { tagId: 't1', name: 'Friend', parentId: null },
            { tagId: 't2', name: 'Coworker', parentId: null },
        ]
        mockBlobService.getTags.mockResolvedValue(tags)

        const updatedTag: Tag = { tagId: 't1', name: 'Best Friend', parentId: 't2' }
        await DataProvider.updateTag(user, updatedTag)

        const uploadedTags = mockBlobService.uploadTags.mock.calls[0][1] as Tag[]
        expect(uploadedTags).toHaveLength(2)
        expect(uploadedTags.find((t: Tag) => t.tagId === 't1')).toEqual(updatedTag)
        expect(uploadedTags.find((t: Tag) => t.tagId === 't2')).toEqual(tags[1])
    })
})

describe('DataProvider.copyPeople', () => {
    const sourceUser = makeUser({ hwmid: 'src', containerId: 'src-container', isAdmin: true })
    const destUser = makeUser({ hwmid: 'dest', containerId: 'dest-container' })
    const person1 = makePerson({ personId: 'A-person-1', tagIds: ['t1', 't2'] })

    it('copies people and merges tags', async () => {
        mockBlobService.getPerson.mockResolvedValue(person1)
        mockBlobService.copyPerson.mockResolvedValue(undefined)
        mockBlobService.uploadTags.mockResolvedValue(undefined)

        const sourceTags: Tag[] = [
            { tagId: 't1', name: 'Friend', parentId: null },
            { tagId: 't2', name: 'Coworker', parentId: null },
        ]
        const destTags: Tag[] = [
            { tagId: 't1', name: 'Friend', parentId: null },
            { tagId: 't3', name: 'Family', parentId: null },
        ]
        // getTags is called twice: once for source, once for dest
        mockBlobService.getTags
            .mockResolvedValueOnce(sourceTags)
            .mockResolvedValueOnce(destTags)

        // Prime the cache for getPerson
        const cacheKey = `A_${sourceUser.containerId}`
        Cache.Set(cacheKey, [person1])

        await DataProvider.copyPeople(sourceUser, destUser, ['A-person-1'])

        // Verify person was copied
        expect(mockBlobService.copyPerson).toHaveBeenCalledWith(sourceUser, destUser, person1)

        // Verify tags were merged: dest already has t1 and t3, source adds t2
        expect(mockBlobService.uploadTags).toHaveBeenCalledWith(
            destUser,
            expect.arrayContaining([
                { tagId: 't1', name: 'Friend', parentId: null },
                { tagId: 't3', name: 'Family', parentId: null },
                { tagId: 't2', name: 'Coworker', parentId: null },
            ])
        )
    })

    it('does not upload tags when all source tags already exist', async () => {
        mockBlobService.getPerson.mockResolvedValue(person1)
        mockBlobService.copyPerson.mockResolvedValue(undefined)

        const sharedTags: Tag[] = [{ tagId: 't1', name: 'Friend', parentId: null }]
        mockBlobService.getTags
            .mockResolvedValueOnce(sharedTags)  // source
            .mockResolvedValueOnce(sharedTags)  // dest

        Cache.Set(`A_${sourceUser.containerId}`, [person1])

        await DataProvider.copyPeople(sourceUser, destUser, ['A-person-1'])

        expect(mockBlobService.uploadTags).not.toHaveBeenCalled()
    })

    it('denies non-admin users', async () => {
        const nonAdmin = makeUser({ hwmid: 'src', isAdmin: false })

        await expect(DataProvider.copyPeople(nonAdmin, destUser, ['A-person-1']))
            .rejects.toThrow('Permission Denied')
    })

    it('denies self-copy', async () => {
        const sameUser = makeUser({ hwmid: 'same', isAdmin: true })
        const sameDest = makeUser({ hwmid: 'same' })

        await expect(DataProvider.copyPeople(sameUser, sameDest, ['A-person-1']))
            .rejects.toThrow('Permission Denied')
    })

    it('invalidates destination user cache', async () => {
        mockBlobService.getPerson.mockResolvedValue(person1)
        mockBlobService.copyPerson.mockResolvedValue(undefined)
        mockBlobService.getTags.mockResolvedValue([])

        Cache.Set(`A_${sourceUser.containerId}`, [person1])
        Cache.Set(`A_${destUser.containerId}`, [makePerson({ personId: 'A-old' })])

        await DataProvider.copyPeople(sourceUser, destUser, ['A-person-1'])

        // Dest cache should have been invalidated
        expect(Cache.Get(`A_${destUser.containerId}`)).toBeNull()
        // Source cache should still exist
        expect(Cache.Get(`A_${sourceUser.containerId}`)).not.toBeNull()
    })

    it('copies multiple people in sequence', async () => {
        const person2 = makePerson({ personId: 'B-person-2', tagIds: [] })
        mockBlobService.copyPerson.mockResolvedValue(undefined)
        mockBlobService.getTags.mockResolvedValue([])

        Cache.Set(`A_${sourceUser.containerId}`, [person1])
        Cache.Set(`B_${sourceUser.containerId}`, [person2])

        await DataProvider.copyPeople(sourceUser, destUser, ['A-person-1', 'B-person-2'])

        expect(mockBlobService.copyPerson).toHaveBeenCalledTimes(2)
        expect(mockBlobService.copyPerson).toHaveBeenCalledWith(sourceUser, destUser, person1)
        expect(mockBlobService.copyPerson).toHaveBeenCalledWith(sourceUser, destUser, person2)
    })
})

describe('DataProvider.getUsers', () => {
    it('throws for non-admin user', async () => {
        const regularUser = makeUser({ isAdmin: false })
        await expect(DataProvider.getUsers(regularUser))
            .rejects.toThrow('Permission Denied')
    })

    it('returns users for admin', async () => {
        const admin = makeUser({ isAdmin: true })
        const users = [admin, makeUser({ hwmid: 'hwm-2', googleId: 'g2' })]
        mockBlobService.getUsers.mockResolvedValue(users)

        const result = await DataProvider.getUsers(admin)
        expect(result).toEqual(users)
    })
})

describe('DataProvider.postTestResults', () => {
    const user = makeUser()

    it('accumulates results and saves', async () => {
        const person = makePerson({ personId: 'A-person-1' })
        Cache.Set(`A_${user.containerId}`, [person])

        mockBlobService.uploadPerson.mockResolvedValue(undefined)

        const testResults = [
            { personId: 'A-person-1', result: 500 },
            { personId: 'A-person-1', result: 300 },
        ]

        const changed = await DataProvider.postTestResults(user, testResults)
        expect(changed).toHaveLength(1)
        expect(changed[0].photoPerformance.numPresentations).toBe(2)
        expect(mockBlobService.uploadPerson).toHaveBeenCalledTimes(1)
    })

    it('handles multiple different people', async () => {
        const personA = makePerson({ personId: 'A-person-a' })
        const personB = makePerson({ personId: 'B-person-b', firstName: 'Bob' })

        Cache.Set(`A_${user.containerId}`, [personA])
        Cache.Set(`B_${user.containerId}`, [personB])
        mockBlobService.uploadPerson.mockResolvedValue(undefined)

        const testResults = [
            { personId: 'A-person-a', result: 400 },
            { personId: 'B-person-b', result: 600 },
        ]

        const changed = await DataProvider.postTestResults(user, testResults)
        expect(changed).toHaveLength(2)
        expect(mockBlobService.uploadPerson).toHaveBeenCalledTimes(2)
    })
})

describe('DataProvider.getPerson', () => {
    const user = makeUser()

    it('returns person from cache', async () => {
        const person = makePerson({ personId: 'A-person-1' })
        Cache.Set(`A_${user.containerId}`, [person])

        const result = await DataProvider.getPerson(user, 'A-person-1')
        expect(result).toEqual(person)
        expect(mockBlobService.getPerson).not.toHaveBeenCalled()
    })

    it('fetches from blob on cache miss', async () => {
        const person = makePerson({ personId: 'A-person-1' })
        mockBlobService.getPerson.mockResolvedValue(person)

        const result = await DataProvider.getPerson(user, 'A-person-1')
        expect(result).toEqual(person)
        expect(mockBlobService.getPerson).toHaveBeenCalledWith(user, 'A-person-1')
    })

    it('throws for invalid person id', async () => {
        mockBlobService.getPerson.mockResolvedValue(null)
        await expect(DataProvider.getPerson(user, 'A-nonexistent'))
            .rejects.toThrow('Invalid PersonId')
    })
})

describe('DataProvider.deletePerson', () => {
    const user = makeUser()

    it('deletes person and updates cache', async () => {
        const person = makePerson({ personId: 'A-person-1' })
        Cache.Set(`A_${user.containerId}`, [person])
        mockBlobService.deletePerson.mockResolvedValue(undefined)

        await DataProvider.deletePerson(user, 'A-person-1')

        expect(mockBlobService.deletePerson).toHaveBeenCalledWith(user, person)
        const cached: Person[] = Cache.Get(`A_${user.containerId}`)
        expect(cached.find(p => p.personId === 'A-person-1')).toBeUndefined()
    })
})

describe('DataProvider.getPeopleStartingWith', () => {
    const user = makeUser()

    it('fetches from blob on cache miss', async () => {
        const people = [makePerson({ personId: 'A-person-1' })]
        mockBlobService.getPeopleStartingWith.mockResolvedValue(people)

        const result = await DataProvider.getPeopleStartingWith(user, 'A')
        expect(result).toEqual(people)
        expect(mockBlobService.getPeopleStartingWith).toHaveBeenCalledWith(user, 'A')
    })

    it('returns cached people on second call', async () => {
        const people = [makePerson({ personId: 'A-person-1' })]
        mockBlobService.getPeopleStartingWith.mockResolvedValue(people)

        await DataProvider.getPeopleStartingWith(user, 'A')
        const result = await DataProvider.getPeopleStartingWith(user, 'A')

        expect(result).toEqual(people)
        expect(mockBlobService.getPeopleStartingWith).toHaveBeenCalledTimes(1)
    })
})
