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

    const familyMember = await db.familyMember.findFirst({
      where: { userId: session.user.id }
    })
    if (!familyMember) {
      return NextResponse.json({ error: "No family found" }, { status: 404 })
    }

    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)

    let where: any = {
      familyId: familyMember.familyId,
      dueDate: { gte: startDate, lte: endDate }
    }

    if (session.user.role === "CHILD") {
      // Kids see their assigned tasks + available bonus tasks
      where.OR = [
        { assignedTo: session.user.id, status: "PENDING" }, // Their assigned pending tasks
        { isBonusTask: true, status: "AVAILABLE" } // Available bonus tasks
      ]
    } else {
      // Parents see all family pending tasks + available bonus tasks
      where.OR = [
        { status: "PENDING" },
        { isBonusTask: true, status: "AVAILABLE" }
      ]
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({ success: true, tasks })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}