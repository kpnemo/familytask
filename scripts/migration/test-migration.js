const { SupabaseExporter } = require('./2-export-from-supabase');
const { VercelImporter } = require('./3-import-to-vercel');
const { MigrationValidator } = require('./4-validate-migration');
const { RollbackManager } = require('./5-rollback');

class MigrationTester {
  constructor() {
    this.testResults = {};
    this.startTime = Date.now();
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
    console.log(`${icon} ${message}`);
  }

  async testEnvironmentSetup() {
    await this.log('🔍 Testing environment setup...');
    
    const requiredEnvVars = [
      'DATABASE_URL',           // Source Supabase
      'VERCEL_DATABASE_URL'     // Target Vercel Postgres
    ];
    
    const missing = [];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      await this.log(`Missing environment variables: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    await this.log('Environment variables configured correctly', 'success');
    return true;
  }

  async testDatabaseConnections() {
    await this.log('🔌 Testing database connections...');
    
    try {
      const { DatabaseManager } = require('./utils/db-connections');
      const dbManager = new DatabaseManager();
      
      // Test source connection
      const sourceDb = await dbManager.connectSource(process.env.DATABASE_URL);
      await sourceDb.$queryRaw`SELECT 1 as test`;
      await this.log('Source database (Supabase) connection: OK', 'success');
      
      // Test target connection
      const targetDb = await dbManager.connectTarget(process.env.VERCEL_DATABASE_URL);
      await targetDb.$queryRaw`SELECT 1 as test`;
      await this.log('Target database (Vercel Postgres) connection: OK', 'success');
      
      await dbManager.disconnect();
      return true;
    } catch (error) {
      await this.log(`Database connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDataExport() {
    await this.log('📤 Testing data export...');
    
    try {
      const exporter = new SupabaseExporter();
      await exporter.initialize();
      const result = await exporter.exportAllTables();
      const isValid = await exporter.validateExport();
      await exporter.cleanup();
      
      if (isValid && result.manifest.totalRecords > 0) {
        await this.log(`Export test successful: ${result.manifest.totalRecords} records exported`, 'success');
        this.testResults.export = { success: true, recordCount: result.manifest.totalRecords };
        return true;
      } else {
        await this.log('Export test failed: No data or validation failed', 'error');
        this.testResults.export = { success: false, error: 'No data or validation failed' };
        return false;
      }
    } catch (error) {
      await this.log(`Export test failed: ${error.message}`, 'error');
      this.testResults.export = { success: false, error: error.message };
      return false;
    }
  }

  async testDataImport() {
    await this.log('📥 Testing data import...');
    
    try {
      const importer = new VercelImporter();
      await importer.initialize();
      const report = await importer.importAllTables();
      const isValid = await importer.validateImport();
      await importer.cleanup();
      
      if (isValid && report.totalRecords > 0) {
        await this.log(`Import test successful: ${report.totalRecords} records imported`, 'success');
        this.testResults.import = { success: true, recordCount: report.totalRecords };
        return true;
      } else {
        await this.log('Import test failed: Validation failed', 'error');
        this.testResults.import = { success: false, error: 'Validation failed' };
        return false;
      }
    } catch (error) {
      await this.log(`Import test failed: ${error.message}`, 'error');
      this.testResults.import = { success: false, error: error.message };
      return false;
    }
  }

  async testDataValidation() {
    await this.log('🔍 Testing data validation...');
    
    try {
      const validator = new MigrationValidator();
      await validator.initialize();
      
      const basicChecks = await validator.performBasicChecks();
      const deepValidation = await validator.performDeepValidation();
      const queryTests = await validator.testApplicationQueries();
      const performanceTests = await validator.testPerformance();
      
      const report = await validator.generateReport(basicChecks, deepValidation, queryTests, performanceTests);
      await validator.cleanup();
      
      if (report.migration.status === 'SUCCESS') {
        await this.log('Validation test successful: All checks passed', 'success');
        this.testResults.validation = { success: true, report };
        return true;
      } else {
        await this.log('Validation test failed: Some checks failed', 'error');
        this.testResults.validation = { success: false, report };
        return false;
      }
    } catch (error) {
      await this.log(`Validation test failed: ${error.message}`, 'error');
      this.testResults.validation = { success: false, error: error.message };
      return false;
    }
  }

  async testRollbackProcedure() {
    await this.log('🔄 Testing rollback procedure...');
    
    try {
      const rollbackManager = new RollbackManager();
      
      // Create rollback plan
      const planPath = await rollbackManager.createRollbackPlan();
      
      // Test backup creation
      const backupPath = await rollbackManager.createBackup();
      
      await this.log('Rollback test successful: Plan and backup created', 'success');
      this.testResults.rollback = { success: true, planPath, backupPath };
      return true;
    } catch (error) {
      await this.log(`Rollback test failed: ${error.message}`, 'error');
      this.testResults.rollback = { success: false, error: error.message };
      return false;
    }
  }

  async runFullMigrationTest() {
    await this.log('\n🧪 Starting Full Migration Test Suite\n');
    
    const tests = [
      { name: 'Environment Setup', fn: () => this.testEnvironmentSetup() },
      { name: 'Database Connections', fn: () => this.testDatabaseConnections() },
      { name: 'Data Export', fn: () => this.testDataExport() },
      { name: 'Data Import', fn: () => this.testDataImport() },
      { name: 'Data Validation', fn: () => this.testDataValidation() },
      { name: 'Rollback Procedure', fn: () => this.testRollbackProcedure() }
    ];
    
    const results = {};
    let allPassed = true;
    
    for (const test of tests) {
      try {
        await this.log(`\n--- Testing: ${test.name} ---`);
        const passed = await test.fn();
        results[test.name] = passed;
        
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        await this.log(`Test ${test.name} threw error: ${error.message}`, 'error');
        results[test.name] = false;
        allPassed = false;
      }
    }
    
    await this.generateTestReport(results, allPassed);
    return allPassed;
  }

  async generateTestReport(results, allPassed) {
    const duration = Date.now() - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      status: allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED',
      results,
      testResults: this.testResults,
      summary: {
        passed: Object.values(results).filter(r => r === true).length,
        failed: Object.values(results).filter(r => r === false).length,
        total: Object.keys(results).length
      },
      readyForProduction: allPassed
    };
    
    // Save report
    const fs = require('fs').promises;
    const path = require('path');
    const reportPath = path.join(__dirname, 'exports', 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    await this.log('\n' + '='.repeat(60));
    await this.log('🎯 MIGRATION TEST SUMMARY');
    await this.log('='.repeat(60));
    
    await this.log(`📅 Timestamp: ${report.timestamp}`);
    await this.log(`⏱️ Duration: ${report.duration}`);
    await this.log(`📊 Status: ${report.status}`);
    
    await this.log(`\n📋 Test Results:`);
    for (const [testName, passed] of Object.entries(results)) {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      await this.log(`   ${testName}: ${status}`);
    }
    
    await this.log(`\n📈 Summary:`);
    await this.log(`   Passed: ${report.summary.passed}/${report.summary.total}`);
    await this.log(`   Failed: ${report.summary.failed}/${report.summary.total}`);
    
    if (allPassed) {
      await this.log(`\n🎉 ALL TESTS PASSED - READY FOR PRODUCTION MIGRATION`, 'success');
      await this.log(`📁 Test report: ${reportPath}`);
    } else {
      await this.log(`\n⚠️ SOME TESTS FAILED - REVIEW BEFORE PRODUCTION`, 'warning');
      await this.log(`📁 Detailed report: ${reportPath}`);
    }
    
    await this.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const action = process.argv[2] || 'full';
  const tester = new MigrationTester();
  
  try {
    switch (action) {
      case 'full':
        const success = await tester.runFullMigrationTest();
        process.exit(success ? 0 : 1);
        break;
      case 'env':
        await tester.testEnvironmentSetup();
        break;
      case 'connections':
        await tester.testDatabaseConnections();
        break;
      case 'export':
        await tester.testDataExport();
        break;
      case 'import':
        await tester.testDataImport();
        break;
      case 'validation':
        await tester.testDataValidation();
        break;
      case 'rollback':
        await tester.testRollbackProcedure();
        break;
      default:
        console.log('Usage:');
        console.log('  node test-migration.js [test]');
        console.log('');
        console.log('Available tests:');
        console.log('  full        - Run all tests (default)');
        console.log('  env         - Test environment setup');
        console.log('  connections - Test database connections');
        console.log('  export      - Test data export');
        console.log('  import      - Test data import');
        console.log('  validation  - Test data validation');
        console.log('  rollback    - Test rollback procedure');
    }
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationTester };