import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export interface MockSession {
  user: {
    id: string
    email: string
    name: string
    role: 'PARENT' | 'CHILD'
  }
}

export function createMockSession(userId: string, email: string, name: string, role: 'PARENT' | 'CHILD'): MockSession {
  return {
    user: {
      id: userId,
      email,
      name,
      role
    }
  }
}

export function createMockRequest(session?: MockSession): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/test')
  
  if (session) {
    // Mock the session in the request
    Object.defineProperty(req, 'auth', {
      value: session,
      writable: true
    })
  }
  
  return req
}

// Mock getServerSession for testing
export function mockGetServerSession(session: MockSession | null) {
  return jest.fn().mockResolvedValue(session)
}

// Test user credentials
export const TEST_USERS = {
  ADMIN: {
    id: 'admin-test-id',
    email: 'admin@test.com',
    name: 'Test Admin Parent',
    role: 'PARENT' as const,
    password: 'testpassword'
  },
  PARENT: {
    id: 'parent-test-id',
    email: 'parent@test.com',
    name: 'Test Parent',
    role: 'PARENT' as const,
    password: 'testpassword'
  },
  CHILD: {
    id: 'child-test-id',
    email: 'child@test.com',
    name: 'Test Child',
    role: 'CHILD' as const,
    password: 'testpassword'
  }
}