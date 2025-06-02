import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendSMS } from "@/lib/sms"
import { z } from "zod"

const testSmsSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required")
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
    const { phoneNumber } = testSmsSchema.parse(body)

    // Debug logging
    console.log('Test SMS Request - Phone Number:', phoneNumber)
    console.log('Test SMS Request - Phone Number Length:', phoneNumber.length)
    console.log('Test SMS Request - Phone Number Type:', typeof phoneNumber)

    // Send test SMS
    const result = await sendSMS(
      phoneNumber,
      `Test SMS from FamilyTasks! Hi ${session.user.name}, your SMS notifications are working correctly. 🎉`
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to send SMS" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: "Test SMS sent successfully!",
      messageId: result.messageId
    })

  } catch (error) {
    console.error("Error sending test SMS:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to send test SMS" },
      { status: 500 }
    )
  }
}