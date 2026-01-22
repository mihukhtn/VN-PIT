import { describe, it, expect } from 'vitest'
import { calculatePIT } from './tax'

describe('calculatePIT', () => {
    it('should return 0 for income <= 0', () => {
        expect(calculatePIT(0)).toBe(0)
        expect(calculatePIT(-1000)).toBe(0)
    })

    it('should calculate level 1 tax (<= 5M)', () => {
        expect(calculatePIT(5_000_000)).toBe(250_000)
        expect(calculatePIT(4_000_000)).toBe(200_000)
    })

    it('should calculate level 2 tax (5M < x <= 10M)', () => {
        // 10M => 250k + (5M * 10%) = 750k
        expect(calculatePIT(10_000_000)).toBe(750_000)
    })

    it('should calculate level 3 tax (10M < x <= 18M)', () => {
        // 18M => 750k + (8M * 15%) = 750k + 1.2M = 1.95M
        expect(calculatePIT(18_000_000)).toBe(1_950_000)
    })

    it('should calculate level 4 tax (18M < x <= 32M)', () => {
        // 32M => 1.95M + (14M * 20%) = 1.95M + 2.8M = 4.75M
        expect(calculatePIT(32_000_000)).toBe(4_750_000)
    })

    it('should calculate level 5 tax (32M < x <= 52M)', () => {
        // 52M => 4.75M + (20M * 25%) = 4.75M + 5M = 9.75M
        expect(calculatePIT(52_000_000)).toBe(9_750_000)
    })

    it('should calculate level 6 tax (52M < x <= 80M)', () => {
        // 80M => 9.75M + (28M * 30%) = 9.75M + 8.4M = 18.15M
        expect(calculatePIT(80_000_000)).toBe(18_150_000)
    })

    it('should calculate level 7 tax (> 80M)', () => {
        // 100M => 18.15M + (20M * 35%) = 18.15M + 7M = 25.15M
        expect(calculatePIT(100_000_000)).toBe(25_150_000)
    })
})
