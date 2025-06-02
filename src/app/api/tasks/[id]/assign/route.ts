import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createNotificationWithSMS } from "@/lib/notification-helpers"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const taskId = params.id

    // Get user's family membership
    const familyMember = await db.familyMember.findFirst({
      where: { userId: session.user.id }
    })

    if (!familyMember) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // Get the task and verify it's a bonus task
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        familyId: familyMember.familyId
      },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      )
    }

    if (!task.isBonusTask) {
      return NextResponse.json(
        { error: { code: "NOT_BONUS_TASK", message: "This is not a bonus task" } },
        { status: 400 }
      )
    }

    if (task.status !== "AVAILABLE") {
      return NextResponse.json(
        { error: { code: "TASK_NOT_AVAILABLE", message: "Task is no longer available" } },
        { status: 400 }
      )
    }

    if (task.assignedTo) {
      return NextResponse.json(
        { error: { code: "TASK_ALREADY_ASSIGNED", message: "Task has already been assigned" } },
        { status: 400 }
      )
    }

    // Assign the task to the current user
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        assignedTo: session.user.id,
        status: "PENDING"
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

    // Notify the task creator
    if (task.createdBy !== session.user.id) {
      createNotificationWithSMS(
        {
          userId: task.createdBy,
          title: "Bonus Task Claimed",
          message: `${session.user.name} has claimed the bonus task: "${task.title}"`,
          type: "BONUS_TASK_SELF_ASSIGNED",
          relatedTaskId: task.id
        },
        {
          title: task.title,
          assigneeName: session.user.name
        }
      ).catch(error => {
        console.error("Failed to send bonus task assignment notification:", error)
      })
    }

    // Notify other family members that the task is no longer available
    const familyMembers = await db.familyMember.findMany({
      where: { 
        familyId: familyMember.familyId,
        NOT: {
          userId: {
            in: [session.user.id, task.createdBy]
          }
        }
      }
    })

    familyMembers.forEach(member => {
      createNotificationWithSMS(
        {
          userId: member.userId,
          title: "Bonus Task Claimed",
          message: `Bonus task "${task.title}" has been claimed by ${session.user.name}`,
          type: "BONUS_TASK_SELF_ASSIGNED",
          relatedTaskId: task.id
        },
        {
          title: task.title,
          assigneeName: session.user.name
        }
      ).catch(error => {
        console.error("Failed to send bonus task claim notification:", error)
      })
    })

    return NextResponse.json({
      success: true,
      data: updatedTask
    })

  } catch (error) {
    console.error("Assign bonus task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}