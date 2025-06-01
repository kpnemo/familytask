import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    // Get the current user's family membership
    const currentUserMembership = await db.familyMember.findFirst({
      where: { userId: session.user.id },
      include: { family: true }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // Determine which user's history to fetch
    let targetUserId = session.user.id // Default to current user

    if (userId) {
      // If userId is provided, check permissions
      const isParent = ["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)
      
      if (!isParent) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Only parents can view other users' history" } },
          { status: 403 }
        )
      }

      // Verify the target user is in the same family
      const targetUserMembership = await db.familyMember.findFirst({
        where: { 
          userId: userId,
          familyId: currentUserMembership.familyId
        }
      })

      if (!targetUserMembership) {
        return NextResponse.json(
          { error: { code: "USER_NOT_FOUND", message: "User not found in your family" } },
          { status: 404 }
        )
      }

      targetUserId = userId
    }

    // Get points history
    const pointsHistory = await db.pointsHistory.findMany({
      where: { 
        userId: targetUserId,
        familyId: currentUserMembership.familyId
      },
      include: {
        creator: {
          select: { name: true }
        },
        task: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Calculate running balance for each entry
    let runningBalance = 0
    const historyWithBalance = pointsHistory.reverse().map((entry) => {
      const balanceBefore = runningBalance
      runningBalance += entry.points
      const balanceAfter = runningBalance

      return {
        id: entry.id,
        points: entry.points,
        reason: entry.reason,
        createdAt: entry.createdAt,
        createdBy: entry.creator.name,
        taskTitle: entry.task?.title || null,
        balanceBefore,
        balanceAfter,
        isDeduction: entry.points < 0
      }
    }).reverse() // Reverse back to show newest first

    // Get current balance
    const currentBalance = pointsHistory.reduce((sum, entry) => sum + entry.points, 0)

    return NextResponse.json({
      success: true,
      data: {
        history: historyWithBalance,
        currentBalance
      }
    })

  } catch (error) {
    console.error("Points history error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}