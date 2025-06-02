// Test script to verify icon generation API
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testIconFields() {
  try {
    console.log('🔍 Testing Prisma client icon field access...')
    
    // Try to find a task with icon fields
    const tasks = await prisma.task.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        iconUrl: true,
        iconGenerated: true,
        iconPrompt: true
      }
    })
    
    console.log('✅ Successfully accessed icon fields!')
    console.log('📋 Sample tasks:')
    tasks.forEach(task => {
      console.log(`  - ${task.title} (ID: ${task.id})`)
      console.log(`    iconGenerated: ${task.iconGenerated}`)
      console.log(`    iconUrl: ${task.iconUrl}`)
      console.log(`    iconPrompt: ${task.iconPrompt}`)
      console.log('')
    })
    
    // Try to update a task with icon fields
    if (tasks.length > 0) {
      console.log('🧪 Testing update operation...')
      const testTask = tasks[0]
      
      const updated = await prisma.task.update({
        where: { id: testTask.id },
        data: {
          iconPrompt: 'Test prompt'
        }
      })
      
      console.log('✅ Successfully updated task with icon field!')
      console.log(`Updated task ${updated.id} iconPrompt to: "${updated.iconPrompt}"`)
    }
    
  } catch (error) {
    console.error('❌ Error accessing icon fields:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testIconFields()
