import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateTimezoneSchema = z.object({
  timezone: z.string().min(1, "Timezone is required")
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { timezone } = updateTimezoneSchema.parse(body)

    // Update user timezone
    await db.user.update({
      where: { id: session.user.id },
      data: { timezone }
    })

    return NextResponse.json({
      success: true,
      data: { message: "Timezone updated successfully" }
    })

  } catch (error) {
    console.error("Update timezone error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid timezone data" } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}