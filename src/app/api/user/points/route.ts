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

    // Also get points from completed/verified tasks (fallback in case points history isn't being used)
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

    // Use points history if it has data, otherwise fall back to completed tasks  
    const totalPoints = pointsFromHistory > 0 ? pointsFromHistory : pointsFromTasks

    // Debug logging
    console.log(`Points calculation for user ${session.user.id}:`, {
      pointsFromHistory,
      pointsFromTasks,
      totalPoints,
      pointsHistoryCount: pointsEntries.length,
      completedTasksCount: completedTasks.length
    })

    return NextResponse.json({ 
      success: true, 
      points: totalPoints,
      debug: {
        pointsFromHistory,
        pointsFromTasks,
        totalPoints,
        pointsHistoryCount: pointsEntries.length,
        completedTasksCount: completedTasks.length
      }
    })
  } catch (error) {
    console.error("Error fetching points:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}