import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { newEmail, password } = await req.json()

    if (!newEmail || !password) {
      return NextResponse.json(
        { message: "New email and password are required" },
        { status: 400 }
      )
    }

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Check if new email is already in use
    const existingUser = await db.user.findUnique({
      where: { email: newEmail }
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      )
    }

    // Update email
    await db.user.update({
      where: { id: session.user.id },
      data: { email: newEmail }
    })

    return NextResponse.json({ message: "Email updated successfully" })
  } catch (error) {
    console.error("Error changing email:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}