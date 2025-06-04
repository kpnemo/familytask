import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { declineTaskSchema } from "@/lib/validations"
import { z } from "zod"

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

    // Only parents can decline tasks
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can decline tasks" } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { reason } = declineTaskSchema.parse(body)

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
      select: {
        id: true,
        title: true,
        assignedTo: true,
        assignee: {
          select: { id: true, name: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found or not ready for review" } },
        { status: 404 }
      )
    }

    // Decline task and create notification
    const result = await db.$transaction(async (tx) => {
      // Update task status back to pending
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: "PENDING",
          completedAt: null, // Remove completion timestamp
        },
        include: {
          assignee: {
            select: { id: true, name: true }
          }
        }
      })

      // Create notification for assignee
      await tx.notification.create({
        data: {
          userId: task.assignedTo,
          title: "Task Needs Rework",
          message: `Your task "${task.title}" was declined and needs to be redone.${reason ? ` Reason: ${reason}` : ''}`,
          type: "TASK_ASSIGNED", // Using existing type since TASK_DECLINED might not be recognized
          relatedTaskId: id
        }
      })

      return updatedTask
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Decline task error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0].message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}