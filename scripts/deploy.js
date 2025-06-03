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
  log(`Generating release notes for version ${version}...`);
  
  try {
    // Get commit messages since last tag/version
    const commits = execCommand(
      'git log --oneline --pretty=format:"%s" HEAD --not $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")',
      'Getting commit messages since last release'
    );
    
    if (!commits.trim()) {
      log('No new commits found, skipping release notes update');
      return;
    }
    
    const commitLines = commits.split('\n').filter(line => line.trim());
    
    // Categorize commits
    const features = [];
    const improvements = [];
    const bugFixes = [];
    const other = [];
    
    commitLines.forEach(commit => {
      const lowerCommit = commit.toLowerCase();
      if (lowerCommit.includes('feat:') || lowerCommit.includes('add ') || lowerCommit.includes('new ')) {
        features.push(commit.replace(/^(feat:|add |new )/i, '').trim());
      } else if (lowerCommit.includes('fix:') || lowerCommit.includes('bug') || lowerCommit.includes('error')) {
        bugFixes.push(commit.replace(/^fix:/i, '').trim());
      } else if (lowerCommit.includes('improve') || lowerCommit.includes('enhance') || lowerCommit.includes('update')) {
        improvements.push(commit.replace(/^(improve|enhance|update):/i, '').trim());
      } else if (!lowerCommit.includes('chore:') && !lowerCommit.includes('bump version')) {
        other.push(commit.trim());
      }
    });
    
    // Generate new release notes entry
    const today = new Date().toISOString().split('T')[0];
    let newEntry = `## [${version}] - ${today}\n\n`;
    
    if (features.length > 0) {
      newEntry += `### ✨ New Features\n`;
      features.forEach(feature => {
        newEntry += `- ${feature}\n`;
      });
      newEntry += '\n';
    }
    
    if (improvements.length > 0) {
      newEntry += `### 🔧 Improvements\n`;
      improvements.forEach(improvement => {
        newEntry += `- ${improvement}\n`;
      });
      newEntry += '\n';
    }
    
    if (bugFixes.length > 0) {
      newEntry += `### 🐛 Bug Fixes\n`;
      bugFixes.forEach(fix => {
        newEntry += `- ${fix}\n`;
      });
      newEntry += '\n';
    }
    
    if (other.length > 0) {
      newEntry += `### 🔄 Other Changes\n`;
      other.forEach(change => {
        newEntry += `- ${change}\n`;
      });
      newEntry += '\n';
    }
    
    // Read existing release notes
    const releaseNotesPath = path.join(__dirname, '..', 'RELEASE-NOTES.md');
    let existingContent = '';
    
    if (fs.existsSync(releaseNotesPath)) {
      existingContent = fs.readFileSync(releaseNotesPath, 'utf8');
      
      // Find where to insert new entry (after the title)
      const lines = existingContent.split('\n');
      const titleIndex = lines.findIndex(line => line.startsWith('# '));
      
      if (titleIndex >= 0) {
        // Insert after title and empty line
        lines.splice(titleIndex + 2, 0, newEntry);
        existingContent = lines.join('\n');
      } else {
        // No title found, prepend
        existingContent = newEntry + existingContent;
      }
    } else {
      // Create new file
      existingContent = `# FamilyTasks Release Notes\n\n${newEntry}`;
    }
    
    fs.writeFileSync(releaseNotesPath, existingContent);
    log(`Release notes updated for version ${version}`);
    
    return true;
  } catch (err) {
    log(`Warning: Could not generate release notes: ${err.message}`);
    return false;
  }
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