import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
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
      select: { dashboardStyle: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    // Default to STYLE2 for kids, STYLE1 for parents if no preference set
    const defaultStyle = session.user.role === "CHILD" ? "STYLE2" : "STYLE1"
    const dashboardStyle = user.dashboardStyle || defaultStyle

    return NextResponse.json({
      success: true,
      data: {
        dashboardStyle,
        role: user.role
      }
    })

  } catch (error) {
    console.error("Get dashboard style error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { dashboardStyle } = body

    // Validate dashboard style
    if (!dashboardStyle || !["STYLE1", "STYLE2"].includes(dashboardStyle)) {
      return NextResponse.json(
        { error: { code: "INVALID_STYLE", message: "Invalid dashboard style. Must be STYLE1 or STYLE2" } },
        { status: 400 }
      )
    }

    // Update user's dashboard preference
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { dashboardStyle },
      select: { dashboardStyle: true, role: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        dashboardStyle: updatedUser.dashboardStyle,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error("Update dashboard style error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}