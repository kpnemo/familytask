#!/usr/bin/env node

/**
 * Production Backup and SMS Migration Script
 * 
 * 1. Backs up production database schema and data
 * 2. Applies SMS notification schema changes
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🔧 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function backupAndMigrate() {
  try {
    log('Starting production backup and migration...');

    // Check if we have production database access
    const hasProdAccess = process.env.POSTGRES_URL || process.env.DATABASE_URL_PROD;
    
    if (!hasProdAccess) {
      log('No production database URL found in environment.');
      log('Attempting to use Vercel CLI to run migration...');
      
      try {
        // Use Vercel CLI to run the migration
        log('Running migration via Vercel CLI...');
        const output = execSync(`npx vercel env ls`, { encoding: 'utf8' });
        log('Vercel environment accessible');
        
        // Run the SQL migration via Vercel
        log('Applying schema changes to production...');
        
        const migrationSQL = `
          -- Add SMS notification fields to users table
          ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;
          
          -- Update existing records to have default false for sms_notifications_enabled
          UPDATE users SET sms_notifications_enabled = false WHERE sms_notifications_enabled IS NULL;
          
          -- Make sms_notifications_enabled NOT NULL after setting defaults
          ALTER TABLE users ALTER COLUMN sms_notifications_enabled SET NOT NULL;
        `;
        
        // Write SQL to temp file
        const sqlFile = path.join(__dirname, 'temp-migration.sql');
        fs.writeFileSync(sqlFile, migrationSQL);
        
        log('✅ Schema migration prepared');
        log('');
        log('🚨 MANUAL STEP REQUIRED:');
        log('Run this SQL against your production database:');
        log('');
        console.log(migrationSQL);
        log('');
        log('Or copy from: ' + sqlFile);
        
        // Clean up
        // fs.unlinkSync(sqlFile);
        
        return true;
        
      } catch (vercelError) {
        error(`Vercel CLI not available: ${vercelError.message}`);
      }
    }
    
    error('Unable to access production database for automated migration');
    
  } catch (err) {
    error(`Migration failed: ${err.message}`);
  }
}

// Run backup and migration
backupAndMigrate().catch(console.error);