import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { registerSchema } from "@/lib/validations"
import { generateFamilyCode } from "@/lib/utils"
import { createNotificationWithSMS } from "@/lib/notification-helpers"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: { code: "USER_EXISTS", message: "User already exists" } },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    let family = null
    let familyRole = "CHILD"

    // Handle family logic
    if (validatedData.familyCode) {
      // Joining existing family
      family = await db.family.findUnique({
        where: { familyCode: validatedData.familyCode }
      })

      if (!family) {
        return NextResponse.json(
          { error: { code: "INVALID_FAMILY_CODE", message: "Invalid family code" } },
          { status: 400 }
        )
      }

      familyRole = validatedData.role === "PARENT" ? "PARENT" : "CHILD"
    } else if (validatedData.role === "PARENT" && validatedData.familyName) {
      // Creating new family
      const familyCode = generateFamilyCode()
      
      // Ensure family code is unique
      const existingFamily = await db.family.findUnique({
        where: { familyCode }
      })

      if (existingFamily) {
        // Generate new code if collision (very rare)
        return NextResponse.json(
          { error: { code: "SERVER_ERROR", message: "Please try again" } },
          { status: 500 }
        )
      }

      family = await db.family.create({
        data: {
          name: validatedData.familyName,
          familyCode
        }
      })

      familyRole = "ADMIN_PARENT"
    } else {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "Family code or family name required" } },
        { status: 400 }
      )
    }

    // Create user and family membership in transaction
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          passwordHash,
          role: validatedData.role
        }
      })

      const membership = await tx.familyMember.create({
        data: {
          userId: user.id,
          familyId: family!.id,
          role: familyRole as "ADMIN_PARENT" | "PARENT" | "CHILD"
        }
      })

      return { user, membership }
    })

    // Create onboarding notification for new admin parents
    if (familyRole === "ADMIN_PARENT") {
      try {
        await createNotificationWithSMS({
          userId: result.user.id,
          title: "🎉 Welcome to FamilyTasks!",
          message: `Hi ${result.user.name}! Your family "${family!.name}" is ready. Visit Settings to get your family code and invite family members to join.`,
          type: "FAMILY_SETUP_GUIDE"
        })
      } catch (error) {
        console.error("Failed to create onboarding notification:", error)
        // Don't fail registration if notification creation fails
      }
    }

    const { passwordHash: _, ...userWithoutPassword } = result.user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        family: family,
        familyRole: familyRole
      }
    })

  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input data" } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}