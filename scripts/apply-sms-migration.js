#!/usr/bin/env node

/**
 * Production SMS Migration Script
 * 
 * This script applies the SMS notification database schema changes to production.
 * It adds phoneNumber and smsNotificationsEnabled fields to the users table.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function log(message) {
  console.log(`📧 SMS Migration: ${message}`);
}

async function error(message) {
  console.error(`❌ SMS Migration Error: ${message}`);
  process.exit(1);
}

async function applySmsMigration() {
  // Check for production database URL
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    error('No database URL found. Set POSTGRES_URL or DATABASE_URL environment variable.');
  }

  if (databaseUrl.includes('localhost')) {
    error('This script should only be run against production database, not localhost!');
  }

  await log('Connecting to production database...');
  
  const client = new Client({
    connectionString: databaseUrl
  });

  try {
    await client.connect();
    await log('Connected to database successfully');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone_number', 'sms_notifications_enabled')
    `;
    
    const existingColumns = await client.query(checkQuery);
    
    if (existingColumns.rows.length > 0) {
      await log('SMS notification columns already exist. Skipping migration.');
      return;
    }

    await log('Applying SMS notification schema changes...');

    // Start transaction
    await client.query('BEGIN');

    // Add phone_number column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN phone_number VARCHAR
    `);
    
    await log('Added phone_number column');

    // Add sms_notifications_enabled column with default false
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT false NOT NULL
    `);
    
    await log('Added sms_notifications_enabled column');

    // Commit transaction
    await client.query('COMMIT');
    
    await log('✅ SMS notification migration completed successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    error(`Migration failed: ${err.message}`);
  } finally {
    await client.end();
  }
}

// Run migration
applySmsMigration().catch(console.error);