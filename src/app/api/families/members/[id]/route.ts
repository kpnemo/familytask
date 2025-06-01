import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const updateMemberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters")
})

export async function PATCH(
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

    const memberId = params.id
    const body = await req.json()
    const { name } = updateMemberSchema.parse(body)

    // Get the current user's family membership to check permissions
    const currentUserMembership = await db.familyMember.findFirst({
      where: { userId: session.user.id },
      include: { family: true }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // Check if user has permission to edit members (must be PARENT or ADMIN_PARENT)
    if (!["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      )
    }

    // Get the member to update and verify they're in the same family
    const memberToUpdate = await db.familyMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    })

    if (!memberToUpdate || memberToUpdate.familyId !== currentUserMembership.familyId) {
      return NextResponse.json(
        { error: { code: "MEMBER_NOT_FOUND", message: "Family member not found" } },
        { status: 404 }
      )
    }

    // Update the user's name
    const updatedUser = await db.user.update({
      where: { id: memberToUpdate.userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: memberToUpdate.id,
        role: memberToUpdate.role,
        joinedAt: memberToUpdate.joinedAt,
        user: updatedUser
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.errors[0].message } },
        { status: 400 }
      )
    }

    console.error("Update member error:", error)
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

    const memberId = params.id

    // Get the current user's family membership to check permissions
    const currentUserMembership = await db.familyMember.findFirst({
      where: { userId: session.user.id },
      include: { family: true }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // Check if user has permission to remove members (must be PARENT or ADMIN_PARENT)
    if (!["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 }
      )
    }

    // Get the member to remove and verify they're in the same family
    const memberToRemove = await db.familyMember.findUnique({
      where: { id: memberId },
      include: { user: true }
    })

    if (!memberToRemove || memberToRemove.familyId !== currentUserMembership.familyId) {
      return NextResponse.json(
        { error: { code: "MEMBER_NOT_FOUND", message: "Family member not found" } },
        { status: 404 }
      )
    }

    // Prevent removing yourself
    if (memberToRemove.userId === session.user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot remove yourself from family" } },
        { status: 403 }
      )
    }

    // Prevent removing the last admin if you're not an admin
    if (memberToRemove.role === "ADMIN_PARENT" && currentUserMembership.role !== "ADMIN_PARENT") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only admins can remove other admins" } },
        { status: 403 }
      )
    }

    // Remove the family member
    await db.familyMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({
      success: true,
      message: "Family member removed successfully"
    })

  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}