import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateFamilyCode } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Check if user is admin parent
    const membership = await db.familyMember.findFirst({
      where: {
        userId: session.user.id,
        role: "ADMIN_PARENT"
      },
      include: {
        family: true
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Only admin parents can regenerate family codes" } },
        { status: 403 }
      )
    }

    // Generate new unique family code
    let newFamilyCode = generateFamilyCode()
    let attempts = 0
    
    while (attempts < 5) {
      const existingFamily = await db.family.findUnique({
        where: { familyCode: newFamilyCode }
      })

      if (!existingFamily) {
        break
      }

      newFamilyCode = generateFamilyCode()
      attempts++
    }

    if (attempts >= 5) {
      return NextResponse.json(
        { error: { code: "SERVER_ERROR", message: "Unable to generate unique code" } },
        { status: 500 }
      )
    }

    // Update family with new code
    const updatedFamily = await db.family.update({
      where: { id: membership.familyId },
      data: { familyCode: newFamilyCode }
    })

    return NextResponse.json({
      success: true,
      data: {
        familyCode: updatedFamily.familyCode
      }
    })

  } catch (error) {
    console.error("Regenerate family code error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}