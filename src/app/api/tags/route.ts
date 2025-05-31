import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTagSchema } from "@/lib/validations"

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

    const tags = await db.taskTag.findMany({
      where: { familyId: familyMember.familyId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: tags
    })

  } catch (error) {
    console.error("Get tags error:", error)
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

    // Only parents can create tags
    if (session.user.role !== "PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only parents can create tags" } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = createTagSchema.parse(body)

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

    // Check if tag name already exists in family
    const existingTag = await db.taskTag.findFirst({
      where: {
        name: validatedData.name,
        familyId: familyMember.familyId
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: { code: "TAG_EXISTS", message: "Tag name already exists" } },
        { status: 400 }
      )
    }

    const tag = await db.taskTag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        familyId: familyMember.familyId
      }
    })

    return NextResponse.json({
      success: true,
      data: tag
    })

  } catch (error) {
    console.error("Create tag error:", error)

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