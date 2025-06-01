// Jest setup file
import { beforeAll, afterAll } from '@jest/globals'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db'

// Silence console logs during tests unless explicitly needed
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('Error:')) {
      return
    }
    originalConsoleError(...args)
  }
  
  console.warn = (...args) => {
    if (args[0]?.includes?.('Warning:')) {
      return
    }
    originalConsoleWarn(...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})