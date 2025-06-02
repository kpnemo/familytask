# Feature Development Guide

## 🎯 Overview
This guide outlines the standard workflow for developing new features and fixes in the FamilyTasks project.

## 🔄 Development Workflow

### 1. Create Feature Branch
```bash
# Create and switch to new feature branch
git checkout -b feature/[feature-name]
# or
git checkout -b fix/[issue-description]

# Examples:
git checkout -b feature/task-reminders
git checkout -b fix/dashboard-task-links
```

### 2. Execute Development
- **Implement the feature/fix**
- **Follow existing code patterns and conventions**
- **Write clean, maintainable code**
- **Use TypeScript properly**
- **Follow component structure patterns**

### 3. Test Implementation
```bash
# Run development server
npm run dev

# Run tests (if available)
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### 4. Manual Verification Request
**Before committing:**
- Test the feature thoroughly locally
- Document the changes made
- **Ask project owner for manual verification**
- Provide testing instructions
- Share screenshots/videos if UI changes

### 5. Commit Changes
```bash
# Stage relevant files
git add [files]

# Create descriptive commit message
git commit -m "Add [feature description]

- Implement [specific change 1]
- Fix [specific change 2]
- Update [specific change 3]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 6. Merge to Main
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/[feature-name]

# Delete feature branch
git branch -d feature/[feature-name]
```

### 7. Push to Repository
```bash
# Push to GitHub
git push origin main
```

### 8. Deploy to Production

⚠️ **CRITICAL: Database Schema Changes**

**If your changes include database schema modifications (Prisma schema changes):**

1. **ALWAYS backup production data first:**
```bash
# Switch to production database
./scripts/switch-to-prod.sh

# Create backup of current production data
npx prisma studio  # Verify current data exists
# OR use Neon Console to create manual backup

# Document what data exists before migration
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function backup() {
  const users = await prisma.user.count();
  const tasks = await prisma.task.count();
  const families = await prisma.family.count();
  console.log(\`📊 Pre-migration data: \${users} users, \${tasks} tasks, \${families} families\`);
  console.log(\`⏰ Backup taken at: \${new Date().toISOString()}\`);
  await prisma.\$disconnect();
}
backup();"
```

2. **Apply migration safely:**
```bash
# Apply schema changes (do NOT use migrate reset or drop database)
npx prisma db push --accept-data-loss

# Verify data is still intact after migration
node -e "/* same script as above to verify data */"
```

3. **If data is lost - restore from backup:**
   - Use Neon Console Point-in-time Recovery
   - Restore to time before migration
   - Re-apply schema migration correctly

**For regular deployments (no schema changes):**
```bash
# Automated deployment with version bump
npm run deploy
```

**The deployment script automatically:**
- ✅ Increments the patch version (e.g., 1.0.0 → 1.0.1)
- ✅ Commits the version bump
- ✅ Pushes to main branch (triggers Vercel deployment)
- ✅ Verifies the new version is deployed
- ✅ Reports deployment success with live URL

**Prerequisites:**
- Must be on `main` branch
- Working directory must be clean (no uncommitted changes)
- Must have latest changes pulled from remote
- **Production data backed up if schema changes**

**Manual verification:**
```bash
# Check deployed version
curl -s https://family-tasks-beta.vercel.app/api/health | jq .version
```

## 📋 Commit Message Guidelines

### Format:
```
[Action] [brief description]

- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Action Verbs:
- **Add**: New feature or functionality
- **Fix**: Bug fixes or corrections
- **Update**: Improvements to existing features
- **Refactor**: Code restructuring without functionality changes
- **Remove**: Deletion of features or code
- **Migrate**: Database or architecture changes

### Examples:
```bash
# Good commit messages:
git commit -m "Add task reminder notifications

- Implement email reminder service
- Add reminder settings to user preferences
- Create reminder scheduling background job

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git commit -m "Fix dashboard task links routing

- Update task links to route to individual task view
- Fix Next 7 days section navigation
- Preserve task context in URL parameters

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 🧪 Testing Checklist

### Before Manual Verification Request:
- [ ] Feature works as expected locally
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] All existing functionality still works
- [ ] Performance is acceptable
- [ ] Database queries are optimized

### Manual Testing Areas:
- [ ] User authentication flow
- [ ] Task creation/editing/deletion
- [ ] Family member management
- [ ] Points system functionality
- [ ] Notification system
- [ ] Mobile responsiveness

## 🚨 Emergency Hotfix Process

For critical production issues:

```bash
# Create hotfix branch from main
git checkout -b hotfix/[critical-issue]

# Implement fix
# Test thoroughly

# Commit and deploy immediately
git commit -m "Hotfix: [critical issue description]"
git checkout main
git merge hotfix/[critical-issue]
git push origin main
vercel --prod

# Clean up
git branch -d hotfix/[critical-issue]
```

## 🔒 Security Considerations

### Always Check:
- [ ] No sensitive data in commits
- [ ] Environment variables properly configured
- [ ] Database queries use parameterized statements
- [ ] User input is validated and sanitized
- [ ] Authentication is properly implemented

## 📁 File Organization

### New Features:
```
src/
├── components/
│   └── features/           # Feature-specific components
│       └── [feature-name]/ # Group related components
├── app/
│   └── [feature]/          # New pages/routes
└── lib/                    # Shared utilities
```

### Examples:
```
src/components/features/reminders/
├── reminder-settings.tsx
├── reminder-list.tsx
└── reminder-form.tsx

src/app/reminders/
├── page.tsx
└── settings/
    └── page.tsx
```

## 🎨 Code Style Guidelines

### React Components:
- Use TypeScript with proper typing
- Follow existing naming conventions
- Use functional components with hooks
- Implement proper error handling
- Add loading states for async operations

### Database Operations:
- Use Prisma client consistently
- Implement proper error handling
- Use transactions for related operations
- Optimize queries for performance

## 📝 Documentation Requirements

### For Each Feature:
- Update this guide if workflow changes
- Document API endpoints if added
- Update README if significant changes
- Add inline comments for complex logic

## 🎯 Quality Standards

### Before Requesting Verification:
- Code follows existing patterns
- TypeScript types are properly defined
- Error handling is implemented
- Loading states are included
- Mobile experience is tested
- Performance impact is considered

---

**Last Updated:** $(date)  
**Version:** 1.0  
**Maintainer:** FamilyTasks Development Team