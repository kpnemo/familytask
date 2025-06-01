const fs = require('fs').promises;
const path = require('path');
const { DatabaseManager } = require('./utils/db-connections');

class VercelImporter {
  constructor() {
    this.dbManager = new DatabaseManager();
    this.exportDir = path.join(__dirname, 'exports');
    this.importStats = {};
  }

  async initialize() {
    // Connect to Vercel Postgres
    const vercelUrl = process.env.VERCEL_DATABASE_URL || process.env.TARGET_DATABASE_URL;
    if (!vercelUrl) {
      throw new Error('VERCEL_DATABASE_URL or TARGET_DATABASE_URL environment variable is required');
    }

    this.targetDb = await this.dbManager.connectTarget(vercelUrl);
    
    // Test connection
    const isConnected = await this.dbManager.testConnections();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }
  }

  async loadExportData(tableName) {
    const filepath = path.join(this.exportDir, `${tableName}.json`);
    
    try {
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load export data for ${tableName}: ${error.message}`);
    }
  }

  async clearTargetTable(tableName) {
    console.log(`🗑️  Clearing ${tableName} table...`);
    
    try {
      // Use raw SQL to handle potential foreign key constraints
      await this.targetDb.$queryRawUnsafe(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
      console.log(`✅ Cleared ${tableName}`);
    } catch (error) {
      console.error(`❌ Failed to clear ${tableName}:`, error);
      throw error;
    }
  }

  async importTable(tableName, model, data) {
    console.log(`📥 Importing ${data.length} records to ${tableName}...`);
    
    if (data.length === 0) {
      console.log(`⚠️ No data to import for ${tableName}`);
      return 0;
    }
    
    try {
      // Import in batches to avoid memory issues
      const batchSize = 100;
      let importedCount = 0;
      
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        // Process each record in the batch
        for (const record of batch) {
          try {
            await model.create({
              data: record
            });
            importedCount++;
          } catch (error) {
            console.error(`❌ Failed to import record ${record.id || 'unknown'} to ${tableName}:`, error);
            throw error;
          }
        }
        
        console.log(`📊 Imported ${Math.min(i + batchSize, data.length)}/${data.length} records to ${tableName}`);
      }
      
      console.log(`✅ Successfully imported ${importedCount} records to ${tableName}`);
      return importedCount;
    } catch (error) {
      console.error(`❌ Failed to import ${tableName}:`, error);
      throw error;
    }
  }

  async importAllTables() {
    console.log('\n📦 Starting data import to Vercel Postgres...\n');
    
    // Import in dependency order (same as export)
    const importOrder = [
      { name: 'users', model: this.targetDb.user },
      { name: 'families', model: this.targetDb.family },
      { name: 'family_members', model: this.targetDb.familyMember },
      { name: 'task_tags', model: this.targetDb.taskTag },
      { name: 'tasks', model: this.targetDb.task },
      { name: 'task_tag_relations', model: this.targetDb.taskTagRelation },
      { name: 'points_history', model: this.targetDb.pointsHistory },
      { name: 'notifications', model: this.targetDb.notification }
    ];
    
    // Clear all tables first (in reverse order)
    console.log('🗑️  Clearing target tables...');
    for (let i = importOrder.length - 1; i >= 0; i--) {
      await this.clearTargetTable(importOrder[i].name);
    }
    
    // Import data
    for (const { name, model } of importOrder) {
      const data = await this.loadExportData(name);
      this.importStats[name] = await this.importTable(name, model, data);
    }
    
    // Create import report
    const report = {
      timestamp: new Date().toISOString(),
      target: 'Vercel Postgres',
      tables: this.importStats,
      totalRecords: Object.values(this.importStats).reduce((sum, count) => sum + count, 0)
    };
    
    await fs.writeFile(
      path.join(this.exportDir, 'import-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📊 Import Summary:');
    console.log(`Total tables: ${Object.keys(this.importStats).length}`);
    console.log(`Total records: ${report.totalRecords}`);
    
    return report;
  }

  async validateImport() {
    console.log('\n🔍 Validating import...');
    
    try {
      // Check table counts match export manifest
      const manifestPath = path.join(this.exportDir, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      
      let allValid = true;
      
      for (const [tableName, expectedCount] of Object.entries(manifest.tables)) {
        const actualCount = this.importStats[tableName] || 0;
        
        if (actualCount === expectedCount) {
          console.log(`✅ ${tableName}: ${actualCount} records (matches export)`);
        } else {
          console.log(`❌ ${tableName}: Expected ${expectedCount}, got ${actualCount}`);
          allValid = false;
        }
      }
      
      if (allValid) {
        console.log('✅ Import validation passed');
        return true;
      } else {
        console.log('❌ Import validation failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Import validation error:', error);
      return false;
    }
  }

  async resetSequences() {
    console.log('\n🔄 Resetting database sequences...');
    
    try {
      // Reset sequences for tables with auto-incrementing IDs if any
      // Note: This schema uses cuid() so no sequences to reset
      console.log('✅ No sequences to reset (using cuid())');
    } catch (error) {
      console.error('❌ Error resetting sequences:', error);
      throw error;
    }
  }

  async cleanup() {
    await this.dbManager.disconnect();
  }
}

// Main execution
async function main() {
  const importer = new VercelImporter();
  
  try {
    await importer.initialize();
    const report = await importer.importAllTables();
    const isValid = await importer.validateImport();
    await importer.resetSequences();
    
    if (isValid) {
      console.log('\n🎉 Import completed successfully!');
      console.log(`📁 Import report saved to: ${importer.exportDir}/import-report.json`);
      process.exit(0);
    } else {
      console.log('\n❌ Import validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  } finally {
    await importer.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { VercelImporter };