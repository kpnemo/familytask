import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Starting SMS schema migration...');
    
    // Check if columns already exist
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('phone_number', 'sms_notifications_enabled')
    `;
    
    if (checkResult.rows.length > 0) {
      console.log('SMS columns already exist, skipping migration');
      return NextResponse.json({ 
        success: true, 
        message: 'SMS schema already exists, no migration needed' 
      });
    }
    
    // Add SMS notification fields to users table
    console.log('Adding phone_number column...');
    await sql`ALTER TABLE users ADD COLUMN phone_number VARCHAR`;
    
    console.log('Adding sms_notifications_enabled column...');
    await sql`ALTER TABLE users ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT false`;
    
    // Update existing records to have default false for sms_notifications_enabled
    console.log('Setting default values...');
    await sql`UPDATE users SET sms_notifications_enabled = false WHERE sms_notifications_enabled IS NULL`;
    
    // Make sms_notifications_enabled NOT NULL after setting defaults
    console.log('Setting NOT NULL constraint...');
    await sql`ALTER TABLE users ALTER COLUMN sms_notifications_enabled SET NOT NULL`;
    
    console.log('SMS schema migration completed successfully');
    
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