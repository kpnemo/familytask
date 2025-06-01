# Database Migration Plan: Supabase → Vercel Postgres

## Overview
Migrate from Supabase PostgreSQL (US West) to Vercel Postgres to reduce latency and fix timeout issues.

## Database Schema Analysis
- **8 core tables**: users, families, family_members, tasks, task_tags, task_tag_relations, points_history, notifications
- **Complex relationships**: Foreign keys with cascading deletes
- **Data integrity**: Unique constraints, enums, timestamps
- **Active users**: Production system with live data

## Migration Strategy: Zero-Downtime Blue-Green Deployment

### Phase 1: Preparation (No downtime)
1. **Setup Vercel Postgres**
   - Create new database instance
   - Configure connection strings
   - Test connectivity

2. **Create Migration Scripts**
   - Export script with data validation
   - Import script with integrity checks
   - Data comparison/validation script

3. **Testing Environment**
   - Test full migration on staging
   - Validate data integrity
   - Performance benchmarks

### Phase 2: Migration (Minimal downtime ~2-5 minutes)
1. **Pre-migration**
   - Notify users of maintenance window
   - Take application offline (read-only mode)
   - Final data export from Supabase

2. **Migration**
   - Import data to Vercel Postgres
   - Run validation checks
   - Update environment variables

3. **Cutover**
   - Switch application to new database
   - Verify application functionality
   - Monitor for issues

### Phase 3: Post-migration
1. **Validation**
   - Data integrity checks
   - User testing
   - Performance monitoring

2. **Cleanup**
   - Keep Supabase as backup for 7 days
   - Update documentation
   - Remove old connection strings

## Risk Mitigation

### Data Protection
- **Full backup** before migration
- **Rollback plan** ready in <5 minutes
- **Data validation** at each step
- **Point-in-time recovery** capability

### Application Continuity
- **Health checks** before/after migration
- **Database connection pooling** configuration
- **Environment variable rollback** ready
- **User notification** system

## Migration Scripts Structure
```
scripts/migration/
├── 1-setup-vercel-postgres.js     # Initial setup
├── 2-export-from-supabase.js      # Data export
├── 3-import-to-vercel.js          # Data import
├── 4-validate-migration.js        # Data validation
├── 5-rollback.js                  # Emergency rollback
└── utils/
    ├── db-connections.js           # Database utilities
    ├── data-validator.js           # Validation functions
    └── backup-manager.js           # Backup operations
```

## Success Criteria
- ✅ All data migrated without loss
- ✅ All relationships preserved
- ✅ Application functions normally
- ✅ Performance improved (latency <100ms)
- ✅ Zero user-facing errors

## Timeline
- **Preparation**: 2-3 hours
- **Testing**: 1-2 hours  
- **Production Migration**: 30 minutes
- **Validation**: 1 hour

## Emergency Contacts
- Database admin access required
- Vercel dashboard access
- Supabase dashboard access (backup)

---
*Created: $(date)*
*Status: Planning Phase*