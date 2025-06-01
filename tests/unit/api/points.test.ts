import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/points/deduct/route'
import { GET } from '@/app/api/points/history/route'
import { setupTestDatabase, cleanupTestData, createTestUsers, createTestFamily, addFamilyMember, getTestDb } from '@/tests/helpers/test-db'
import { createMockSession } from '@/tests/helpers/test-auth'

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const { getServerSession } = require('next-auth/next')

describe('/api/points', () => {
  beforeEach(async () => {
    await setupTestDatabase()
    getServerSession.mockClear()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('POST /api/points/deduct', () => {
    it('should allow parents to deduct points from children', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      // Give child some points first
      const db = await getTestDb()
      await db.pointsHistory.create({
        data: {
          userId: child.id,
          familyId: family.id,
          points: 20,
          reason: 'Initial points',
          createdBy: adminParent.id
        }
      })

      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      const deductionData = {
        userId: child.id,
        points: 5,
        reason: 'Ice cream reward'
      }

      const request = new NextRequest('http://localhost:3000/api/points/deduct', {
        method: 'POST',
        body: JSON.stringify(deductionData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.balanceBefore).toBe(20)
      expect(data.data.balanceAfter).toBe(15)
      expect(data.data.points).toBe(-5)
    })

    it('should not allow deducting more points than available', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      // Give child only 5 points
      const db = await getTestDb()
      await db.pointsHistory.create({
        data: {
          userId: child.id,
          familyId: family.id,
          points: 5,
          reason: 'Initial points',
          createdBy: adminParent.id
        }
      })

      const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
      getServerSession.mockResolvedValue(session)

      const deductionData = {
        userId: child.id,
        points: 10, // More than available
        reason: 'Expensive reward'
      }

      const request = new NextRequest('http://localhost:3000/api/points/deduct', {
        method: 'POST',
        body: JSON.stringify(deductionData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.message).toContain('only has 5 points available')
    })

    it('should not allow children to deduct points', async () => {
      const { child } = await createTestUsers()
      const session = createMockSession(child.id, child.email, child.name, 'CHILD')
      getServerSession.mockResolvedValue(session)

      const deductionData = {
        userId: child.id,
        points: 5,
        reason: 'Self reward'
      }

      const request = new NextRequest('http://localhost:3000/api/points/deduct', {
        method: 'POST',
        body: JSON.stringify(deductionData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/points/history', () => {
    it('should return points history', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      // Create some points history
      const db = await getTestDb()
      await db.pointsHistory.createMany({
        data: [
          {
            userId: child.id,
            familyId: family.id,
            points: 10,
            reason: 'Task completed',
            createdBy: adminParent.id
          },
          {
            userId: child.id,
            familyId: family.id,
            points: -3,
            reason: 'Reward Shop: Candy',
            createdBy: adminParent.id
          }
        ]
      })

      const session = createMockSession(child.id, child.email, child.name, 'CHILD')
      getServerSession.mockResolvedValue(session)

      const request = new NextRequest('http://localhost:3000/api/points/history')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data.history)).toBe(true)
      expect(data.data.history.length).toBe(2)
      expect(data.data.currentBalance).toBe(7)
    })

    it('should calculate running balance correctly', async () => {
      const { adminParent, child } = await createTestUsers()
      const { family } = await createTestFamily(adminParent.id)
      await addFamilyMember(family.id, child.id, 'CHILD')

      // Create points history with specific order
      const db = await getTestDb()
      const history1 = await db.pointsHistory.create({
        data: {
          userId: child.id,
          familyId: family.id,
          points: 10,
          reason: 'First task',
          createdBy: adminParent.id
        }
      })

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const history2 = await db.pointsHistory.create({
        data: {
          userId: child.id,
          familyId: family.id,
          points: 5,
          reason: 'Second task',
          createdBy: adminParent.id
        }
      })

      const session = createMockSession(child.id, child.email, child.name, 'CHILD')
      getServerSession.mockResolvedValue(session)

      const request = new NextRequest('http://localhost:3000/api/points/history')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.currentBalance).toBe(15)
      
      // Check running balance calculation
      const sortedHistory = data.data.history.sort((a: any, b: any) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      expect(sortedHistory[0].balanceAfter).toBe(10)
      expect(sortedHistory[1].balanceAfter).toBe(15)
    })
  })
})