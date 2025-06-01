#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader() {
  console.clear()
  console.log(colorize('╔══════════════════════════════════════════════════════════╗', 'cyan'))
  console.log(colorize('║               FamilyTasks Test Runner                    ║', 'cyan'))
  console.log(colorize('║                Pre-Deployment Testing                   ║', 'cyan'))
  console.log(colorize('╚══════════════════════════════════════════════════════════╝', 'cyan'))
  console.log('')
}

function printMenu() {
  console.log(colorize('Available Test Suites:', 'bright'))
  console.log('')
  console.log('  1. ' + colorize('Quick Smoke Test', 'green') + ' (5 minutes)')
  console.log('     ├─ Build verification')
  console.log('     ├─ Unit tests')
  console.log('     └─ Basic E2E tests')
  console.log('')
  console.log('  2. ' + colorize('Full Unit Test Suite', 'yellow') + ' (3 minutes)')
  console.log('     ├─ API endpoint tests')
  console.log('     ├─ Utility function tests')
  console.log('     └─ Database integration tests')
  console.log('')
  console.log('  3. ' + colorize('E2E Test Suite', 'blue') + ' (15 minutes)')
  console.log('     ├─ Authentication flow')
  console.log('     ├─ Task management workflow')
  console.log('     ├─ Points & reward shop')
  console.log('     └─ Role-based permissions')
  console.log('')
  console.log('  4. ' + colorize('Complete Test Suite', 'magenta') + ' (20 minutes)')
  console.log('     ├─ All unit tests')
  console.log('     ├─ All E2E tests')
  console.log('     ├─ Build verification')
  console.log('     └─ Coverage report')
  console.log('')
  console.log('  5. ' + colorize('Custom Test Selection', 'cyan'))
  console.log('  6. ' + colorize('Setup Test Environment', 'yellow'))
  console.log('  0. ' + colorize('Exit', 'red'))
  console.log('')
}

async function runCommand(command, description, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(colorize(`\n🔄 ${description}...`, 'blue'))
    
    const child = spawn(command, { 
      shell: true, 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: process.cwd()
    })

    let output = ''
    if (options.silent) {
      child.stdout.on('data', (data) => {
        output += data.toString()
      })
      child.stderr.on('data', (data) => {
        output += data.toString()
      })
    }

    child.on('close', (code) => {
      if (code === 0) {
        console.log(colorize(`✅ ${description} completed successfully`, 'green'))
        resolve({ success: true, output })
      } else {
        console.log(colorize(`❌ ${description} failed (exit code: ${code})`, 'red'))
        if (options.silent && output) {
          console.log('Output:', output)
        }
        if (options.continueOnError) {
          resolve({ success: false, output })
        } else {
          reject(new Error(`${description} failed`))
        }
      }
    })

    child.on('error', (err) => {
      console.log(colorize(`❌ Error running ${description}: ${err.message}`, 'red'))
      reject(err)
    })
  })
}

async function checkPrerequisites() {
  console.log(colorize('\n🔍 Checking prerequisites...', 'yellow'))
  
  const checks = [
    { command: 'node --version', name: 'Node.js' },
    { command: 'npm --version', name: 'npm' },
    { command: 'npx --version', name: 'npx' }
  ]

  for (const check of checks) {
    try {
      const result = execSync(check.command, { encoding: 'utf8' })
      console.log(colorize(`✅ ${check.name}: ${result.trim()}`, 'green'))
    } catch (error) {
      console.log(colorize(`❌ ${check.name} not found`, 'red'))
      return false
    }
  }

  // Check if dependencies are installed
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log(colorize('❌ Dependencies not installed. Run: npm install', 'red'))
    return false
  }

  return true
}

async function runQuickSmokeTest() {
  console.log(colorize('\n🚀 Running Quick Smoke Test...', 'bright'))
  
  try {
    await runCommand('npm run build', 'Building application')
    await runCommand('npm run lint', 'Running linter', { continueOnError: true })
    await runCommand('npx jest --testPathPattern=unit --maxWorkers=2', 'Running core unit tests')
    await runCommand('npx playwright test tests/e2e/auth.spec.ts --workers=1', 'Running authentication E2E tests')
    
    console.log(colorize('\n✅ Quick Smoke Test completed successfully!', 'green'))
    console.log(colorize('📋 Your application is ready for deployment.', 'cyan'))
    
  } catch (error) {
    console.log(colorize('\n❌ Quick Smoke Test failed!', 'red'))
    console.log(colorize('⚠️  Please fix the issues before deploying.', 'yellow'))
    throw error
  }
}

async function runFullUnitTests() {
  console.log(colorize('\n🧪 Running Full Unit Test Suite...', 'bright'))
  
  try {
    await runCommand('npx jest --testPathPattern=unit --coverage', 'Running all unit tests with coverage')
    console.log(colorize('\n✅ All unit tests passed!', 'green'))
    console.log(colorize('📊 Coverage report generated in coverage/ directory', 'cyan'))
    
  } catch (error) {
    console.log(colorize('\n❌ Unit tests failed!', 'red'))
    throw error
  }
}

async function runE2ETests() {
  console.log(colorize('\n🎭 Running E2E Test Suite...', 'bright'))
  
  try {
    console.log(colorize('📝 Note: This will start a development server automatically', 'yellow'))
    await runCommand('npx playwright test --workers=2', 'Running all E2E tests')
    console.log(colorize('\n✅ All E2E tests passed!', 'green'))
    console.log(colorize('📋 E2E test report available in playwright-report/', 'cyan'))
    
  } catch (error) {
    console.log(colorize('\n❌ E2E tests failed!', 'red'))
    console.log(colorize('💡 Check the Playwright report for details', 'yellow'))
    throw error
  }
}

async function runCompleteTestSuite() {
  console.log(colorize('\n🏆 Running Complete Test Suite...', 'bright'))
  
  const startTime = Date.now()
  
  try {
    await runCommand('npm run build', 'Building application')
    await runCommand('npm run lint', 'Running linter')
    await runCommand('npx jest --testPathPattern=unit --coverage', 'Running all unit tests')
    await runCommand('npx playwright test --workers=2', 'Running all E2E tests')
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log(colorize('\n🎉 Complete Test Suite passed!', 'green'))
    console.log(colorize(`⏱️  Total execution time: ${duration} seconds`, 'cyan'))
    console.log(colorize('🚀 Your application is fully tested and ready for deployment!', 'bright'))
    
  } catch (error) {
    console.log(colorize('\n💥 Complete Test Suite failed!', 'red'))
    throw error
  }
}

async function runCustomTests() {
  console.log(colorize('\n⚙️  Custom Test Selection', 'bright'))
  console.log('')
  console.log('Available test categories:')
  console.log('  a) Build & Lint')
  console.log('  b) API Unit Tests')
  console.log('  c) Utility Unit Tests') 
  console.log('  d) Authentication E2E')
  console.log('  e) Task Workflow E2E')
  console.log('  f) Reward Shop E2E')
  console.log('')
  
  const answer = await askQuestion('Enter letters (e.g., "ace" for build+api+auth): ')
  const selections = answer.toLowerCase().split('')
  
  console.log(colorize('\n🎯 Running selected tests...', 'bright'))
  
  try {
    for (const selection of selections) {
      switch (selection) {
        case 'a':
          await runCommand('npm run build', 'Building application')
          await runCommand('npm run lint', 'Running linter')
          break
        case 'b':
          await runCommand('npx jest --testPathPattern="api.*test"', 'Running API unit tests')
          break
        case 'c':
          await runCommand('npx jest --testPathPattern="utils.*test"', 'Running utility unit tests')
          break
        case 'd':
          await runCommand('npx playwright test tests/e2e/auth.spec.ts', 'Running authentication E2E tests')
          break
        case 'e':
          await runCommand('npx playwright test tests/e2e/task-workflow.spec.ts', 'Running task workflow E2E tests')
          break
        case 'f':
          await runCommand('npx playwright test tests/e2e/reward-shop.spec.ts', 'Running reward shop E2E tests')
          break
        default:
          console.log(colorize(`⚠️  Unknown selection: ${selection}`, 'yellow'))
      }
    }
    
    console.log(colorize('\n✅ Custom test selection completed!', 'green'))
    
  } catch (error) {
    console.log(colorize('\n❌ Custom tests failed!', 'red'))
    throw error
  }
}

async function setupTestEnvironment() {
  console.log(colorize('\n🔧 Setting up test environment...', 'bright'))
  
  try {
    // Install dependencies if needed
    if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
      await runCommand('npm install', 'Installing dependencies')
    }
    
    // Install Playwright browsers
    await runCommand('npx playwright install', 'Installing Playwright browsers')
    
    // Setup test database
    await runCommand('npx prisma generate', 'Generating Prisma client')
    
    // Create test directories if they don't exist
    const testDirs = ['tests/unit', 'tests/e2e', 'tests/helpers']
    for (const dir of testDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(colorize(`✅ Created directory: ${dir}`, 'green'))
      }
    }
    
    console.log(colorize('\n✅ Test environment setup completed!', 'green'))
    console.log(colorize('🎯 You can now run any test suite.', 'cyan'))
    
  } catch (error) {
    console.log(colorize('\n❌ Test environment setup failed!', 'red'))
    throw error
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(colorize(question, 'cyan'), resolve)
  })
}

async function main() {
  try {
    printHeader()
    
    if (!(await checkPrerequisites())) {
      console.log(colorize('\n❌ Prerequisites check failed. Please fix the issues and try again.', 'red'))
      process.exit(1)
    }
    
    while (true) {
      printMenu()
      const answer = await askQuestion('Select an option (0-6): ')
      
      try {
        switch (answer.trim()) {
          case '1':
            await runQuickSmokeTest()
            break
          case '2':
            await runFullUnitTests()
            break
          case '3':
            await runE2ETests()
            break
          case '4':
            await runCompleteTestSuite()
            break
          case '5':
            await runCustomTests()
            break
          case '6':
            await setupTestEnvironment()
            break
          case '0':
            console.log(colorize('\n👋 Goodbye! Happy testing!', 'green'))
            process.exit(0)
          default:
            console.log(colorize('\n❓ Invalid option. Please try again.', 'yellow'))
            continue
        }
        
        const continueAnswer = await askQuestion('\nPress Enter to return to menu or type "exit" to quit: ')
        if (continueAnswer.toLowerCase() === 'exit') {
          console.log(colorize('\n👋 Goodbye! Happy testing!', 'green'))
          break
        }
        printHeader()
        
      } catch (error) {
        console.log(colorize(`\n💥 Error: ${error.message}`, 'red'))
        const retryAnswer = await askQuestion('\nPress Enter to return to menu or type "exit" to quit: ')
        if (retryAnswer.toLowerCase() === 'exit') {
          break
        }
        printHeader()
      }
    }
    
  } catch (error) {
    console.log(colorize(`\n💥 Fatal error: ${error.message}`, 'red'))
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(colorize('\n\n👋 Test runner interrupted. Goodbye!', 'yellow'))
  process.exit(0)
})

if (require.main === module) {
  main()
}