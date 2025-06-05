import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { DELETE } from '@/app/api/tasks/[id]/route'
import { setupTestDatabase, cleanupTestData, createTestUsers, createTestFamily, addFamilyMember, createTestTask, getTestDb } from '@/tests/helpers/test-db'
import { createMockSession } from '@/tests/helpers/test-auth'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

const { getServerSession } = require('next-auth')

describe('DELETE /api/tasks/[id]', () => {
  beforeEach(async () => {
    await setupTestDatabase()
    getServerSession.mockClear()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should allow parents to delete tasks', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    const task = await createTestTask(adminParent.id, child.id, family.id)

    const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toBe('Task deleted successfully')
    expect(data.data.taskTitle).toBe('Test Task')

    // Verify task is actually deleted
    const db = await getTestDb()
    const deletedTask = await db.task.findUnique({ where: { id: task.id } })
    expect(deletedTask).toBeNull()
  })

  it('should remove original points entry when deleting verified tasks', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    const task = await createTestTask(adminParent.id, child.id, family.id, 'VERIFIED')

    const db = await getTestDb()
    
    // Create points history entry for verified task (child starts with 0, gets 5 points)
    await db.pointsHistory.create({
      data: {
        userId: child.id,
        familyId: family.id,
        points: 5,
        reason: 'Task completed: Test Task',
        taskId: task.id,
        createdBy: adminParent.id
      }
    })
    
    // Child now has 5 points, but after deletion should return to 0

    const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.pointsAdjustment).toBeDefined()
    expect(data.data.pointsAdjustment.pointsReversed).toBe(5)

    // Verify no entries remain linked to the deleted task
    const remainingTaskEntries = await db.pointsHistory.findMany({
      where: {
        userId: child.id,
        taskId: task.id
      }
    })
    expect(remainingTaskEntries).toHaveLength(0)
    
    // Verify we have exactly 2 entries after deletion
    const allPointsEntries = await db.pointsHistory.findMany({
      where: { userId: child.id }
    })
    expect(allPointsEntries).toHaveLength(2)
    
    // Find the original entry (now with null taskId and updated reason)
    const originalEntry = allPointsEntries.find(entry => 
      entry.points === 5 && entry.reason.includes('task deleted')
    )
    expect(originalEntry).toBeDefined()
    expect(originalEntry!.taskId).toBeNull()
    expect(originalEntry!.reason).toContain('Task completed: Test Task (task deleted)')
    
    // Find the reversal entry
    const reversalEntry = allPointsEntries.find(entry => 
      entry.points === -5 && entry.reason.includes('points reversed')
    )
    expect(reversalEntry).toBeDefined()
    expect(reversalEntry!.taskId).toBeNull()
    expect(reversalEntry!.reason).toContain('Task deleted: Test Task (points reversed)')
    
    // Verify the child's points balance is correct (5 - 5 = 0)
    const currentBalance = allPointsEntries.reduce((sum, entry) => sum + entry.points, 0)
    expect(currentBalance).toBe(0) // Original balance restored
  })

  it('should prevent children from deleting tasks', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    const task = await createTestTask(adminParent.id, child.id, family.id)

    const session = createMockSession(child.id, child.email, child.name, 'CHILD')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })

    expect(response.status).toBe(403)
  })

  it('should delete related notifications when deleting task', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    const task = await createTestTask(adminParent.id, child.id, family.id)

    const db = await getTestDb()
    
    // Create notification related to the task
    await db.notification.create({
      data: {
        userId: child.id,
        title: 'Task Assigned',
        message: 'You have been assigned a new task',
        type: 'TASK_ASSIGNED',
        relatedTaskId: task.id
      }
    })

    const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })

    expect(response.status).toBe(200)

    // Verify notification was deleted
    const notification = await db.notification.findFirst({
      where: { relatedTaskId: task.id }
    })
    expect(notification).toBeNull()
  })

  it('should create deletion notifications for affected users', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    const task = await createTestTask(adminParent.id, child.id, family.id)

    const session = createMockSession(adminParent.id, adminParent.email, adminParent.name, 'PARENT')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })

    expect(response.status).toBe(200)

    // Verify deletion notification was created for assignee
    const db = await getTestDb()
    const notification = await db.notification.findFirst({
      where: {
        userId: child.id,
        type: 'TASK_DELETED'
      }
    })
    expect(notification).toBeDefined()
    expect(notification?.message).toContain('has been deleted')
  })

  it('should not allow deleting tasks from other families', async () => {
    const { adminParent, child } = await createTestUsers()
    const { family } = await createTestFamily(adminParent.id)
    await addFamilyMember(family.id, child.id, 'CHILD')
    
    // Create another parent in different family
    const db = await getTestDb()
    const otherParent = await db.user.create({
      data: {
        id: 'other-parent-id',
        email: 'other@test.com',
        name: 'Other Parent',
        passwordHash: 'hash',
        role: 'PARENT'
      }
    })

    const otherFamily = await db.family.create({
      data: {
        id: 'other-family-id',
        name: 'Other Family',
        familyCode: 'OTHER123'
      }
    })

    await db.familyMember.create({
      data: {
        familyId: otherFamily.id,
        userId: otherParent.id,
        role: 'ADMIN_PARENT'
      }
    })

    // Create task in first family
    const task = await createTestTask(adminParent.id, child.id, family.id)

    // Try to delete with other parent
    const session = createMockSession(otherParent.id, otherParent.email, otherParent.name, 'PARENT')
    getServerSession.mockResolvedValue(session)

    const request = new NextRequest(`http://localhost:3000/api/tasks/${task.id}`, {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: task.id }) })

    expect(response.status).toBe(404)
  })

  it('should return 401 for unauthenticated requests', async () => {
    getServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/tasks/some-id', {
      method: 'DELETE'
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'some-id' }) })

    expect(response.status).toBe(401)
  })
})