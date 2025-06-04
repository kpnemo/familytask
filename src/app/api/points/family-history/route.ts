import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

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

    // Check if user is a parent (only parents can view family-wide history)
    const isParent = ["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)
    
    if (!isParent) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can view family-wide points history" } },
        { status: 403 }
      )
    }

    // Get all family members
    const familyMembers = await db.familyMember.findMany({
      where: { familyId: currentUserMembership.familyId },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    // Get complete points history for all family members
    const familyPointsHistory = await db.pointsHistory.findMany({
      where: { 
        familyId: currentUserMembership.familyId
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        creator: {
          select: { name: true }
        },
        task: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    // Format the history data
    const formattedHistory = familyPointsHistory.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.user.name,
      points: entry.points,
      reason: entry.reason,
      createdAt: entry.createdAt,
      createdBy: entry.creator.name,
      taskTitle: entry.task?.title || null,
      isDeduction: entry.points < 0
    }))

    // Calculate current balance for each family member
    const memberBalances = familyMembers.map(member => {
      const memberHistory = familyPointsHistory.filter(h => h.userId === member.userId)
      const currentBalance = memberHistory.reduce((sum, entry) => sum + entry.points, 0)
      
      return {
        userId: member.userId,
        userName: member.user.name,
        currentBalance
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        history: formattedHistory,
        memberBalances
      }
    })

  } catch (error) {
    console.error("Family points history error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}