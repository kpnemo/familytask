import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNextRecurringTask } from "@/lib/recurring-tasks"

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

    // Check if task exists and is assigned to current user
    const task = await db.task.findFirst({
      where: {
        id,
        assignedTo: session.user.id,
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found or not assigned to you" } },
        { status: 404 }
      )
    }

    // Check if task is already completed or verified
    if (task.status === "COMPLETED" || task.status === "VERIFIED") {
      return NextResponse.json(
        { error: { code: "TASK_ALREADY_COMPLETED", message: "Task is already completed" } },
        { status: 400 }
      )
    }

    // Update task status and create notification
    const result = await db.$transaction(async (tx) => {
      // If user is a parent, auto-verify the task
      const isParent = session.user.role === "PARENT"
      const status = isParent ? "VERIFIED" : "COMPLETED"
      
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status,
          completedAt: new Date(),
          ...(isParent && {
            verifiedAt: new Date(),
            verifiedBy: session.user.id
          })
        },
        include: {
          creator: {
            select: { id: true, name: true }
          },
          assignee: {
            select: { id: true, name: true }
          }
        }
      })

      if (isParent) {
        // Award points immediately for parent tasks
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

        // Create verification and points notifications
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
      } else {
        // Create notification for task creator (if different from assignee)
        if (task.createdBy !== session.user.id) {
          await tx.notification.create({
            data: {
              userId: task.createdBy,
              title: "Task Completed",
              message: `${session.user.name} has completed the task: "${task.title}"`,
              type: "TASK_COMPLETED",
              relatedTaskId: id
            }
          })
        }
      }

      return updatedTask
    })

    // Create next recurring task instance if needed (outside transaction)
    if (task.isRecurring && task.recurrencePattern) {
      try {
        await createNextRecurringTask(id)
      } catch (error) {
        console.error("Error creating next recurring task:", error)
        // Don't fail the main operation if recurring task creation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Complete task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}