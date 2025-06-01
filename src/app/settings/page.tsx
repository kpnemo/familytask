import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { ChangeEmailModal } from "@/components/settings/change-email-modal"
import { ChangePasswordModal } from "@/components/settings/change-password-modal"
import { FamilyCodeSection } from "@/components/settings/family-code-section"
import { FamilyMembersWrapper } from "@/components/settings/family-members-wrapper"
import { AppHeader } from "@/components/layout/app-header"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get user's family information with all members
  const familyMembership = await db.familyMember.findFirst({
    where: { userId: session.user.id },
    include: {
      family: {
        select: {
          name: true,
          familyCode: true,
        },
      },
    },
  })

  // Get all family members if user has a family
  const familyMembers = familyMembership ? await db.familyMember.findMany({
    where: { familyId: familyMembership.familyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // Admin parents first, then parents, then children
      { joinedAt: 'asc' },
    ],
  }) : []

  const family = familyMembership?.family
  const userRole = familyMembership?.role

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="Settings" user={session.user} showBackButton={true} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Family Section */}
          {family && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icons.users className="h-5 w-5" />
                  <span>Family</span>
                </CardTitle>
                <CardDescription>Manage your family settings and invitation code</CardDescription>
              </CardHeader>
              <CardContent>
                <FamilyCodeSection 
                  familyName={family.name}
                  familyCode={family.familyCode}
                  userRole={userRole || "CHILD"}
                />
              </CardContent>
            </Card>
          )}

          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Icons.user className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{session.user.role}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <ChangeEmailModal currentEmail={session.user.email || ""}>
                  <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Icons.edit className="h-4 w-4" />
                    <span>Change Email</span>
                  </button>
                </ChangeEmailModal>
                <ChangePasswordModal>
                  <button className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    <Icons.key className="h-4 w-4" />
                    <span>Change Password</span>
                  </button>
                </ChangePasswordModal>
              </div>
            </CardContent>
          </Card>

          {/* Family Members Section */}
          {family && familyMembers.length > 0 && (
            <FamilyMembersWrapper
              initialMembers={familyMembers}
              userRole={userRole || "CHILD"}
            />
          )}

          {/* Back to Dashboard */}
          <div className="flex justify-center pt-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.chevronLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}