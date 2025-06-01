class DataValidator {
  constructor(sourceDb, targetDb) {
    this.sourceDb = sourceDb;
    this.targetDb = targetDb;
    this.errors = [];
  }

  // Compare table counts between source and target
  async validateTableCounts() {
    console.log('📊 Validating table counts...');
    
    const tables = [
      'users', 'families', 'family_members', 'tasks', 
      'task_tags', 'task_tag_relations', 'points_history', 'notifications'
    ];
    
    const results = {};
    
    for (const table of tables) {
      try {
        const sourceCount = await this.sourceDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        const targetCount = await this.targetDb.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        
        const source = parseInt(sourceCount[0].count);
        const target = parseInt(targetCount[0].count);
        
        results[table] = { source, target, match: source === target };
        
        if (source !== target) {
          this.errors.push(`❌ ${table}: Source(${source}) != Target(${target})`);
        } else {
          console.log(`✅ ${table}: ${source} records`);
        }
      } catch (error) {
        this.errors.push(`❌ Error validating ${table}: ${error.message}`);
      }
    }
    
    return results;
  }

  // Validate foreign key relationships
  async validateRelationships() {
    console.log('🔗 Validating relationships...');
    
    const checks = [
      {
        name: 'Family Members → Users',
        query: `SELECT COUNT(*) as count FROM family_members fm 
                LEFT JOIN users u ON fm.user_id = u.id 
                WHERE u.id IS NULL`
      },
      {
        name: 'Family Members → Families', 
        query: `SELECT COUNT(*) as count FROM family_members fm 
                LEFT JOIN families f ON fm.family_id = f.id 
                WHERE f.id IS NULL`
      },
      {
        name: 'Tasks → Users (creator)',
        query: `SELECT COUNT(*) as count FROM tasks t 
                LEFT JOIN users u ON t.created_by = u.id 
                WHERE u.id IS NULL`
      },
      {
        name: 'Tasks → Users (assignee)',
        query: `SELECT COUNT(*) as count FROM tasks t 
                LEFT JOIN users u ON t.assigned_to = u.id 
                WHERE u.id IS NULL`
      },
      {
        name: 'Tasks → Families',
        query: `SELECT COUNT(*) as count FROM tasks t 
                LEFT JOIN families f ON t.family_id = f.id 
                WHERE f.id IS NULL`
      },
      {
        name: 'Points History → Users',
        query: `SELECT COUNT(*) as count FROM points_history ph 
                LEFT JOIN users u ON ph.user_id = u.id 
                WHERE u.id IS NULL`
      },
      {
        name: 'Points History → Families',
        query: `SELECT COUNT(*) as count FROM points_history ph 
                LEFT JOIN families f ON ph.family_id = f.id 
                WHERE f.id IS NULL`
      }
    ];
    
    for (const check of checks) {
      try {
        const sourceResult = await this.sourceDb.$queryRawUnsafe(check.query);
        const targetResult = await this.targetDb.$queryRawUnsafe(check.query);
        
        const sourceOrphans = parseInt(sourceResult[0].count);
        const targetOrphans = parseInt(targetResult[0].count);
        
        if (sourceOrphans === 0 && targetOrphans === 0) {
          console.log(`✅ ${check.name}: No orphaned records`);
        } else if (sourceOrphans === targetOrphans) {
          console.log(`⚠️ ${check.name}: ${sourceOrphans} orphaned records (consistent)`);
        } else {
          this.errors.push(`❌ ${check.name}: Source(${sourceOrphans}) != Target(${targetOrphans}) orphaned records`);
        }
      } catch (error) {
        this.errors.push(`❌ Error validating ${check.name}: ${error.message}`);
      }
    }
  }

  // Validate unique constraints
  async validateUniqueConstraints() {
    console.log('🔑 Validating unique constraints...');
    
    const checks = [
      {
        name: 'User emails',
        query: `SELECT email, COUNT(*) as count FROM users 
                GROUP BY email HAVING COUNT(*) > 1`
      },
      {
        name: 'Family codes',
        query: `SELECT family_code, COUNT(*) as count FROM families 
                GROUP BY family_code HAVING COUNT(*) > 1`
      },
      {
        name: 'Family memberships',
        query: `SELECT family_id, user_id, COUNT(*) as count FROM family_members 
                GROUP BY family_id, user_id HAVING COUNT(*) > 1`
      },
      {
        name: 'Task tags per family',
        query: `SELECT name, family_id, COUNT(*) as count FROM task_tags 
                GROUP BY name, family_id HAVING COUNT(*) > 1`
      }
    ];
    
    for (const check of checks) {
      try {
        const sourceResult = await this.sourceDb.$queryRawUnsafe(check.query);
        const targetResult = await this.targetDb.$queryRawUnsafe(check.query);
        
        if (sourceResult.length === 0 && targetResult.length === 0) {
          console.log(`✅ ${check.name}: No duplicates`);
        } else if (sourceResult.length === targetResult.length) {
          console.log(`⚠️ ${check.name}: ${sourceResult.length} duplicates (consistent)`);
        } else {
          this.errors.push(`❌ ${check.name}: Source(${sourceResult.length}) != Target(${targetResult.length}) duplicates`);
        }
      } catch (error) {
        this.errors.push(`❌ Error validating ${check.name}: ${error.message}`);
      }
    }
  }

  // Validate sample data integrity
  async validateSampleData() {
    console.log('🔍 Validating sample data...');
    
    try {
      // Get a few sample records from source
      const sourceUsers = await this.sourceDb.user.findMany({ take: 5 });
      
      for (const user of sourceUsers) {
        const targetUser = await this.targetDb.user.findUnique({
          where: { id: user.id }
        });
        
        if (!targetUser) {
          this.errors.push(`❌ User ${user.id} missing in target database`);
          continue;
        }
        
        // Check key fields
        const fieldsToCheck = ['email', 'name', 'role', 'createdAt'];
        for (const field of fieldsToCheck) {
          if (user[field] !== targetUser[field]) {
            this.errors.push(`❌ User ${user.id} field '${field}' mismatch: '${user[field]}' != '${targetUser[field]}'`);
          }
        }
      }
      
      console.log(`✅ Sample data validation completed`);
    } catch (error) {
      this.errors.push(`❌ Error validating sample data: ${error.message}`);
    }
  }

  // Run all validations
  async validateAll() {
    console.log('\n🔍 Starting comprehensive data validation...\n');
    
    await this.validateTableCounts();
    await this.validateRelationships();
    await this.validateUniqueConstraints();
    await this.validateSampleData();
    
    console.log('\n📋 Validation Summary:');
    if (this.errors.length === 0) {
      console.log('✅ All validations passed! Data migration successful.');
      return true;
    } else {
      console.log(`❌ ${this.errors.length} validation errors found:`);
      this.errors.forEach(error => console.log(error));
      return false;
    }
  }

  // Get validation report
  getReport() {
    return {
      success: this.errors.length === 0,
      errors: this.errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { DataValidator };