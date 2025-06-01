import { describe, it, expect } from '@jest/globals'
import { formatDateTime, cn, generateFamilyCode } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatDateTime', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDateTime(date)
      
      // Should include date and time components
      expect(formatted).toContain('2024')
      expect(formatted).toContain('Jan')
      expect(formatted).toContain('15')
    })

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid')
      const formatted = formatDateTime(invalidDate)
      
      expect(formatted).toBe('Invalid Date')
    })
  })

  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
    })
  })

  describe('generateFamilyCode', () => {
    it('should generate 8-character code', () => {
      const code = generateFamilyCode()
      expect(code).toHaveLength(8)
    })

    it('should generate uppercase alphanumeric code', () => {
      const code = generateFamilyCode()
      expect(code).toMatch(/^[A-Z0-9]{8}$/)
    })

    it('should generate unique codes', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateFamilyCode())
      }
      
      // Should be very unlikely to have duplicates in 100 generations
      expect(codes.size).toBeGreaterThan(95)
    })

    it('should not contain confusing characters', () => {
      // Generate many codes to test exclusion of 0, O, I, 1
      const codes = Array.from({ length: 1000 }, () => generateFamilyCode())
      const allChars = codes.join('')
      
      expect(allChars).not.toContain('0')
      expect(allChars).not.toContain('O')
      expect(allChars).not.toContain('I')
      expect(allChars).not.toContain('1')
    })
  })
})