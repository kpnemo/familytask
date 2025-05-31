import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTaskSchema } from "@/lib/validations"

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

    // Children can only see their own assigned tasks
    if (session.user.role === "CHILD") {
      where.assignedTo = session.user.id
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

    // Create task in transaction
    const result = await db.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          points: validatedData.points,
          dueDate: new Date(validatedData.dueDate + "T23:59:59.999Z"), // Set to end of day
          createdBy: session.user.id,
          assignedTo: validatedData.assignedTo,
          familyId: familyMember.familyId,
          isRecurring: validatedData.isRecurring || false,
          recurrencePattern: validatedData.recurrencePattern
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

      // Create notification for assignee (if not self-assigned)
      if (validatedData.assignedTo !== session.user.id) {
        await tx.notification.create({
          data: {
            userId: validatedData.assignedTo,
            title: "New Task Assigned",
            message: `You have been assigned a new task: "${validatedData.title}"`,
            type: "TASK_ASSIGNED",
            relatedTaskId: task.id
          }
        })
      }

      return task
    })

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