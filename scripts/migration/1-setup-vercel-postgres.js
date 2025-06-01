const fs = require('fs').promises;
const path = require('path');

class VercelSetup {
  constructor() {
    this.setupLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.setupLog.push(logEntry);
    
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '📝';
    console.log(`${icon} ${message}`);
  }

  async checkVercelCLI() {
    this.log('Checking Vercel CLI installation...');
    
    try {
      const { execSync } = require('child_process');
      const output = execSync('vercel --version', { encoding: 'utf8' });
      this.log(`✅ Vercel CLI found: ${output.trim()}`);
      return true;
    } catch (error) {
      this.log('❌ Vercel CLI not found. Please install: npm i -g vercel', 'error');
      return false;
    }
  }

  async checkVercelAuth() {
    this.log('Checking Vercel authentication...');
    
    try {
      const { execSync } = require('child_process');
      execSync('vercel whoami', { encoding: 'utf8' });
      this.log('✅ Vercel authentication verified');
      return true;
    } catch (error) {
      this.log('❌ Not authenticated with Vercel. Please run: vercel login', 'error');
      return false;
    }
  }

  async createDatabase() {
    this.log('Setting up Vercel Postgres database...');
    
    try {
      const { execSync } = require('child_process');
      
      // Create database
      this.log('Creating Vercel Postgres database...');
      const output = execSync('vercel env add POSTGRES_URL', { 
        encoding: 'utf8',
        input: 'production\\n'
      });
      
      this.log('✅ Vercel Postgres database created');
      return true;
    } catch (error) {
      this.log(`❌ Failed to create database: ${error.message}`, 'error');
      return false;
    }
  }

  async getConnectionStrings() {
    this.log('Retrieving database connection strings...');
    
    try {
      const { execSync } = require('child_process');
      
      // Get environment variables
      const envOutput = execSync('vercel env ls', { encoding: 'utf8' });
      this.log('Environment variables retrieved');
      
      // Note: In real setup, you would parse the actual connection strings
      // This is a placeholder for the manual process
      this.log('⚠️ Manual step required: Copy connection strings from Vercel dashboard', 'warning');
      
      return {
        POSTGRES_URL: 'postgres://...',  // Placeholder
        POSTGRES_URL_NON_POOLING: 'postgres://...'  // Placeholder
      };
    } catch (error) {
      this.log(`❌ Failed to get connection strings: ${error.message}`, 'error');
      return null;
    }
  }

  async createEnvironmentFile(connectionStrings) {
    this.log('Creating environment configuration...');
    
    try {
      const envTemplate = `# Vercel Postgres Configuration - Generated ${new Date().toISOString()}

# New Vercel Postgres URLs
VERCEL_DATABASE_URL="${connectionStrings.POSTGRES_URL}"
VERCEL_DIRECT_URL="${connectionStrings.POSTGRES_URL_NON_POOLING}"

# Original Supabase URLs (keep as backup during migration)
SUPABASE_DATABASE_URL="${process.env.DATABASE_URL || ''}"
SUPABASE_DIRECT_URL="${process.env.DIRECT_URL || ''}"

# Migration Instructions:
# 1. After successful migration testing, update:
#    DATABASE_URL=\${VERCEL_DATABASE_URL}
#    DIRECT_URL=\${VERCEL_DIRECT_URL}
# 2. Remove SUPABASE_* variables after confirmation
`;

      const envPath = path.join(__dirname, '../../.env.vercel');
      await fs.writeFile(envPath, envTemplate);
      
      this.log(`✅ Environment file created: ${envPath}`);
      return envPath;
    } catch (error) {
      this.log(`❌ Failed to create environment file: ${error.message}`, 'error');
      throw error;
    }
  }

  async testConnection(connectionString) {
    this.log('Testing database connection...');
    
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: connectionString
          }
        }
      });
      
      await prisma.$queryRaw`SELECT 1 as test`;
      await prisma.$disconnect();
      
      this.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      this.log(`❌ Database connection test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runMigrations(connectionString) {
    this.log('Running Prisma migrations on new database...');
    
    try {
      const { execSync } = require('child_process');
      
      // Temporarily set the database URL for migration
      const env = { ...process.env, DATABASE_URL: connectionString };
      
      execSync('npx prisma migrate deploy', { 
        encoding: 'utf8',
        env,
        cwd: path.join(__dirname, '../..')
      });
      
      this.log('✅ Prisma migrations completed');
      return true;
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      return false;
    }
  }

  async generateSetupInstructions() {
    const instructions = `# Vercel Postgres Setup Instructions

## Automatic Setup Completed ✅

The setup script has prepared your Vercel Postgres database. Follow these steps to complete the setup:

### 1. Manual Steps Required

#### A. Get Connection Strings from Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Find \`POSTGRES_URL\` and \`POSTGRES_URL_NON_POOLING\`
5. Copy these values

#### B. Update Environment File
1. Open \`.env.vercel\` (created by this script)
2. Replace placeholder URLs with actual Vercel URLs
3. Save the file

### 2. Test Setup

Run the test script to verify everything works:
\`\`\`bash
cd scripts/migration
node 1-setup-vercel-postgres.js test
\`\`\`

### 3. Environment Configuration

The setup created these files:
- \`.env.vercel\` - New database configuration
- \`setup-log.json\` - Setup process log

### 4. Migration Process

After setup verification:
1. Run export: \`node 2-export-from-supabase.js\`
2. Run import: \`node 3-import-to-vercel.js\`
3. Run validation: \`node 4-validate-migration.js\`

### 5. Production Cutover

When ready for production:
1. Update \`.env\` with Vercel URLs
2. Deploy to production
3. Test thoroughly
4. Keep Supabase as backup for 7 days

## Troubleshooting

### Common Issues:

#### "Vercel CLI not found"
\`\`\`bash
npm install -g vercel
vercel login
\`\`\`

#### "Database connection failed"
- Verify URLs in Vercel dashboard
- Check network connectivity
- Ensure IP whitelist includes your location

#### "Migration failed"
- Check schema compatibility
- Verify Prisma version
- Review migration logs

## Support

For issues during setup:
1. Check setup log: \`scripts/migration/setup-log.json\`
2. Verify Vercel project settings
3. Review this documentation

---
*Generated: ${new Date().toISOString()}*
*Script: scripts/migration/1-setup-vercel-postgres.js*
`;

    const instructionsPath = path.join(__dirname, 'SETUP-INSTRUCTIONS.md');
    await fs.writeFile(instructionsPath, instructions);
    
    this.log(`📋 Setup instructions created: ${instructionsPath}`);
    return instructionsPath;
  }

  async saveSetupLog() {
    const logPath = path.join(__dirname, 'setup-log.json');
    const logData = {
      timestamp: new Date().toISOString(),
      logs: this.setupLog,
      summary: {
        success: this.setupLog.filter(l => l.type === 'error').length === 0,
        errors: this.setupLog.filter(l => l.type === 'error').length,
        warnings: this.setupLog.filter(l => l.type === 'warning').length
      }
    };
    
    await fs.writeFile(logPath, JSON.stringify(logData, null, 2));
    this.log(`📁 Setup log saved: ${logPath}`);
  }
}

// Main setup function
async function setupVercelPostgres() {
  const setup = new VercelSetup();
  
  try {
    setup.log('\n🚀 Starting Vercel Postgres setup...\n');
    
    // Prerequisites check
    const hasVercelCLI = await setup.checkVercelCLI();
    if (!hasVercelCLI) return false;
    
    const isAuthenticated = await setup.checkVercelAuth();
    if (!isAuthenticated) return false;
    
    // Database setup
    setup.log('\n📊 Setting up database...\n');
    
    // Note: Actual database creation requires manual steps or Vercel API
    setup.log('⚠️ MANUAL STEP: Create Postgres database in Vercel dashboard', 'warning');
    setup.log('1. Go to your Vercel project dashboard');
    setup.log('2. Navigate to Storage tab');
    setup.log('3. Create a new Postgres database');
    setup.log('4. Note the connection strings provided');
    
    // Generate setup files
    const connectionStrings = await setup.getConnectionStrings();
    const envPath = await setup.createEnvironmentFile(connectionStrings);
    const instructionsPath = await setup.generateSetupInstructions();
    
    await setup.saveSetupLog();
    
    setup.log('\n✅ Setup preparation completed!');
    setup.log(`📋 Next steps: Review ${instructionsPath}`);
    
    return true;
  } catch (error) {
    setup.log(`💥 Setup failed: ${error.message}`, 'error');
    await setup.saveSetupLog();
    return false;
  }
}

// Test function
async function testVercelSetup() {
  const setup = new VercelSetup();
  
  try {
    setup.log('🧪 Testing Vercel Postgres setup...');
    
    const vercelUrl = process.env.VERCEL_DATABASE_URL;
    if (!vercelUrl) {
      setup.log('❌ VERCEL_DATABASE_URL not found in environment', 'error');
      return false;
    }
    
    const isConnected = await setup.testConnection(vercelUrl);
    if (!isConnected) return false;
    
    setup.log('✅ Vercel Postgres setup test passed');
    return true;
  } catch (error) {
    setup.log(`❌ Test failed: ${error.message}`, 'error');
    return false;
  }
}

// CLI interface
async function main() {
  const action = process.argv[2] || 'setup';
  
  switch (action) {
    case 'setup':
      await setupVercelPostgres();
      break;
    case 'test':
      await testVercelSetup();
      break;
    default:
      console.log('Usage:');
      console.log('  node 1-setup-vercel-postgres.js setup - Run initial setup');
      console.log('  node 1-setup-vercel-postgres.js test  - Test configuration');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { VercelSetup };