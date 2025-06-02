import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's total points from points history
    const pointsEntries = await db.pointsHistory.findMany({
      where: { 
        userId: session.user.id
      },
      select: { points: true }
    })

    const pointsFromHistory = pointsEntries.reduce((sum, entry) => sum + entry.points, 0)

    // If we have points history entries, use that total (even if it's 0)
    // Otherwise fall back to completed tasks for backwards compatibility
    if (pointsEntries.length > 0) {
      return NextResponse.json({ 
        success: true, 
        points: pointsFromHistory
      })
    }

    // Fallback: Get points from completed/verified tasks if no points history exists
    const completedTasks = await db.task.findMany({
      where: { 
        assignedTo: session.user.id,
        status: {
          in: ["COMPLETED", "VERIFIED"]
        }
      },
      select: { points: true }
    })

    const pointsFromTasks = completedTasks.reduce((sum, task) => sum + task.points, 0)

    return NextResponse.json({ 
      success: true, 
      points: pointsFromTasks
    })
  } catch (error) {
    console.error("Error fetching points:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}