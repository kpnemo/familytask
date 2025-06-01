import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const count = await db.notification.count({
      where: { userId: session.user.id, read: false }
    })

    return NextResponse.json({ success: true, count })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}