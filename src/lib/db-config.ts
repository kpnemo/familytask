// Utility to generate DIRECT_URL from DATABASE_URL if missing
export function ensureDirectUrl(): void {
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  
  // If DIRECT_URL is already set, no need to generate
  if (directUrl) {
    return
  }
  
  // If DATABASE_URL is not set, we can't generate DIRECT_URL
  if (!databaseUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("DATABASE_URL environment variable is required")
    }
    return
  }
  
  // Generate DIRECT_URL from DATABASE_URL by changing port from 6543 to 5432
  // and removing pgbouncer parameter
  const directUrlGenerated = databaseUrl
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '')
    .replace(/&pgbouncer=true/, '')
  
  // Set the environment variable
  process.env.DIRECT_URL = directUrlGenerated
}

// Ensure DIRECT_URL is set immediately
ensureDirectUrl()