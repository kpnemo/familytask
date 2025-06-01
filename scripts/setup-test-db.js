#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function setupTestDatabase() {
  try {
    log('🔧 Setting up test database...', 'blue')
    
    // Create test database file if it doesn't exist
    const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')
    
    // Backup existing test database if it exists
    if (fs.existsSync(testDbPath)) {
      const backupPath = `${testDbPath}.backup.${Date.now()}`
      fs.copyFileSync(testDbPath, backupPath)
      log(`📦 Backed up existing test database to ${path.basename(backupPath)}`, 'yellow')
    }
    
    // Set test database environment
    process.env.DATABASE_URL = 'file:./test.db'
    
    // Generate Prisma client
    log('📝 Generating Prisma client...', 'blue')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Push schema to test database
    log('🗄️  Creating test database schema...', 'blue')
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    
    log('✅ Test database setup completed successfully!', 'green')
    log('💡 You can now run tests with: npm run test', 'blue')
    
  } catch (error) {
    log(`❌ Error setting up test database: ${error.message}`, 'red')
    process.exit(1)
  }
}

async function cleanTestDatabase() {
  try {
    log('🧹 Cleaning test database...', 'blue')
    
    const testDbPath = path.join(process.cwd(), 'prisma', 'test.db')
    
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
      log('🗑️  Removed test database file', 'yellow')
    }
    
    // Recreate clean database
    process.env.DATABASE_URL = 'file:./test.db'
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    })
    
    log('✅ Test database cleaned successfully!', 'green')
    
  } catch (error) {
    log(`❌ Error cleaning test database: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Command line interface
const command = process.argv[2]

switch (command) {
  case 'setup':
    setupTestDatabase()
    break
  case 'clean':
    cleanTestDatabase()
    break
  default:
    log('Usage: node setup-test-db.js [setup|clean]', 'yellow')
    log('  setup - Create and initialize test database', 'blue')
    log('  clean - Remove and recreate test database', 'blue')
    process.exit(1)
}