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

    // Get recent notifications for the user
    const notifications = await db.notification.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        relatedTask: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    return NextResponse.json({
      success: true,
      data: notifications
    })

  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { notificationId, action } = await req.json()

    if (action === "clear_all") {
      // Mark all notifications as read for the user
      await db.notification.updateMany({
        where: { 
          userId: session.user.id,
          read: false
        },
        data: { read: true }
      })

      return NextResponse.json({
        success: true,
        data: { message: "All notifications marked as read" }
      })
    } else {
      // Mark single notification as read
      if (!notificationId) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Notification ID is required" } },
          { status: 400 }
        )
      }

      await db.notification.update({
        where: { 
          id: notificationId,
          userId: session.user.id // Ensure user can only update their own notifications
        },
        data: { read: true }
      })

      return NextResponse.json({
        success: true,
        data: { message: "Notification marked as read" }
      })
    }

  } catch (error) {
    console.error("Update notification error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { notificationId, action } = await req.json()

    if (action === "delete_all") {
      // Delete all notifications for the user
      await db.notification.deleteMany({
        where: { 
          userId: session.user.id
        }
      })

      return NextResponse.json({
        success: true,
        data: { message: "All notifications deleted" }
      })
    } else {
      // Delete single notification
      if (!notificationId) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Notification ID is required" } },
          { status: 400 }
        )
      }

      await db.notification.delete({
        where: { 
          id: notificationId,
          userId: session.user.id // Ensure user can only delete their own notifications
        }
      })

      return NextResponse.json({
        success: true,
        data: { message: "Notification deleted" }
      })
    }

  } catch (error) {
    console.error("Delete notification error:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}