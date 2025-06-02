import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const smsSettingsSchema = z.object({
  phoneNumber: z.string().nullable(),
  smsNotificationsEnabled: z.boolean()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = smsSettingsSchema.parse(body)

    // Update user's SMS settings
    await db.user.update({
      where: { id: session.user.id },
      data: {
        phoneNumber: validatedData.phoneNumber,
        smsNotificationsEnabled: validatedData.smsNotificationsEnabled
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "SMS settings updated successfully" 
    })

  } catch (error) {
    console.error("Error updating SMS settings:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid data format" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to update SMS settings" },
      { status: 500 }
    )
  }
}