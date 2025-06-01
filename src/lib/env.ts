// Environment variable validation and fallbacks for Amplify
export function validateEnv() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key)

  if (missing.length > 0) {
    const error = `Missing environment variables: ${missing.join(', ')}`
    console.error('Environment validation failed:', error)
    throw new Error(error)
  }

  return requiredVars
}

// Call this to ensure env vars are available
validateEnv()