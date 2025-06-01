// Utility to generate DIRECT_URL from DATABASE_URL if missing
export function getDirectUrl(): string {
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL
  
  // If DIRECT_URL is already set, use it
  if (directUrl) {
    return directUrl
  }
  
  // If DATABASE_URL is not set, throw error
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required")
  }
  
  // Generate DIRECT_URL from DATABASE_URL by changing port from 6543 to 5432
  // and removing pgbouncer parameter
  const directUrlGenerated = databaseUrl
    .replace(':6543/', ':5432/')
    .replace('?pgbouncer=true', '')
  
  console.log("Generated DIRECT_URL from DATABASE_URL")
  return directUrlGenerated
}

// Set the DIRECT_URL if it's missing
if (typeof process !== 'undefined' && process.env && !process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = getDirectUrl()
}