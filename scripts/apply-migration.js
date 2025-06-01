#!/usr/bin/env node

const { execSync } = require('child_process')

console.log('🔄 Applying database migration for TASK_DELETED enum...')

try {
  // Try to apply the migration
  console.log('📝 Running migration...')
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    timeout: 30000 // 30 second timeout
  })
  console.log('✅ Migration applied successfully!')
} catch (error) {
  if (error.status === 'SIGTERM') {
    console.log('⏰ Migration timed out. Please run manually:')
    console.log('   npx prisma migrate deploy')
  } else {
    console.error('❌ Migration failed:', error.message)
    console.log('💡 Manual steps to fix:')
    console.log('1. Connect to your database')
    console.log('2. Run: ALTER TYPE "NotificationType" ADD VALUE \'TASK_DELETED\';')
    console.log('3. Or run: npx prisma db push')
  }
  process.exit(1)
}