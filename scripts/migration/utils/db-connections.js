const { PrismaClient } = require('@prisma/client');

class DatabaseManager {
  constructor() {
    this.sourceDb = null;
    this.targetDb = null;
  }

  // Connect to source database (Supabase)
  async connectSource(databaseUrl) {
    try {
      this.sourceDb = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
      await this.sourceDb.$connect();
      console.log('✅ Connected to source database (Supabase)');
      return this.sourceDb;
    } catch (error) {
      console.error('❌ Failed to connect to source database:', error);
      throw error;
    }
  }

  // Connect to target database (Vercel Postgres)
  async connectTarget(databaseUrl) {
    try {
      this.targetDb = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl
          }
        }
      });
      await this.targetDb.$connect();
      console.log('✅ Connected to target database (Vercel Postgres)');
      return this.targetDb;
    } catch (error) {
      console.error('❌ Failed to connect to target database:', error);
      throw error;
    }
  }

  // Test database connections
  async testConnections() {
    try {
      if (this.sourceDb) {
        await this.sourceDb.$queryRaw`SELECT 1 as test`;
        console.log('✅ Source database connection test passed');
      }
      
      if (this.targetDb) {
        await this.targetDb.$queryRaw`SELECT 1 as test`;
        console.log('✅ Target database connection test passed');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  // Get table counts for validation
  async getTableCounts(db) {
    try {
      const tables = [
        'users', 'families', 'family_members', 'tasks', 
        'task_tags', 'task_tag_relations', 'points_history', 'notifications'
      ];
      
      const counts = {};
      for (const table of tables) {
        const result = await db.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result[0].count);
      }
      
      return counts;
    } catch (error) {
      console.error('❌ Failed to get table counts:', error);
      throw error;
    }
  }

  // Close connections
  async disconnect() {
    try {
      if (this.sourceDb) {
        await this.sourceDb.$disconnect();
        console.log('✅ Disconnected from source database');
      }
      
      if (this.targetDb) {
        await this.targetDb.$disconnect();
        console.log('✅ Disconnected from target database');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from databases:', error);
    }
  }
}

module.exports = { DatabaseManager };