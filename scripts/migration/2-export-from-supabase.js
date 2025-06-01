const fs = require('fs').promises;
const path = require('path');
const { DatabaseManager } = require('./utils/db-connections');

class SupabaseExporter {
  constructor() {
    this.dbManager = new DatabaseManager();
    this.exportDir = path.join(__dirname, 'exports');
    this.exportData = {};
  }

  async initialize() {
    // Create exports directory
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Connect to Supabase
    const supabaseUrl = process.env.DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for Supabase connection');
    }

    this.sourceDb = await this.dbManager.connectSource(supabaseUrl);
  }

  async exportTable(tableName, model) {
    console.log(`📤 Exporting ${tableName}...`);
    
    try {
      // Different models have different timestamp fields or no timestamps
      let queryOptions = {};
      
      if (tableName === 'family_members') {
        queryOptions.orderBy = { joinedAt: 'asc' };
      } else if (tableName === 'task_tag_relations') {
        // No timestamp field, just export as-is
        queryOptions = {};
      } else {
        // Most tables have createdAt
        queryOptions.orderBy = { createdAt: 'asc' };
      }
      
      const data = await model.findMany(queryOptions);
      
      this.exportData[tableName] = data;
      
      // Save to file as backup
      const filename = path.join(this.exportDir, `${tableName}.json`);
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      
      console.log(`✅ Exported ${data.length} records from ${tableName}`);
      return data.length;
    } catch (error) {
      console.error(`❌ Failed to export ${tableName}:`, error);
      throw error;
    }
  }

  async exportAllTables() {
    console.log('\n📦 Starting data export from Supabase...\n');
    
    const exportStats = {};
    
    // Export in dependency order (parents before children)
    const exportOrder = [
      { name: 'users', model: this.sourceDb.user },
      { name: 'families', model: this.sourceDb.family },
      { name: 'family_members', model: this.sourceDb.familyMember },
      { name: 'task_tags', model: this.sourceDb.taskTag },
      { name: 'tasks', model: this.sourceDb.task },
      { name: 'task_tag_relations', model: this.sourceDb.taskTagRelation },
      { name: 'points_history', model: this.sourceDb.pointsHistory },
      { name: 'notifications', model: this.sourceDb.notification }
    ];
    
    for (const { name, model } of exportOrder) {
      exportStats[name] = await this.exportTable(name, model);
    }
    
    // Create export manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      source: 'Supabase',
      tables: exportStats,
      totalRecords: Object.values(exportStats).reduce((sum, count) => sum + count, 0)
    };
    
    await fs.writeFile(
      path.join(this.exportDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('\n📊 Export Summary:');
    console.log(`Total tables: ${Object.keys(exportStats).length}`);
    console.log(`Total records: ${manifest.totalRecords}`);
    console.log(`Export location: ${this.exportDir}`);
    
    return { exportData: this.exportData, manifest };
  }

  async validateExport() {
    console.log('\n🔍 Validating export...');
    
    try {
      // Check if all files exist
      const expectedFiles = [
        'users.json', 'families.json', 'family_members.json', 'tasks.json',
        'task_tags.json', 'task_tag_relations.json', 'points_history.json',
        'notifications.json', 'manifest.json'
      ];
      
      for (const file of expectedFiles) {
        const filepath = path.join(this.exportDir, file);
        try {
          await fs.access(filepath);
          console.log(`✅ ${file} exists`);
        } catch (error) {
          throw new Error(`❌ Missing export file: ${file}`);
        }
      }
      
      // Validate JSON format
      for (const file of expectedFiles) {
        if (file === 'manifest.json') continue;
        
        const filepath = path.join(this.exportDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        try {
          JSON.parse(content);
          console.log(`✅ ${file} is valid JSON`);
        } catch (error) {
          throw new Error(`❌ Invalid JSON in ${file}: ${error.message}`);
        }
      }
      
      console.log('✅ Export validation passed');
      return true;
    } catch (error) {
      console.error('❌ Export validation failed:', error);
      return false;
    }
  }

  async cleanup() {
    await this.dbManager.disconnect();
  }
}

// Main execution
async function main() {
  const exporter = new SupabaseExporter();
  
  try {
    await exporter.initialize();
    const result = await exporter.exportAllTables();
    const isValid = await exporter.validateExport();
    
    if (isValid) {
      console.log('\n🎉 Export completed successfully!');
      console.log(`📁 Data saved to: ${exporter.exportDir}`);
      process.exit(0);
    } else {
      console.log('\n❌ Export validation failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Export failed:', error);
    process.exit(1);
  } finally {
    await exporter.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SupabaseExporter };