import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTagSchema } from "@/lib/validations"

export async function PUT(
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

    // Only parents can update tags
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can update tags" } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = createTagSchema.parse(body)

    // Check if tag exists and belongs to user's family
    const tag = await db.taskTag.findFirst({
      where: {
        id: params.id,
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: { code: "TAG_NOT_FOUND", message: "Tag not found" } },
        { status: 404 }
      )
    }

    // Check if new name conflicts with existing tag (if name is being changed)
    if (validatedData.name !== tag.name) {
      const existingTag = await db.taskTag.findFirst({
        where: {
          name: validatedData.name,
          familyId: tag.familyId,
          id: { not: params.id }
        }
      })

      if (existingTag) {
        return NextResponse.json(
          { error: { code: "TAG_EXISTS", message: "Tag name already exists" } },
          { status: 400 }
        )
      }
    }

    const updatedTag = await db.taskTag.update({
      where: { id: params.id },
      data: {
        name: validatedData.name,
        color: validatedData.color
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedTag
    })

  } catch (error) {
    console.error("Update tag error:", error)

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

    // Only parents can delete tags
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can delete tags" } },
        { status: 403 }
      )
    }

    // Check if tag exists and belongs to user's family
    const tag = await db.taskTag.findFirst({
      where: {
        id: params.id,
        family: {
          members: {
            some: { userId: session.user.id }
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: { code: "TAG_NOT_FOUND", message: "Tag not found" } },
        { status: 404 }
      )
    }

    // Delete tag (cascade will handle relations)
    await db.taskTag.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: { message: "Tag deleted successfully" }
    })

  } catch (error) {
    console.error("Delete tag error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}