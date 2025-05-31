import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
      where: { userId: session.user.id },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                  }
                }
              },
              orderBy: [
                { role: 'asc' }, // ADMIN_PARENT, PARENT, CHILD
                { joinedAt: 'asc' }
              ]
            }
          }
        }
      }
    })

    if (!familyMember) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: familyMember.family.members
    })

  } catch (error) {
    console.error("Get family members error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}