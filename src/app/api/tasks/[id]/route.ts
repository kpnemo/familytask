import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateTaskSchema } from "@/lib/validations"
import { createNotificationWithSMS } from "@/lib/notification-helpers"

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
      },
      include: {
        assignee: {
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

    // Only creator or parents can edit tasks
    if (task.createdBy !== session.user.id && session.user.role === "CHILD") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to edit this task" } },
        { status: 403 }
      )
    }

    console.log("🔍 Task update debugging:", {
      taskId: task.id,
      taskTitle: task.title,
      currentAssignedTo: task.assignedTo,
      newAssignedTo: validatedData.assignedTo,
      requestBody: body,
      validatedData: validatedData
    })

    // Check if assignment is being changed (reassignment logic)
    const isReassigning = validatedData.assignedTo && validatedData.assignedTo !== task.assignedTo
    
    console.log("🎯 Reassignment check:", {
      isReassigning: isReassigning,
      hasNewAssignedTo: !!validatedData.assignedTo,
      isDifferentFromCurrent: validatedData.assignedTo !== task.assignedTo,
      currentAssignedTo: task.assignedTo,
      newAssignedTo: validatedData.assignedTo
    })
    
    // Only parents can reassign tasks
    if (isReassigning && session.user.role === "CHILD") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can reassign tasks" } },
        { status: 403 }
      )
    }

    // Only allow reassignment for PENDING tasks
    if (isReassigning && task.status !== "PENDING") {
      return NextResponse.json(
        { error: { code: "INVALID_STATUS", message: "Can only reassign tasks in PENDING status" } },
        { status: 400 }
      )
    }

    // Validate that new assignee is a family member
    let newAssignee = null
    if (isReassigning) {
      const familyMember = await db.familyMember.findFirst({
        where: { 
          userId: session.user.id,
        },
        select: { familyId: true }
      })

      if (!familyMember) {
        return NextResponse.json(
          { error: { code: "FAMILY_NOT_FOUND", message: "Family not found" } },
          { status: 404 }
        )
      }

      newAssignee = await db.familyMember.findFirst({
        where: {
          userId: validatedData.assignedTo,
          familyId: familyMember.familyId
        },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      })

      if (!newAssignee) {
        return NextResponse.json(
          { error: { code: "INVALID_ASSIGNEE", message: "New assignee is not a family member" } },
          { status: 400 }
        )
      }
    }

    // Update task in transaction
    const result = await db.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          ...(validatedData.title && { title: validatedData.title }),
          ...(validatedData.description !== undefined && { description: validatedData.description }),
          ...(validatedData.points && { points: validatedData.points }),
          ...(validatedData.dueDate && { dueDate: new Date(validatedData.dueDate + "T12:00:00.000Z") }),
          ...(validatedData.assignedTo && { assignedTo: validatedData.assignedTo }),
          ...(validatedData.dueDateOnly !== undefined && { dueDateOnly: validatedData.dueDateOnly }),
          ...(validatedData.isRecurring !== undefined && { 
            isRecurring: validatedData.isRecurring,
            // If isRecurring is false, clear the recurrence pattern
            ...(validatedData.isRecurring === false && { recurrencePattern: null })
          }),
          ...(validatedData.recurrencePattern !== undefined && { recurrencePattern: validatedData.recurrencePattern }),
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

    // Send reassignment notifications after successful update
    if (isReassigning && newAssignee) {
      console.log("🔔 Sending reassignment notifications:", {
        taskTitle: task.title,
        previousAssignee: task.assignedTo,
        newAssignee: validatedData.assignedTo,
        reassignedBy: session.user.name
      })
      
      try {
        // Notify previous assignee (if different from current user)
        if (task.assignedTo && task.assignedTo !== session.user.id) {
          console.log("📤 Notifying previous assignee:", task.assignedTo)
          const notification = await createNotificationWithSMS(
            {
              userId: task.assignedTo,
              title: "Task Reassigned Away",
              message: `Task "${task.title}" was reassigned from you to ${newAssignee.user.name} by ${session.user.name}`,
              type: "TASK_REASSIGNED",
              relatedTaskId: task.id
            },
            {
              title: task.title,
              userName: newAssignee.user.name
            }
          )
          console.log("✅ Previous assignee notification created:", notification.id)
        } else {
          console.log("⏭️ Skipping previous assignee notification (same as current user)")
        }

        // Notify new assignee (if different from current user)
        if (validatedData.assignedTo !== session.user.id) {
          console.log("📤 Notifying new assignee:", validatedData.assignedTo)
          const notification = await createNotificationWithSMS(
            {
              userId: validatedData.assignedTo,
              title: "Task Assigned to You",
              message: `Task "${task.title}" was assigned to you by ${session.user.name}`,
              type: "TASK_REASSIGNED",
              relatedTaskId: task.id
            },
            {
              title: task.title,
              userName: session.user.name
            }
          )
          console.log("✅ New assignee notification created:", notification.id)
        } else {
          console.log("⏭️ Skipping new assignee notification (same as current user)")
        }
        
        // Final check - let's see what notifications exist in the database
        const allNotifications = await db.notification.findMany({
          where: {
            relatedTaskId: task.id
          },
          orderBy: { createdAt: 'desc' }
        })
        console.log("🔍 All notifications for this task:", allNotifications)
      } catch (error) {
        console.error("❌ Failed to send reassignment notifications:", error)
        // Don't fail the update if notifications fail
      }
    } else {
      console.log("ℹ️ Not sending notifications - isReassigning:", isReassigning, "newAssignee:", !!newAssignee)
    }

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

    // Perform deletion with proper points calculation
    let pointsAdjustment = null

    // Handle points reversal for verified tasks (preserve audit trail)
    if (task.status === "VERIFIED" && task.assignedTo) {
      try {
        // Find the points history entry for this task to track the adjustment
        const pointsEntry = await db.pointsHistory.findFirst({
          where: {
            taskId: task.id,
            userId: task.assignedTo,
            points: { gt: 0 } // Positive points (earned)
          }
        })

        if (pointsEntry) {
          // First, create a reversal entry to cancel out the points
          await db.pointsHistory.create({
            data: {
              userId: task.assignedTo,
              familyId: task.familyId,
              points: -pointsEntry.points, // Negative to reverse the points
              reason: `Task deleted: ${task.title} (points reversed)`,
              createdBy: session.user.id
              // Note: No taskId, so this entry persists for audit trail
            }
          })
          
          // Then, update the original entry to remove task reference (preserve for audit)
          await db.pointsHistory.update({
            where: { id: pointsEntry.id },
            data: { 
              taskId: null,
              reason: `${pointsEntry.reason} (task deleted)`
            }
          })

          pointsAdjustment = {
            userId: task.assignedTo,
            pointsReversed: pointsEntry.points
          }
        }
      } catch (pointsError) {
        console.warn("Error handling points reversal:", pointsError)
        // Continue with deletion even if points reversal fails
      }
    }

    // Perform deletion with cascade handling (simpler approach)
    try {
      // Delete related data in order (respecting foreign key constraints)
      console.log(`Deleting task ${task.id}: ${task.title}`)
      
      // Step 1: Delete notifications related to this task
      const deletedNotifications = await db.notification.deleteMany({
        where: { relatedTaskId: task.id }
      })
      console.log(`Deleted ${deletedNotifications.count} notifications`)

      // Step 2: Delete task tag relations
      const deletedTagRelations = await db.taskTagRelation.deleteMany({
        where: { taskId: task.id }
      })
      console.log(`Deleted ${deletedTagRelations.count} tag relations`)

      // Step 3: Any remaining points history entries with this taskId should be removed
      // (Note: We already updated the main entry above to remove taskId)
      const deletedPointsHistory = await db.pointsHistory.deleteMany({
        where: { taskId: task.id }
      })
      console.log(`Deleted ${deletedPointsHistory.count} remaining points history entries`)

      // Step 4: Finally delete the task itself
      await db.task.delete({
        where: { id }
      })
      console.log(`Task ${task.id} deleted successfully`)

    } catch (deleteError) {
      console.error("Deletion failed:", deleteError)
      const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error occurred'
      throw new Error(`Failed to delete task: ${errorMessage}`)
    }

    const result = {
      task,
      pointsAdjustment
    }

    // Create notifications AFTER the transaction completes successfully
    // This prevents transaction rollback issues and handles edge cases better
    try {
      // Check if assignee still exists in the family before creating notification
      if (task.assignedTo && task.assignedTo !== session.user.id) {
        const assigneeMembership = await db.familyMember.findFirst({
          where: {
            userId: task.assignedTo,
            familyId: familyMembership.familyId
          }
        })

        // Only create notification if user is still in the family
        if (assigneeMembership) {
          try {
            await db.notification.create({
              data: {
                userId: task.assignedTo,
                title: "Task Deleted",
                message: `The task "${result.task.title}" has been deleted by ${session.user.name}`,
                type: "TASK_DELETED"
              }
            })
          } catch {
            // Fallback if TASK_DELETED enum doesn't exist yet
            console.warn("TASK_DELETED enum not available, using fallback notification type")
            await db.notification.create({
              data: {
                userId: task.assignedTo,
                title: "Task Deleted",
                message: `The task "${result.task.title}" has been deleted by ${session.user.name}`,
                type: "POINTS_DEDUCTED" // Temporary fallback
              }
            })
          }
        }
      }

      // Check if creator still exists in the family before creating notification
      if (task.createdBy && task.createdBy !== session.user.id && task.createdBy !== task.assignedTo) {
        const creatorMembership = await db.familyMember.findFirst({
          where: {
            userId: task.createdBy,
            familyId: familyMembership.familyId
          }
        })

        // Only create notification if user is still in the family
        if (creatorMembership) {
          try {
            await db.notification.create({
              data: {
                userId: task.createdBy,
                title: "Task Deleted",
                message: `The task "${result.task.title}" has been deleted by ${session.user.name}`,
                type: "TASK_DELETED"
              }
            })
          } catch {
            // Fallback if TASK_DELETED enum doesn't exist yet
            console.warn("TASK_DELETED enum not available, using fallback notification type")
            await db.notification.create({
              data: {
                userId: task.createdBy,
                title: "Task Deleted",
                message: `The task "${result.task.title}" has been deleted by ${session.user.name}`,
                type: "POINTS_DEDUCTED" // Temporary fallback
              }
            })
          }
        }
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the deletion
      console.warn("Failed to create deletion notifications:", notificationError)
    }

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