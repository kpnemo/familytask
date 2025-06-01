import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/tasks/route'
import { setupTestDatabase, cleanupTestData, createTestUsers, createTestFamily, addFamilyMember, createTestTask } from '@/tests/helpers/test-db'
import { createMockSession, mockGetServerSession } from '@/tests/helpers/test-auth'

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const { getServerSession } = require('next-auth/next')

describe('/api/tasks', () => {
  beforeEach(async () => {
    await setupTestDatabase()
    getServerSession.mockClear()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/tasks', () => {
    it('should return tasks for authenticated user', async () => {
      // Setup test data
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')
      await createTestTask(adminParent.id, child.id, family.id)

      // Mock session
      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      // Create request
      const request = new NextRequest('http://localhost:3000/api/tasks')

      // Execute
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      expect(data.data[0]).toHaveProperty('title', 'Test Task')
    })

    it('should return 401 for unauthenticated request', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should filter tasks by status', async () => {
      // Setup test data
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')
      await createTestTask(adminParent.id, child.id, family.id, 'PENDING')

      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      const request = new NextRequest('http://localhost:3000/api/tasks?status=PENDING')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.every((task: any) => task.status === 'PENDING')).toBe(true)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      const taskData = {
        title: 'New Test Task',
        description: 'New task description',
        points: 10,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: child.id
      }

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('title', 'New Test Task')
      expect(data.data).toHaveProperty('points', 10)
    })

    it('should return 400 for invalid task data', async () => {
      const { adminParent } = await createTestUsers()
      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      const invalidTaskData = {
        title: '', // Invalid: empty title
        points: -5 // Invalid: negative points
      }

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(invalidTaskData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should not allow children to assign tasks to others', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      const session = createMockSession(child.id, child.email, child.name, 'CHILD')
      getServerSession.mockResolvedValue(session)

      const taskData = {
        title: 'Task from child',
        description: 'Child trying to assign task',
        points: 5,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: adminParent.id // Child trying to assign to parent
      }

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      expect(response.status).toBe(403)
    })
  })
})