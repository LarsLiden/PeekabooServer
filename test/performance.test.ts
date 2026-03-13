import { addResult, MAX_TIME, newPerformance } from '../src/Models/performance'

describe('addResult', () => {
    it('records first result with bias toward MAX_TIME', () => {
        const perf = newPerformance()
        addResult(perf, 2000)

        expect(perf.numPresentations).toBe(1)
        expect(perf.bestTime).toBe(2000)
        expect(perf.worstTime).toBe(2000)
        // avgTime = (MAX_TIME + 2000) / 2
        expect(perf.avgTime).toBe((MAX_TIME + 2000) / 2)
        expect(perf.lastTested).toBeGreaterThan(0)
    })

    it('updates best time on faster result', () => {
        const perf = newPerformance()
        addResult(perf, 3000)
        addResult(perf, 1000)

        expect(perf.bestTime).toBe(1000)
        expect(perf.numPresentations).toBe(2)
    })

    it('updates worst time on slower result', () => {
        const perf = newPerformance()
        addResult(perf, 1000)
        addResult(perf, 5000)

        expect(perf.worstTime).toBe(5000)
    })

    it('calculates running average for presentations < 20', () => {
        const perf = newPerformance()
        addResult(perf, 4000)  // first: avg = (MAX_TIME + 4000) / 2 = 7000, count = 1

        const avgAfterFirst = perf.avgTime

        addResult(perf, 2000)  // second: avg = (1 * 7000 + 2000) / 2 = 4500
        expect(perf.avgTime).toBe((1 * avgAfterFirst + 2000) / 2)
        expect(perf.numPresentations).toBe(2)
    })

    it('uses sliding window of 20 for averages after 20 presentations', () => {
        const perf = newPerformance()

        // Do 20 presentations to get past the threshold
        addResult(perf, 5000)  // first
        for (let i = 1; i < 20; i++) {
            addResult(perf, 5000)
        }
        expect(perf.numPresentations).toBe(20)

        const avgBefore = perf.avgTime
        addResult(perf, 1000)  // 21st: avg = (19 * avgBefore + 1000) / 20
        expect(perf.avgTime).toBeCloseTo((19 * avgBefore + 1000) / 20, 5)
        expect(perf.numPresentations).toBe(21)
    })

    it('throws on negative elapsed time', () => {
        const perf = newPerformance()
        expect(() => addResult(perf, -1)).toThrow('invalid elapsed time')
    })

    it('throws on elapsed time exceeding MAX_TIME', () => {
        const perf = newPerformance()
        expect(() => addResult(perf, MAX_TIME + 1)).toThrow('invalid elapsed time')
    })

    it('accepts exactly MAX_TIME', () => {
        const perf = newPerformance()
        addResult(perf, MAX_TIME)

        expect(perf.bestTime).toBe(MAX_TIME)
        expect(perf.numPresentations).toBe(1)
    })

    it('accepts zero as elapsed time', () => {
        const perf = newPerformance()
        addResult(perf, 0)

        expect(perf.bestTime).toBe(0)
        expect(perf.numPresentations).toBe(1)
    })
})

describe('newPerformance', () => {
    it('returns correct defaults', () => {
        const perf = newPerformance()
        expect(perf.bestTime).toBe(MAX_TIME)
        expect(perf.avgTime).toBe(MAX_TIME)
        expect(perf.worstTime).toBe(0)
        expect(perf.numPresentations).toBe(0)
        expect(perf.frequency).toBe(0)
        expect(perf.rank).toBe(0)
        expect(perf.lastTested).toBe(0)
        expect(perf.familiarity).toBe(0)
    })
})
