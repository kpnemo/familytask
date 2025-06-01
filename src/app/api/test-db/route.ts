import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Test database connection
    const userCount = await db.user.count()
    const familyCount = await db.family.count()
    const taskCount = await db.task.count()
    
    return NextResponse.json({
      success: true,
      data: {
        connection: "OK",
        userCount,
        familyCount,
        taskCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}