import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNextRecurringTask } from "@/lib/recurring-tasks"
import { createNotificationWithSMS } from "@/lib/notification-helpers"

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

    // Check due date constraint for dueDateOnly tasks
    if (task.dueDateOnly) {
      const today = new Date()
      const dueDate = new Date(task.dueDate)
      
      // Normalize dates to remove time component for comparison
      today.setHours(0, 0, 0, 0)
      dueDate.setHours(0, 0, 0, 0)
      
      console.log("Due date constraint check:", {
        taskId: task.id,
        dueDateOnly: task.dueDateOnly,
        today: today.toDateString(),
        dueDate: dueDate.toDateString(),
        canComplete: today >= dueDate
      })
      
      // Allow completion on or after the due date
      if (today < dueDate) {
        return NextResponse.json(
          { 
            error: { 
              code: "DUE_DATE_CONSTRAINT", 
              message: `This task can only be completed on or after its due date: ${dueDate.toLocaleDateString()}` 
            } 
          },
          { status: 400 }
        )
      }
    }

    // Only auto-verify if the parent is completing their own task
    // If a parent completes a task assigned to someone else, it should still follow normal workflow
    const isParentCompletingOwnTask = session.user.role === "PARENT" && task.assignedTo === session.user.id

    // Update task status and create notification
    const result = await db.$transaction(async (tx) => {
      const status = isParentCompletingOwnTask ? "VERIFIED" : "COMPLETED"
      
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status,
          completedAt: new Date(),
          ...(isParentCompletingOwnTask && {
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

      if (isParentCompletingOwnTask) {
        // Award points immediately for parent completing their own tasks
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
      }

      return updatedTask
    })

    // Send notifications outside transaction (SMS calls can be slow)
    if (isParentCompletingOwnTask) {
      // Send verification and points notifications for parent completing their own task
      const notifications = [
        {
          userId: task.assignedTo,
          title: "Task Verified",
          message: `Your task "${task.title}" has been verified! You earned ${task.points} points.`,
          type: "TASK_VERIFIED" as const,
          relatedTaskId: id,
          smsData: { title: task.title, points: task.points }
        },
        {
          userId: task.assignedTo,
          title: "Points Earned", 
          message: `You earned ${task.points} points for completing "${task.title}"`,
          type: "POINTS_EARNED" as const,
          relatedTaskId: id,
          smsData: { title: task.title, points: task.points }
        }
      ]

      notifications.forEach(({ smsData, ...notificationData }) => {
        createNotificationWithSMS(notificationData, smsData).catch(error => {
          console.error("Failed to send task verification notification:", error)
        })
      })
    } else {
      // Send completion notification to task creator
      if (task.createdBy !== session.user.id) {
        createNotificationWithSMS(
          {
            userId: task.createdBy,
            title: "Task Completed",
            message: `${session.user.name} has completed the task: "${task.title}"`,
            type: "TASK_COMPLETED",
            relatedTaskId: id
          },
          {
            title: task.title,
            userName: session.user.name
          }
        ).catch(error => {
          console.error("Failed to send task completion notification:", error)
        })
      }
    }

    // For parent completing their own task, create next recurring task instance if needed
    if (isParentCompletingOwnTask && task.isRecurring && task.recurrencePattern) {
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