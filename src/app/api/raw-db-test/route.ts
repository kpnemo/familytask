import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { Client } = require('pg')
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })

    await client.connect()
    const result = await client.query('SELECT NOW() as current_time')
    await client.end()
    
    return NextResponse.json({
      success: true,
      message: "Raw PostgreSQL connection successful",
      data: result.rows[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}