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

    // Get user's family membership to check role
    const currentUserMembership = await db.familyMember.findFirst({
      where: { userId: session.user.id }
    })

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // Determine if user is parent (can see phone numbers)
    const isParent = ["PARENT", "ADMIN_PARENT"].includes(currentUserMembership.role)

    // Get family with members, using different queries based on role
    let familyMember
    
    if (isParent) {
      // Parent query - includes phone numbers
      familyMember = await db.familyMember.findFirst({
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
                      createdAt: true,
                      phoneNumber: true
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
    } else {
      // Child query - no phone numbers
      familyMember = await db.familyMember.findFirst({
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
    }

    if (!familyMember) {
      return NextResponse.json(
        { error: { code: "FAMILY_NOT_FOUND", message: "No family found" } },
        { status: 404 }
      )
    }

    // DEBUG: Log what we're sending
    console.log('API Response for user:', session.user.email)
    console.log('Members being sent:', JSON.stringify(familyMember.family.members, null, 2))

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