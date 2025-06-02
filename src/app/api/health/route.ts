import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import packageJson from "../../../../package.json"

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`
    
    // Check critical environment variables
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    }

    return NextResponse.json({
      status: "healthy",
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: "connected"
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      version: packageJson.version,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}