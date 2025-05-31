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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        familyMemberships: {
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
                        avatarUrl: true,
                        createdAt: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user || !user.familyMemberships.length) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    const membership = user.familyMemberships[0]
    const family = membership.family

    return NextResponse.json({
      success: true,
      data: {
        family: {
          id: family.id,
          name: family.name,
          familyCode: family.familyCode,
          createdAt: family.createdAt,
          updatedAt: family.updatedAt
        },
        members: family.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        userRole: membership.role
      }
    })

  } catch (error) {
    console.error("Get family error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}