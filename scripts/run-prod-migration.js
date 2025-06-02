#!/usr/bin/env node

/**
 * Production Migration via Vercel
 */

const { execSync } = require('child_process');

function log(message) {
  console.log(`🚀 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function runMigration() {
  try {
    log('Applying SMS schema changes to production...');
    
    // Use Vercel's built-in edge function to run the migration
    const migrationCode = `
const { sql } = require('@vercel/postgres');

export default async function handler(request, response) {
  try {
    // Add SMS notification fields to users table
    await sql\`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR\`;
    await sql\`ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false\`;
    
    // Update existing records to have default false for sms_notifications_enabled
    await sql\`UPDATE users SET sms_notifications_enabled = false WHERE sms_notifications_enabled IS NULL\`;
    
    // Make sms_notifications_enabled NOT NULL after setting defaults
    await sql\`ALTER TABLE users ALTER COLUMN sms_notifications_enabled SET NOT NULL\`;
    
    return response.status(200).json({ 
      success: true, 
      message: 'SMS schema migration completed successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return response.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
    `;
    
    // Create a temporary API endpoint for the migration
    const migrationFile = 'src/app/api/admin/migrate-sms/route.ts';
    require('fs').writeFileSync(migrationFile, `
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Add SMS notification fields to users table
    await sql\`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR\`;
    await sql\`ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false\`;
    
    // Update existing records to have default false for sms_notifications_enabled
    await sql\`UPDATE users SET sms_notifications_enabled = false WHERE sms_notifications_enabled IS NULL\`;
    
    // Make sms_notifications_enabled NOT NULL after setting defaults
    await sql\`ALTER TABLE users ALTER COLUMN sms_notifications_enabled SET NOT NULL\`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'SMS schema migration completed successfully' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
    `);
    
    log('Created temporary migration endpoint');
    
    // Deploy to Vercel
    log('Deploying migration endpoint...');
    execSync('git add .');
    execSync('git commit -m "Add temporary SMS migration endpoint"');
    execSync('git push origin main');
    
    log('Waiting for deployment...');
    // Wait a bit for deployment
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Run the migration
    log('Running migration...');
    const result = execSync('curl -X POST https://family-tasks-beta.vercel.app/api/admin/migrate-sms', { encoding: 'utf8' });
    console.log('Migration result:', result);
    
    // Clean up - remove the migration endpoint
    require('fs').unlinkSync(migrationFile);
    execSync('git add .');
    execSync('git commit -m "Remove temporary migration endpoint"');
    execSync('git push origin main');
    
    log('✅ Migration completed and cleaned up');
    
  } catch (err) {
    error(`Migration failed: ${err.message}`);
  }
}

runMigration().catch(console.error);
    