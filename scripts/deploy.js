#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Deployment script that:
 * 1. Increments the patch version in package.json
 * 2. Commits the version bump
 * 3. Pushes to main branch
 * 4. Triggers Vercel deployment
 * 5. Verifies the new version is deployed
 */

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

function generateReleaseNotes(version) {
  log(`Skipping automatic release notes generation for version ${version}...`);
  log(`Release notes should be manually updated in RELEASE-NOTES.md`);
  return;
}

async function verifyDeployment(expectedVersion, maxRetries = 10) {
  log(`Verifying deployment with version ${expectedVersion}...`);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = execCommand(
        'curl -s "https://family-tasks-beta.vercel.app/api/health"',
        `Checking deployment (attempt ${i + 1}/${maxRetries})`
      );
      
      const healthData = JSON.parse(response);
      
      if (healthData.version === expectedVersion) {
        log(`✅ Deployment verified! Version ${expectedVersion} is live.`);
        return true;
      } else {
        log(`⏳ Current deployed version: ${healthData.version}, waiting for ${expectedVersion}...`);
      }
    } catch (err) {
      log(`⏳ Health check failed, retrying in 10 seconds...`);
    }
    
    // Wait 10 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  error(`Deployment verification failed after ${maxRetries} attempts`);
}

async function main() {
  try {
    log('Starting deployment process...');
    
    // Check if we're on the correct branch
    const currentBranch = execCommand('git branch --show-current', 'Checking current branch');
    if (currentBranch !== 'main') {
      error('Deployment must be run from the main branch');
    }
    
    // Check if working directory is clean
    try {
      execCommand('git diff --exit-code', 'Checking for uncommitted changes');
      execCommand('git diff --cached --exit-code', 'Checking for staged changes');
    } catch {
      error('Working directory must be clean before deployment');
    }
    
    // Pull latest changes
    execCommand('git pull origin main', 'Pulling latest changes from main');
    
    // Increment version
    const newVersion = incrementVersion();
    
    // Generate release notes
    const releaseNotesGenerated = generateReleaseNotes(newVersion);
    
    // Commit version bump and release notes
    const filesToAdd = ['package.json'];
    if (releaseNotesGenerated) {
      filesToAdd.push('RELEASE-NOTES.md');
    }
    
    execCommand(`git add ${filesToAdd.join(' ')}`, 'Staging files for commit');
    execCommand(
      `git commit -m "chore: bump version to ${newVersion}${releaseNotesGenerated ? ' and update release notes' : ''}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"`,
      'Committing version bump and release notes'
    );
    
    // Push to main (triggers Vercel deployment)
    execCommand('git push origin main', 'Pushing to main branch');
    
    // Wait and verify deployment
    await verifyDeployment(newVersion);
    
    log(`🎉 Deployment complete! Version ${newVersion} is now live.`);
    log('🔗 https://family-tasks-beta.vercel.app');
    
  } catch (err) {
    error(`Deployment failed: ${err.message}`);
  }
}

main();