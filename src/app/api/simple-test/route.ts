import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simple test without any database connection
    return NextResponse.json({
      success: true,
      message: "API is working",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}