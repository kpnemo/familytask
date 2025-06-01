const { DatabaseManager } = require('./utils/db-connections');
const { DataValidator } = require('./utils/data-validator');
const fs = require('fs').promises;
const path = require('path');

class MigrationValidator {
  constructor() {
    this.dbManager = new DatabaseManager();
    this.validator = null;
    this.reportPath = path.join(__dirname, 'exports', 'validation-report.json');
  }

  async initialize() {
    // Connect to both databases
    const supabaseUrl = process.env.DATABASE_URL;
    const vercelUrl = process.env.VERCEL_DATABASE_URL || process.env.TARGET_DATABASE_URL;
    
    if (!supabaseUrl || !vercelUrl) {
      throw new Error('Both DATABASE_URL and VERCEL_DATABASE_URL environment variables are required');
    }

    console.log('🔌 Connecting to databases...');
    this.sourceDb = await this.dbManager.connectSource(supabaseUrl);
    this.targetDb = await this.dbManager.connectTarget(vercelUrl);
    
    // Initialize validator
    this.validator = new DataValidator(this.sourceDb, this.targetDb);
  }

  async performBasicChecks() {
    console.log('\n🔍 Performing basic migration checks...\n');
    
    // Test connections
    const connectionsOk = await this.dbManager.testConnections();
    if (!connectionsOk) {
      throw new Error('Database connection test failed');
    }
    
    // Get table counts from both databases
    console.log('📊 Checking table counts...');
    const sourceCounts = await this.dbManager.getTableCounts(this.sourceDb);
    const targetCounts = await this.dbManager.getTableCounts(this.targetDb);
    
    console.log('\n📋 Table Count Comparison:');
    console.log('Table\t\t\tSource\tTarget\tMatch');
    console.log('─'.repeat(50));
    
    let allCountsMatch = true;
    for (const table of Object.keys(sourceCounts)) {
      const sourceCount = sourceCounts[table];
      const targetCount = targetCounts[table] || 0;
      const match = sourceCount === targetCount;
      
      if (!match) allCountsMatch = false;
      
      const status = match ? '✅' : '❌';
      console.log(`${table.padEnd(20)}\t${sourceCount}\t${targetCount}\t${status}`);
    }
    
    return { sourceCounts, targetCounts, allCountsMatch };
  }

  async performDeepValidation() {
    console.log('\n🔍 Performing deep data validation...\n');
    
    const validationResult = await this.validator.validateAll();
    return validationResult;
  }

  async testApplicationQueries() {
    console.log('\n🧪 Testing application-specific queries...\n');
    
    const testQueries = [
      {
        name: 'User authentication lookup',
        test: async (db) => {
          const users = await db.user.findMany({ take: 1 });
          if (users.length > 0) {
            const user = await db.user.findUnique({
              where: { email: users[0].email }
            });
            return !!user;
          }
          return true;
        }
      },
      {
        name: 'Family members with relationships',
        test: async (db) => {
          const members = await db.familyMember.findMany({
            include: {
              user: true,
              family: true
            },
            take: 5
          });
          return members.every(m => m.user && m.family);
        }
      },
      {
        name: 'Tasks with all relationships',
        test: async (db) => {
          const tasks = await db.task.findMany({
            include: {
              creator: true,
              assignee: true,
              family: true,
              tags: {
                include: {
                  tag: true
                }
              }
            },
            take: 5
          });
          return tasks.every(t => t.creator && t.assignee && t.family);
        }
      },
      {
        name: 'Points history aggregation',
        test: async (db) => {
          const pointsHistory = await db.pointsHistory.findMany({
            include: {
              user: true,
              family: true
            },
            take: 5
          });
          return pointsHistory.every(p => p.user && p.family);
        }
      },
      {
        name: 'Weekly tasks query (performance critical)',
        test: async (db) => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const tasks = await db.task.findMany({
            where: {
              createdAt: {
                gte: oneWeekAgo
              }
            },
            include: {
              creator: true,
              assignee: true
            },
            take: 10
          });
          return Array.isArray(tasks);
        }
      }
    ];
    
    const results = {};
    
    for (const query of testQueries) {
      try {
        console.log(`🔍 Testing: ${query.name}`);
        
        const sourceResult = await query.test(this.sourceDb);
        const targetResult = await query.test(this.targetDb);
        
        const success = sourceResult === targetResult;
        results[query.name] = {
          sourceResult,
          targetResult,
          success
        };
        
        console.log(`${success ? '✅' : '❌'} ${query.name}: ${success ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        console.log(`❌ ${query.name}: ERROR - ${error.message}`);
        results[query.name] = {
          error: error.message,
          success: false
        };
      }
    }
    
    return results;
  }

  async testPerformance() {
    console.log('\n⚡ Testing database performance...\n');
    
    const performanceTests = [
      {
        name: 'Points history query (main issue)',
        query: async (db) => {
          const start = Date.now();
          const points = await db.pointsHistory.findMany({
            include: {
              user: true,
              family: true
            },
            take: 100
          });
          const duration = Date.now() - start;
          return { count: points.length, duration };
        }
      },
      {
        name: 'User dashboard query',
        query: async (db) => {
          const start = Date.now();
          const users = await db.user.findMany({
            include: {
              assignedTasks: {
                include: {
                  family: true
                }
              }
            },
            take: 10
          });
          const duration = Date.now() - start;
          return { count: users.length, duration };
        }
      },
      {
        name: 'Family tasks query',
        query: async (db) => {
          const start = Date.now();
          const tasks = await db.task.findMany({
            include: {
              creator: true,
              assignee: true,
              tags: {
                include: {
                  tag: true
                }
              }
            },
            take: 50
          });
          const duration = Date.now() - start;
          return { count: tasks.length, duration };
        }
      }
    ];
    
    const results = {};
    
    for (const test of performanceTests) {
      try {
        console.log(`⚡ Testing: ${test.name}`);
        
        const sourceResult = await test.query(this.sourceDb);
        const targetResult = await test.query(this.targetDb);
        
        const improvement = sourceResult.duration - targetResult.duration;
        const improvementPercent = ((improvement / sourceResult.duration) * 100).toFixed(1);
        
        results[test.name] = {
          source: sourceResult,
          target: targetResult,
          improvement,
          improvementPercent
        };
        
        console.log(`📊 ${test.name}:`);
        console.log(`   Source: ${sourceResult.duration}ms (${sourceResult.count} records)`);
        console.log(`   Target: ${targetResult.duration}ms (${targetResult.count} records)`);
        console.log(`   Improvement: ${improvement}ms (${improvementPercent}%)`);
        
      } catch (error) {
        console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        results[test.name] = { error: error.message };
      }
    }
    
    return results;
  }

  async generateReport(basicChecks, deepValidation, queryTests, performanceTests) {
    const report = {
      timestamp: new Date().toISOString(),
      migration: {
        source: 'Supabase (US West)',
        target: 'Vercel Postgres',
        status: deepValidation ? 'SUCCESS' : 'FAILED'
      },
      basicChecks,
      deepValidation: this.validator.getReport(),
      queryTests,
      performanceTests,
      summary: {
        allTestsPassed: deepValidation && Object.values(queryTests).every(t => t.success),
        tablesMatched: basicChecks.allCountsMatch,
        performanceImproved: Object.values(performanceTests).some(t => t.improvement > 0)
      }
    };
    
    // Save report
    await fs.writeFile(this.reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 MIGRATION VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🔄 Migration: ${report.migration.source} → ${report.migration.target}`);
    console.log(`📊 Status: ${report.migration.status === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    console.log('\n📋 Results:');
    console.log(`   Table Counts: ${report.summary.tablesMatched ? '✅' : '❌'} ${report.summary.tablesMatched ? 'All match' : 'Mismatches found'}`);
    console.log(`   Data Integrity: ${report.deepValidation.success ? '✅' : '❌'} ${report.deepValidation.success ? 'All checks passed' : `${report.deepValidation.errors.length} errors`}`);
    console.log(`   Query Tests: ${report.summary.allTestsPassed ? '✅' : '❌'} ${report.summary.allTestsPassed ? 'All passed' : 'Some failed'}`);
    console.log(`   Performance: ${report.summary.performanceImproved ? '✅' : '❓'} ${report.summary.performanceImproved ? 'Improved' : 'Needs verification'}`);
    
    console.log(`\n📁 Full report: ${this.reportPath}`);
    console.log('='.repeat(60));
  }

  async cleanup() {
    await this.dbManager.disconnect();
  }
}

// Main execution
async function main() {
  const validator = new MigrationValidator();
  
  try {
    await validator.initialize();
    
    const basicChecks = await validator.performBasicChecks();
    const deepValidation = await validator.performDeepValidation();
    const queryTests = await validator.testApplicationQueries();
    const performanceTests = await validator.testPerformance();
    
    const report = await validator.generateReport(basicChecks, deepValidation, queryTests, performanceTests);
    await validator.printSummary(report);
    
    process.exit(report.migration.status === 'SUCCESS' ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  } finally {
    await validator.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationValidator };