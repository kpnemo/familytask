import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTaskSchema } from "@/lib/validations"
import { createNotificationWithSMS } from "@/lib/notification-helpers"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

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

    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const assignedTo = url.searchParams.get("assignedTo")
    const createdBy = url.searchParams.get("createdBy")

    // Build filter conditions
    const where: any = {
      familyId: familyMember.familyId
    }

    if (status) {
      where.status = status
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    if (createdBy) {
      where.createdBy = createdBy
    }

    // Handle role-based filtering
    if (session.user.role === "CHILD") {
      if (status === "AVAILABLE") {
        // If filtering for available bonus tasks specifically
        where.isBonusTask = true
        where.status = "AVAILABLE"
      } else if (status) {
        // If filtering by other specific status, show only their assigned tasks with that status
        where.assignedTo = session.user.id
        where.status = status
      } else {
        // If no status filter, show their assigned tasks + available bonus tasks
        where.OR = [
          { assignedTo: session.user.id }, // Their assigned tasks (including assigned bonus tasks)
          { isBonusTask: true, status: "AVAILABLE" } // Available bonus tasks they can claim
        ]
      }
      // Remove assignedTo filter if we used OR condition
      if (where.OR) {
        delete where.assignedTo
      }
    } else {
      // Parents can see all family tasks including assigned bonus tasks
      // No additional filtering needed - they see everything in their family
    }

    const tasks = await db.task.findMany({
      where,
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
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Transform the response to flatten tag data
    const formattedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags.map(t => t.tag)
    }))

    return NextResponse.json({
      success: true,
      data: formattedTasks
    })

  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

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
    const validatedData = createTaskSchema.parse(body)

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

    // For bonus tasks, skip assignee validation
    if (!validatedData.isBonusTask) {
      // Verify assignee is in the same family
      const assigneeMember = await db.familyMember.findFirst({
        where: {
          userId: validatedData.assignedTo,
          familyId: familyMember.familyId
        }
      })

      if (!assigneeMember) {
        return NextResponse.json(
          { error: { code: "INVALID_ASSIGNEE", message: "Assignee not found in family" } },
          { status: 400 }
        )
      }
    }

    // Create task in transaction
    const result = await db.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          points: validatedData.points,
          dueDate: new Date(validatedData.dueDate + "T23:59:59.999Z"), // Set to end of day
          createdBy: session.user.id,
          assignedTo: validatedData.isBonusTask ? null : validatedData.assignedTo,
          familyId: familyMember.familyId,
          isRecurring: validatedData.isRecurring || false,
          recurrencePattern: validatedData.recurrencePattern,
          isBonusTask: validatedData.isBonusTask || false,
          status: validatedData.isBonusTask ? "AVAILABLE" : "PENDING"
        }
      })

      // Add tags if provided
      if (validatedData.tagIds && validatedData.tagIds.length > 0) {
        await tx.taskTagRelation.createMany({
          data: validatedData.tagIds.map(tagId => ({
            taskId: task.id,
            tagId
          }))
        })
      }

      return task
    })

    // Create notifications
    if (validatedData.isBonusTask) {
      // For bonus tasks, notify all family members
      const familyMembers = await db.familyMember.findMany({
        where: { familyId: familyMember.familyId },
        include: { user: true }
      })
      
      console.log(`Creating bonus task notifications for ${familyMembers.length} family members`)
      
      // Send notifications to all family members except the creator
      const notificationPromises = familyMembers
        .filter(member => member.userId !== session.user.id)
        .map(async (member) => {
          try {
            console.log(`Creating notification for user: ${member.userId} (${member.user.name})`)
            const notification = await createNotificationWithSMS(
              {
                userId: member.userId,
                title: "New Bonus Task Added",
                message: `New Bonus task added - ${validatedData.title} - ${validatedData.points} Points`,
                type: "TASK_ASSIGNED",
                relatedTaskId: result.id
              },
              {
                title: validatedData.title,
                points: validatedData.points,
                dueDate: validatedData.dueDate,
                isBonus: true
              }
            )
            console.log(`Successfully created notification ${notification.id} for user ${member.userId}`)
            return notification
          } catch (error) {
            console.error(`Failed to send bonus task notification to user ${member.userId}:`, error)
            return null
          }
        })
      
      // Wait for all notifications to be created
      const notifications = await Promise.allSettled(notificationPromises)
      const successful = notifications.filter(n => n.status === 'fulfilled' && n.value).length
      const failed = notifications.filter(n => n.status === 'rejected' || !n.value).length
      console.log(`Bonus task notifications: ${successful} successful, ${failed} failed`)
      
    } else if (validatedData.assignedTo !== session.user.id) {
      // Regular task assignment notification
      createNotificationWithSMS(
        {
          userId: validatedData.assignedTo,
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${validatedData.title}"`,
          type: "TASK_ASSIGNED",
          relatedTaskId: result.id
        },
        {
          title: validatedData.title,
          dueDate: validatedData.dueDate
        }
      ).catch(error => {
        console.error("Failed to send task assignment notification:", error)
      })
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error("Create task error:", error)

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