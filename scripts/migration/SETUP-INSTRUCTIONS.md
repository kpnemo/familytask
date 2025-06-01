# Vercel Postgres Setup Instructions

## Automatic Setup Completed ✅

The setup script has prepared your Vercel Postgres database. Follow these steps to complete the setup:

### 1. Manual Steps Required

#### A. Get Connection Strings from Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Find `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING`
5. Copy these values

#### B. Update Environment File
1. Open `.env.vercel` (created by this script)
2. Replace placeholder URLs with actual Vercel URLs
3. Save the file

### 2. Test Setup

Run the test script to verify everything works:
```bash
cd scripts/migration
node 1-setup-vercel-postgres.js test
```

### 3. Environment Configuration

The setup created these files:
- `.env.vercel` - New database configuration
- `setup-log.json` - Setup process log

### 4. Migration Process

After setup verification:
1. Run export: `node 2-export-from-supabase.js`
2. Run import: `node 3-import-to-vercel.js`
3. Run validation: `node 4-validate-migration.js`

### 5. Production Cutover

When ready for production:
1. Update `.env` with Vercel URLs
2. Deploy to production
3. Test thoroughly
4. Keep Supabase as backup for 7 days

## Troubleshooting

### Common Issues:

#### "Vercel CLI not found"
```bash
npm install -g vercel
vercel login
```

#### "Database connection failed"
- Verify URLs in Vercel dashboard
- Check network connectivity
- Ensure IP whitelist includes your location

#### "Migration failed"
- Check schema compatibility
- Verify Prisma version
- Review migration logs

## Support

For issues during setup:
1. Check setup log: `scripts/migration/setup-log.json`
2. Verify Vercel project settings
3. Review this documentation

---
*Generated: 2025-06-01T15:43:42.336Z*
*Script: scripts/migration/1-setup-vercel-postgres.js*
