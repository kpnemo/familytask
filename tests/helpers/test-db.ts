import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let testDb: PrismaClient

export async function setupTestDatabase() {
  if (!testDb) {
    testDb = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'file:./test.db'
        }
      }
    })
  }

  // Clean up existing test data
  await cleanupTestData()
  
  return testDb
}

export async function cleanupTestData() {
  if (!testDb) return

  try {
    // Delete in order to respect foreign key constraints
    await testDb.notification.deleteMany()
    await testDb.pointsHistory.deleteMany()
    await testDb.taskTagRelation.deleteMany()
    await testDb.task.deleteMany()
    await testDb.taskTag.deleteMany()
    await testDb.familyMember.deleteMany()
    await testDb.family.deleteMany()
    await testDb.user.deleteMany()
  } catch (error) {
    console.error('Error cleaning up test data:', error)
  }
}

export async function createTestUsers() {
  const hashedPassword = await bcrypt.hash('testpassword', 12)
  
  const adminParent = await testDb.user.create({
    data: {
      id: 'admin-test-id',
      email: 'admin@test.com',
      name: 'Test Admin Parent',
      passwordHash: hashedPassword,
      role: 'PARENT'
    }
  })

  const parent = await testDb.user.create({
    data: {
      id: 'parent-test-id',
      email: 'parent@test.com',
      name: 'Test Parent',
      passwordHash: hashedPassword,
      role: 'PARENT'
    }
  })

  const child = await testDb.user.create({
    data: {
      id: 'child-test-id',
      email: 'child@test.com',
      name: 'Test Child',
      passwordHash: hashedPassword,
      role: 'CHILD'
    }
  })

  return { adminParent, parent, child }
}

export async function createTestFamily(adminParentId: string) {
  const family = await testDb.family.create({
    data: {
      id: 'test-family-id',
      name: 'Test Family',
      familyCode: 'TEST1234'
    }
  })

  const adminMember = await testDb.familyMember.create({
    data: {
      id: 'admin-member-id',
      familyId: family.id,
      userId: adminParentId,
      role: 'ADMIN_PARENT'
    }
  })

  return { family, adminMember }
}

export async function addFamilyMember(familyId: string, userId: string, role: 'PARENT' | 'CHILD') {
  return await testDb.familyMember.create({
    data: {
      familyId,
      userId,
      role: role === 'PARENT' ? 'PARENT' : 'CHILD'
    }
  })
}

export async function createTestTask(createdBy: string, assignedTo: string, familyId: string, status = 'PENDING') {
  return await testDb.task.create({
    data: {
      id: 'test-task-id',
      title: 'Test Task',
      description: 'Test task description',
      points: 5,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status,
      createdBy,
      assignedTo,
      familyId
    }
  })
}

export async function getTestDb() {
  if (!testDb) {
    await setupTestDatabase()
  }
  return testDb
}

export async function teardownTestDatabase() {
  if (testDb) {
    await cleanupTestData()
    await testDb.$disconnect()
  }
}