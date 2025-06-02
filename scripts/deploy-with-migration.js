#!/usr/bin/env node

/**
 * Production Deployment Script with Database Migration
 * 
 * This script:
 * 1. Merges feature branch to main
 * 2. Deploys to production
 * 3. Provides migration SQL for manual application
 * 
 * IMPORTANT: The database migration must be applied manually to production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`🚀 ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function execCommand(command, description) {
  try {
    log(description);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return result.trim();
  } catch (err) {
    error(`Failed to ${description.toLowerCase()}: ${err.message}`);
  }
}

function incrementVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const currentVersion = packageJson.version;
  const versionParts = currentVersion.split('.');
  const patchVersion = parseInt(versionParts[2]) + 1;
  const newVersion = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;
  
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  log(`Version bumped from ${currentVersion} to ${newVersion}`);
  return newVersion;
}

async function main() {
  try {
    log('🎯 Starting deployment with database migration...');
    
    // Check current branch
    const currentBranch = execCommand('git branch --show-current', 'Checking current branch');
    log(`Current branch: ${currentBranch}`);
    
    // Commit any uncommitted changes
    try {
      execCommand('git add .', 'Staging all changes');
      execCommand('git diff --cached --quiet', 'Checking for staged changes');
      log('No new changes to commit');
    } catch {
      log('Committing final changes...');
      execCommand(
        `git commit -m "chore: final cleanup before deployment"`, 
        'Committing final changes'
      );
    }
    
    // Switch to main and merge feature branch
    execCommand('git checkout main', 'Switching to main branch');
    execCommand('git pull origin main', 'Pulling latest main');
    execCommand(`git merge ${currentBranch}`, `Merging ${currentBranch} into main`);
    
    // Increment version
    const newVersion = incrementVersion();
    
    // Commit version bump
    execCommand('git add package.json', 'Staging package.json');
    execCommand(
      `git commit -m "chore: bump version to ${newVersion} - bonus tasks feature

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`,
      'Committing version bump'
    );
    
    // Push to main (triggers Vercel deployment)
    execCommand('git push origin main', 'Pushing to main branch');
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, 'migrate-bonus-task-features.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    log('🎉 Code deployment initiated!');
    log('');
    log('🚨 IMPORTANT: DATABASE MIGRATION REQUIRED');
    log('');
    log('Before the application will work properly, you MUST apply this SQL to production:');
    log('═'.repeat(80));
    console.log(migrationSQL);
    log('═'.repeat(80));
    log('');
    log('Steps to complete deployment:');
    log('1. 🔗 Go to your production database console (Neon/Vercel Postgres)');
    log('2. 📋 Copy and run the SQL above');
    log('3. ✅ Verify the migration completed successfully');
    log('4. 🔄 Test the application with bonus task features');
    log('');
    log(`🔗 Production URL: https://family-tasks-beta.vercel.app`);
    log(`📦 Version: ${newVersion}`);
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

main();