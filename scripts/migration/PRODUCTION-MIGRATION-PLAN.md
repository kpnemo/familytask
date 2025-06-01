# Production Migration Plan: Supabase → Vercel Postgres

## 🎯 Objective
Migrate production database from Supabase (US West) to Vercel Postgres to eliminate timeout issues on `/points` page.

## ⏰ Maintenance Window Planning

### Recommended Window
- **Duration**: 30-45 minutes
- **Best Time**: Low traffic period (2-4 AM user timezone)
- **Day**: Weekday (avoid weekends when families are most active)

### Pre-Migration Checklist (24 hours before)
- [ ] Verify all migration scripts tested on staging
- [ ] Backup current production data
- [ ] Notify users of maintenance window
- [ ] Prepare rollback environment
- [ ] Test Vercel Postgres connectivity
- [ ] Confirm team availability

## 📋 Migration Timeline

### Phase 1: Preparation (15 minutes)
**T-15 to T-0 minutes**

1. **T-15**: Enable maintenance mode
   ```bash
   # Add to .env or deployment
   MAINTENANCE_MODE=true
   ```

2. **T-12**: Final data export from Supabase
   ```bash
   cd scripts/migration
   DATABASE_URL=$SUPABASE_URL node 2-export-from-supabase.js
   ```

3. **T-10**: Verify export completed successfully
   - Check export files in `scripts/migration/exports/`
   - Validate manifest.json record counts

4. **T-5**: Final connectivity test to Vercel Postgres
   ```bash
   VERCEL_DATABASE_URL=$NEW_URL node 1-setup-vercel-postgres.js test
   ```

### Phase 2: Migration (10 minutes)
**T-0 to T+10 minutes**

1. **T+0**: Begin data import
   ```bash
   VERCEL_DATABASE_URL=$NEW_URL node 3-import-to-vercel.js
   ```

2. **T+7**: Run data validation
   ```bash
   DATABASE_URL=$SUPABASE_URL VERCEL_DATABASE_URL=$NEW_URL node 4-validate-migration.js
   ```

3. **T+10**: Update environment variables
   ```bash
   # Update production environment
   DATABASE_URL=$VERCEL_DATABASE_URL
   DIRECT_URL=$VERCEL_DIRECT_URL
   ```

### Phase 3: Cutover (10 minutes)
**T+10 to T+20 minutes**

1. **T+10**: Deploy with new database URLs
   ```bash
   vercel --prod
   ```

2. **T+15**: Health checks
   - Test `/api/health` endpoint
   - Test `/api/user/points` (the problematic endpoint)
   - Test user login/authentication

3. **T+18**: Performance validation
   - Load `/points` page (should be <500ms)
   - Check application logs for errors

### Phase 4: Verification (10 minutes)
**T+20 to T+30 minutes**

1. **T+20**: End-to-end testing
   - User registration/login
   - Task creation/completion
   - Points system functionality
   - Family management

2. **T+25**: Monitoring setup
   - Enable production monitoring
   - Set up alerts for database performance
   - Monitor error rates

3. **T+30**: Go-live decision
   - ✅ All tests pass → Remove maintenance mode
   - ❌ Issues found → Execute rollback

## 🚨 Emergency Procedures

### Rollback Triggers
Execute immediate rollback if:
- Data validation fails
- Application health checks fail
- Performance worse than before
- User-facing errors detected

### Emergency Rollback (< 2 minutes)
```bash
cd scripts/migration
node 5-rollback.js execute
```

**Manual rollback steps:**
1. Restore original DATABASE_URL in environment
2. Redeploy application
3. Verify `/api/health` returns 200
4. Test `/points` page loads

## 📊 Success Criteria

### Functional
- [ ] All data migrated without loss
- [ ] User authentication works
- [ ] All API endpoints respond
- [ ] Family/task operations function

### Performance 
- [ ] `/points` page loads in <500ms (vs current 5-10s)
- [ ] No database timeout errors
- [ ] Response times improved across all endpoints

### Data Integrity
- [ ] User count matches exactly
- [ ] Points history preserved
- [ ] Family relationships intact
- [ ] Task data complete

## 📱 User Communication

### Pre-Migration (24 hours)
**Email/In-App Notice:**
```
🔧 Scheduled Maintenance Notice

We're upgrading our database infrastructure to improve performance, especially for the Points page which some users have experienced slow loading.

📅 When: [DATE] at [TIME]
⏱️ Duration: 30-45 minutes
🎯 Benefit: Faster loading times and better reliability

During maintenance, the app will be temporarily unavailable. All your data will be preserved.

Thank you for your patience!
- The FamilyTasks Team
```

### During Migration
**Maintenance Page:**
```
🔧 We're upgrading our database for better performance!

This should only take 30-45 minutes.
All your family data is safe and will be available when we're back online.

Expected completion: [TIME]
```

### Post-Migration
**Success Notice:**
```
✅ Upgrade Complete!

The performance improvements are now live. You should notice:
- Much faster Points page loading
- Improved overall app responsiveness
- Better reliability

Thank you for your patience during the upgrade!
```

## 🔍 Monitoring & Validation

### Key Metrics to Watch (First 24 hours)
- Database response times
- Error rates
- User login success rate
- Page load times (especially `/points`)
- Database connection pool usage

### Rollback Decision Points
- **Hour 1**: If error rate >1% → Consider rollback
- **Hour 6**: If performance not improved → Plan rollback
- **Day 1**: If user complaints increase → Investigate rollback

## 📁 Files and Resources

### Migration Scripts
- `scripts/migration/1-setup-vercel-postgres.js` - Database setup
- `scripts/migration/2-export-from-supabase.js` - Data export
- `scripts/migration/3-import-to-vercel.js` - Data import
- `scripts/migration/4-validate-migration.js` - Validation
- `scripts/migration/5-rollback.js` - Emergency rollback

### Environment Files
- `.env.vercel` - New database configuration
- `.env.rollback` - Rollback configuration (auto-generated)

### Reports & Logs
- `scripts/migration/exports/manifest.json` - Export summary
- `scripts/migration/exports/validation-report.json` - Migration validation
- `scripts/migration/rollback.log` - Rollback activity log

## 👥 Team Responsibilities

### Migration Lead
- Execute migration scripts
- Monitor progress and timelines
- Make go/no-go decisions
- Coordinate team communication

### Backend Engineer
- Monitor database performance
- Validate data integrity
- Handle technical issues
- Support rollback if needed

### Frontend Engineer
- Test user-facing functionality
- Validate UI performance
- Monitor user experience
- Report any UI issues

### DevOps/Infrastructure
- Manage environment variables
- Handle deployments
- Monitor system health
- Coordinate infrastructure changes

## 📞 Emergency Contacts

**During Migration Window:**
- Migration Lead: [Contact]
- Backend Engineer: [Contact]
- DevOps: [Contact]
- Project Manager: [Contact]

**Escalation:**
- Technical Director: [Contact]
- CTO: [Contact]

---

**Document Status:** Ready for Review  
**Last Updated:** ${new Date().toISOString()}  
**Review Required:** Before production execution  
**Approval Required:** Technical Director sign-off