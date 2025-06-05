import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const addPointsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  points: z.number().int().positive("Points must be a positive number"),
  reason: z.string().min(1, "Reason is required").max(200, "Reason must be less than 200 characters")
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
    const { userId, points, reason } = addPointsSchema.parse(body)

    // Get the current user's family membership to check permissions
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

    // Check if user has permission to add points (must be PARENT or ADMIN_PARENT)
    if (!["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can add points" } },
        { status: 403 }
      )
    }

    // Get the target user and verify they're in the same family
    const targetUserMembership = await db.familyMember.findFirst({
      where: { 
        userId: userId,
        familyId: currentUserMembership.familyId
      },
      include: { user: true }
    })

    if (!targetUserMembership) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found in your family" } },
        { status: 404 }
      )
    }

    // Calculate current balance
    const pointsEntries = await db.pointsHistory.findMany({
      where: { 
        userId: userId,
        familyId: currentUserMembership.familyId
      },
      select: { points: true }
    })

    const currentBalance = pointsEntries.reduce((sum, entry) => sum + entry.points, 0)

    // Create the points addition entry (positive points)
    const pointsEntry = await db.pointsHistory.create({
      data: {
        userId: userId,
        familyId: currentUserMembership.familyId,
        points: points, // Positive for addition
        reason: `Bonus Points: ${reason}`,
        createdBy: session.user.id,
        taskId: null // No task associated with manual point additions
      },
      include: {
        user: {
          select: { name: true }
        },
        creator: {
          select: { name: true }
        }
      }
    })

    // Calculate new balance
    const newBalance = currentBalance + points

    return NextResponse.json({
      success: true,
      data: {
        id: pointsEntry.id,
        userId: pointsEntry.userId,
        userName: pointsEntry.user.name,
        points: pointsEntry.points,
        reason: pointsEntry.reason,
        createdBy: pointsEntry.creator.name,
        createdAt: pointsEntry.createdAt,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0].message } },
        { status: 400 }
      )
    }

    console.error("Points addition error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}