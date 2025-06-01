import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateMissingRecurringTasks } from "@/lib/recurring-tasks"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Only parents can generate recurring tasks
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can generate recurring tasks" } },
        { status: 403 }
      )
    }

    const generatedTasks = await generateMissingRecurringTasks()

    return NextResponse.json({
      success: true,
      data: {
        generated: generatedTasks.length,
        tasks: generatedTasks
      }
    })

  } catch (error) {
    console.error("Generate recurring tasks error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}