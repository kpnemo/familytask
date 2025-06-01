import { NextResponse } from "next/server"
import { ensureDirectUrl } from "@/lib/db-config"

export async function GET() {
  try {
    // Try to ensure DIRECT_URL is set
    ensureDirectUrl()
    
    return NextResponse.json({
      success: true,
      data: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        DIRECT_URL: process.env.DIRECT_URL ? "SET" : "NOT SET", 
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "NOT SET",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "NOT SET",
        // Show first few characters for debugging (don't expose full values)
        DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 30) || "MISSING",
        DIRECT_URL_PREFIX: process.env.DIRECT_URL?.substring(0, 30) || "MISSING",
        DIRECT_URL_GENERATED: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(':6543/', ':5432/').replace('?pgbouncer=true', '').substring(0, 30) + "..."
          : "NO DATABASE_URL",
        allEnvKeys: Object.keys(process.env).filter(key => 
          key.includes('DATABASE') || 
          key.includes('NEXTAUTH') || 
          key.includes('DIRECT')
        )
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        env_check: "Environment variable check failed"
      },
      { status: 500 }
    )
  }
}