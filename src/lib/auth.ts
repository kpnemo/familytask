import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"
import { createNotificationWithSMS } from "./notification-helpers"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            familyMemberships: {
              include: {
                family: true
              }
            }
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        // Check if this is the first login for an admin parent
        const isFirstLogin = !user.lastLoginAt
        const isAdminParent = user.familyMemberships[0]?.role === "ADMIN_PARENT"

        // Update last login time
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        // Create onboarding notification for first login of admin parent
        if (isFirstLogin && isAdminParent) {
          try {
            await createNotificationWithSMS({
              userId: user.id,
              title: "👋 Ready to invite your family?",
              message: "Visit Settings to find your family code and invite family members. They'll need this code to join your family and start earning points!",
              type: "FAMILY_SETUP_GUIDE"
            })
          } catch (error) {
            console.error("Failed to create first login notification:", error)
            // Don't fail login if notification creation fails
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.familyMemberships[0]?.familyId || null,
          familyRole: user.familyMemberships[0]?.role || null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.familyId = user.familyId
        token.familyRole = user.familyRole
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.familyId = token.familyId as string | null
        session.user.familyRole = token.familyRole as string | null
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after login
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`
      }
      return baseUrl
    }
  },
  pages: {
    signIn: "/login"
  }
}