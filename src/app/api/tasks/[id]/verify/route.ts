import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Only parents can verify tasks
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can verify tasks" } },
        { status: 403 }
      )
    }

    // Check if task exists and is in completed status
    const task = await db.task.findFirst({
      where: {
        id,
        status: "COMPLETED",
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      },
      include: {
        assignee: {
          select: { id: true, name: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found or not ready for verification" } },
        { status: 404 }
      )
    }

    // Verify task and award points
    const result = await db.$transaction(async (tx) => {
      // Update task status
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedBy: session.user.id
        },
        include: {
          assignee: {
            select: { id: true, name: true }
          },
          verifier: {
            select: { id: true, name: true }
          }
        }
      })

      // Award points to assignee
      await tx.pointsHistory.create({
        data: {
          userId: task.assignedTo,
          familyId: task.familyId,
          points: task.points,
          reason: `Task completed: ${task.title}`,
          taskId: task.id,
          createdBy: session.user.id
        }
      })

      // Create notifications
      await tx.notification.create({
        data: {
          userId: task.assignedTo,
          title: "Task Verified",
          message: `Your task "${task.title}" has been verified! You earned ${task.points} points.`,
          type: "TASK_VERIFIED",
          relatedTaskId: id
        }
      })

      await tx.notification.create({
        data: {
          userId: task.assignedTo,
          title: "Points Earned",
          message: `You earned ${task.points} points for completing "${task.title}"`,
          type: "POINTS_EARNED",
          relatedTaskId: id
        }
      })

      return updatedTask
    })

    return NextResponse.json({
      success: true,
      data: {
        task: result,
        pointsAwarded: task.points
      }
    })

  } catch (error) {
    console.error("Verify task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}