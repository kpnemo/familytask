const fs = require('fs').promises;
const path = require('path');

class RollbackManager {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.logFile = path.join(__dirname, 'rollback.log');
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(message);
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async createBackup() {
    await this.log('🔄 Creating rollback backup...');
    
    try {
      // Create backup directory
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Backup current environment variables
      const envBackup = {
        DATABASE_URL: process.env.DATABASE_URL,
        VERCEL_DATABASE_URL: process.env.VERCEL_DATABASE_URL,
        DIRECT_URL: process.env.DIRECT_URL,
        timestamp: new Date().toISOString()
      };
      
      const envBackupPath = path.join(this.backupDir, 'env-backup.json');
      await fs.writeFile(envBackupPath, JSON.stringify(envBackup, null, 2));
      
      await this.log('✅ Backup created successfully');
      return envBackupPath;
    } catch (error) {
      await this.log(`❌ Backup creation failed: ${error.message}`);
      throw error;
    }
  }

  async rollbackDatabaseConnection() {
    await this.log('🔄 Rolling back database connection...');
    
    try {
      // Load backup
      const envBackupPath = path.join(this.backupDir, 'env-backup.json');
      const backup = JSON.parse(await fs.readFile(envBackupPath, 'utf8'));
      
      // Create rollback environment file
      const rollbackEnv = `# Rollback environment variables - Generated ${new Date().toISOString()}
# Original Supabase configuration restored

DATABASE_URL="${backup.DATABASE_URL}"
DIRECT_URL="${backup.DIRECT_URL || ''}"

# Backup of Vercel URL (keep for reference)
# VERCEL_DATABASE_URL="${backup.VERCEL_DATABASE_URL || ''}"
`;
      
      const envRollbackPath = path.join(__dirname, '../../.env.rollback');
      await fs.writeFile(envRollbackPath, rollbackEnv);
      
      await this.log('✅ Rollback environment file created: .env.rollback');
      await this.log('⚠️  MANUAL ACTION REQUIRED: Copy .env.rollback to .env and restart application');
      
      return envRollbackPath;
    } catch (error) {
      await this.log(`❌ Database connection rollback failed: ${error.message}`);
      throw error;
    }
  }

  async validateRollback() {
    await this.log('🔍 Validating rollback...');
    
    try {
      // Check if rollback files exist
      const envRollbackPath = path.join(__dirname, '../../.env.rollback');
      await fs.access(envRollbackPath);
      
      await this.log('✅ Rollback files validated');
      return true;
    } catch (error) {
      await this.log(`❌ Rollback validation failed: ${error.message}`);
      return false;
    }
  }

  async executeQuickRollback() {
    await this.log('\n🚨 EXECUTING EMERGENCY ROLLBACK 🚨\n');
    
    try {
      // 1. Create backup of current state
      const backupPath = await this.createBackup();
      
      // 2. Rollback database connection
      const rollbackPath = await this.rollbackDatabaseConnection();
      
      // 3. Validate rollback
      const isValid = await this.validateRollback();
      
      if (isValid) {
        await this.log('\n✅ ROLLBACK COMPLETED SUCCESSFULLY');
        await this.log('\n🔄 MANUAL STEPS REQUIRED:');
        await this.log('1. Copy .env.rollback to .env');
        await this.log('2. Restart your application');
        await this.log('3. Verify application is working with original database');
        await this.log('\n📁 Rollback files:');
        await this.log(`   - Backup: ${backupPath}`);
        await this.log(`   - Rollback env: ${rollbackPath}`);
      } else {
        throw new Error('Rollback validation failed');
      }
      
      return { success: true, backupPath, rollbackPath };
    } catch (error) {
      await this.log(`\n💥 ROLLBACK FAILED: ${error.message}`);
      await this.log('\n🆘 MANUAL EMERGENCY STEPS:');
      await this.log('1. Manually update DATABASE_URL in .env to original Supabase URL');
      await this.log('2. Remove VERCEL_DATABASE_URL from .env');
      await this.log('3. Restart application immediately');
      
      return { success: false, error: error.message };
    }
  }

  async checkApplicationHealth() {
    await this.log('🏥 Checking application health...');
    
    try {
      // Simple health check - try to require and test database connection
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Test query
      await prisma.user.findFirst();
      await prisma.$disconnect();
      
      await this.log('✅ Application health check passed');
      return true;
    } catch (error) {
      await this.log(`❌ Application health check failed: ${error.message}`);
      return false;
    }
  }

  async monitorRollback() {
    await this.log('👁️  Monitoring rollback status...');
    
    let attempts = 0;
    const maxAttempts = 5;
    const delay = 10000; // 10 seconds
    
    while (attempts < maxAttempts) {
      attempts++;
      await this.log(`🔍 Health check attempt ${attempts}/${maxAttempts}`);
      
      const isHealthy = await this.checkApplicationHealth();
      
      if (isHealthy) {
        await this.log('✅ Rollback successful - Application is healthy');
        return true;
      }
      
      if (attempts < maxAttempts) {
        await this.log(`⏳ Waiting ${delay/1000}s before next check...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    await this.log('❌ Rollback monitoring failed - Application may need manual intervention');
    return false;
  }

  async createRollbackPlan() {
    const plan = `# Emergency Rollback Plan

## Quick Rollback (< 2 minutes)

### Automatic Steps:
\`\`\`bash
cd scripts/migration
node 5-rollback.js
\`\`\`

### Manual Steps:
1. Copy \`.env.rollback\` to \`.env\`
2. Restart application: \`npm run dev\` or \`vercel --prod\`
3. Verify at: \`/api/health\`

## Manual Emergency Rollback (< 30 seconds)

If automatic rollback fails:

### 1. Update Environment Variables
\`\`\`bash
# In .env file, restore original Supabase URL:
DATABASE_URL="your-original-supabase-url"
DIRECT_URL="your-original-direct-url"

# Remove or comment out:
# VERCEL_DATABASE_URL="..."
\`\`\`

### 2. Restart Application
\`\`\`bash
# Local development
npm run dev

# Production
vercel --prod
\`\`\`

### 3. Verify Health
- Check \`/api/health\` endpoint
- Test user login
- Check \`/points\` page functionality

## Recovery Verification

### Critical Endpoints to Test:
- [ ] \`GET /api/health\` - Should return 200
- [ ] \`GET /api/user/points\` - Should not timeout
- [ ] \`POST /api/auth/login\` - Should work
- [ ] \`GET /dashboard\` - Should load

### Performance Check:
- [ ] \`/points\` page loads in < 2 seconds
- [ ] No database timeout errors in logs

## Rollback Decision Tree

\`\`\`
Migration Issues?
├─ Performance still slow? → Use automatic rollback
├─ Data integrity issues? → Use automatic rollback + data investigation
├─ Connection timeouts? → Emergency manual rollback
└─ Application errors? → Emergency manual rollback
\`\`\`

## Emergency Contacts
- Database admin access required
- Vercel dashboard access
- Application monitoring dashboard

---
*Generated: ${new Date().toISOString()}*
*Script: scripts/migration/5-rollback.js*
`;

    const planPath = path.join(__dirname, 'ROLLBACK-PLAN.md');
    await fs.writeFile(planPath, plan);
    await this.log(`📋 Rollback plan created: ${planPath}`);
    
    return planPath;
  }
}

// Main execution functions
async function createRollbackPlan() {
  const manager = new RollbackManager();
  await manager.createRollbackPlan();
}

async function executeRollback() {
  const manager = new RollbackManager();
  const result = await manager.executeQuickRollback();
  
  if (result.success) {
    // Monitor the rollback
    await manager.monitorRollback();
  }
  
  return result;
}

// CLI interface
async function main() {
  const action = process.argv[2];
  
  switch (action) {
    case 'plan':
      await createRollbackPlan();
      break;
    case 'execute':
      await executeRollback();
      break;
    default:
      console.log('Usage:');
      console.log('  node 5-rollback.js plan    - Create rollback plan');
      console.log('  node 5-rollback.js execute - Execute emergency rollback');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { RollbackManager };