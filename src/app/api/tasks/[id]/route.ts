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

    // Check if task exists and user can delete it
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

    // Only creator or parents can delete tasks
    if (task.createdBy !== session.user.id && session.user.role === "CHILD") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to delete this task" } },
        { status: 403 }
      )
    }

    // Delete task (cascade will handle relations)
    await db.task.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      data: { message: "Task deleted successfully" }
    })

  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}