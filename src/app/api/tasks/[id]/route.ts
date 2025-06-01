import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateTaskSchema } from "@/lib/validations"

export async function GET(
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

    const task = await db.task.findFirst({
      where: {
        id,
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, role: true }
        },
        assignee: {
          select: { id: true, name: true, role: true }
        },
        verifier: {
          select: { id: true, name: true, role: true }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      )
    }

    // Format tags
    const formattedTask = {
      ...task,
      tags: task.tags.map(t => t.tag)
    }

    return NextResponse.json({
      success: true,
      data: formattedTask
    })

  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await req.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and user can edit it
    const task = await db.task.findFirst({
      where: {
        id,
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found" } },
        { status: 404 }
      )
    }

    // Only creator or parents can edit tasks
    if (task.createdBy !== session.user.id && session.user.role === "CHILD") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to edit this task" } },
        { status: 403 }
      )
    }

    // Update task in transaction
    const result = await db.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.points && { points: validatedData.points }),
          ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate + "T23:59:59.999Z") }),
        }
      })

      // Update tags if provided
      if (validatedData.tagIds) {
        // Remove existing tag relations
        await tx.taskTagRelation.deleteMany({
          where: { taskId: id }
        })

        // Add new tag relations
        if (validatedData.tagIds.length > 0) {
          await tx.taskTagRelation.createMany({
            data: validatedData.tagIds.map(tagId => ({
              taskId: id,
              tagId
            }))
          })
        }
      }

      return updatedTask
    })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Update task error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input data" } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get user's family membership to check permissions
    const familyMembership = await db.familyMember.findFirst({
      where: { userId: session.user.id },
      include: { family: true }
    })

    if (!familyMembership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not a family member" } },
        { status: 403 }
      )
    }

    // Check if user is parent or admin
    const isParentOrAdmin = ["PARENT", "ADMIN_PARENT"].includes(familyMembership.role)

    if (!isParentOrAdmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents and admins can delete tasks" } },
        { status: 403 }
      )
    }

    // Get task with full details including points history
    const task = await db.task.findFirst({
      where: {
        id,
        familyId: familyMembership.familyId
      },
      include: {
        assignee: {
          select: { id: true, name: true }
        },
        creator: {
          select: { id: true, name: true }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: { code: "TASK_NOT_FOUND", message: "Task not found or not in your family" } },
        { status: 404 }
      )
    }

    // Perform deletion with proper points calculation in a transaction
    const result = await db.$transaction(async (tx) => {
      let pointsAdjustment = null

      // If task was verified, we need to reverse the points
      if (task.status === "VERIFIED" && task.assignedTo) {
        // Find the points history entry for this task
        const pointsEntry = await tx.pointsHistory.findFirst({
          where: {
            taskId: task.id,
            userId: task.assignedTo,
            points: { gt: 0 } // Positive points (earned)
          }
        })

        if (pointsEntry) {
          // Create a reversal entry
          await tx.pointsHistory.create({
            data: {
              userId: task.assignedTo,
              familyId: task.familyId,
              points: -pointsEntry.points,
              reason: `Task deleted: ${task.title} (points reversed)`,
              createdBy: session.user.id
            }
          })

          pointsAdjustment = {
            userId: task.assignedTo,
            pointsReversed: pointsEntry.points
          }
        }
      }

      // Delete related notifications
      await tx.notification.deleteMany({
        where: { relatedTaskId: task.id }
      })

      // Delete task tag relations
      await tx.taskTagRelation.deleteMany({
        where: { taskId: task.id }
      })

      // Delete points history entries for this task
      await tx.pointsHistory.deleteMany({
        where: { taskId: task.id }
      })

      // Finally delete the task
      await tx.task.delete({
        where: { id }
      })

      // Create a notification for the assignee if different from deleter
      if (task.assignedTo && task.assignedTo !== session.user.id) {
        try {
          await tx.notification.create({
            data: {
              userId: task.assignedTo,
              title: "Task Deleted",
              message: `The task "${task.title}" has been deleted by ${session.user.name}`,
              type: "TASK_DELETED"
            }
          })
        } catch (error) {
          // Fallback if TASK_DELETED enum doesn't exist yet - use POINTS_DEDUCTED as fallback
          console.warn("TASK_DELETED enum not available, using fallback notification type")
          await tx.notification.create({
            data: {
              userId: task.assignedTo,
              title: "Task Deleted",
              message: `The task "${task.title}" has been deleted by ${session.user.name}`,
              type: "POINTS_DEDUCTED" // Temporary fallback
            }
          })
        }
      }

      // Create a notification for the creator if different from deleter and assignee
      if (task.createdBy && task.createdBy !== session.user.id && task.createdBy !== task.assignedTo) {
        try {
          await tx.notification.create({
            data: {
              userId: task.createdBy,
              title: "Task Deleted",
              message: `The task "${task.title}" has been deleted by ${session.user.name}`,
              type: "TASK_DELETED"
            }
          })
        } catch (error) {
          // Fallback if TASK_DELETED enum doesn't exist yet
          console.warn("TASK_DELETED enum not available, using fallback notification type")
          await tx.notification.create({
            data: {
              userId: task.createdBy,
              title: "Task Deleted",
              message: `The task "${task.title}" has been deleted by ${session.user.name}`,
              type: "POINTS_DEDUCTED" // Temporary fallback
            }
          })
        }
      }

      return {
        task,
        pointsAdjustment
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: "Task deleted successfully",
        taskTitle: result.task.title,
        taskStatus: result.task.status,
        pointsAdjustment: result.pointsAdjustment
      }
    })

  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}