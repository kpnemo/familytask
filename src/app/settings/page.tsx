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
import { AppearanceSection } from "@/components/settings/appearance-section"
import { DashboardStyleSection } from "@/components/settings/dashboard-style-section"
import { SMSSettingsSection } from "@/components/settings/sms-settings-section"
import { TimezoneSection } from "@/components/settings/timezone-section"
import { AppHeader } from "@/components/layout/app-header"

interface SettingsPageProps {
  searchParams?: { showOnboarding?: string }
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await getServerSession(authOptions)
  const showOnboarding = searchParams?.showOnboarding === 'true'

  if (!session) {
    redirect("/login")
  }

  // Get user's data including SMS settings (conditional for backwards compatibility)
  let userData = null;
  try {
    userData = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        phoneNumber: true,
        smsNotificationsEnabled: true,
        // @ts-ignore: timezone column may not exist in TS defs
        timezone: true,
      },
    });
  } catch (error) {
    // SMS columns don't exist yet in production, ignore for now
    console.log('SMS columns not available yet, skipping SMS settings');
    userData = { phoneNumber: null, smsNotificationsEnabled: false, timezone: "UTC" };
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
  const isParent = familyMembership && ["PARENT", "ADMIN_PARENT"].includes(familyMembership.role)
  
  let familyMembers: any[] = []
  
  if (familyMembership) {
    if (isParent) {
      // Parent query - includes phone numbers
      familyMembers = await db.familyMember.findMany({
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
              phoneNumber: true
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // Admin parents first, then parents, then children
          { joinedAt: 'asc' },
        ],
      })
    } else {
      // Child query - no phone numbers
      familyMembers = await db.familyMember.findMany({
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
      })
    }
  }

  const family = familyMembership?.family
  const userRole = familyMembership?.role

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="Settings" user={session.user} showBackButton={true} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Onboarding banner shown on first settings visit */}
          {showOnboarding && (
            <div className="p-4 mb-6 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h3 className="text-lg font-bold text-blue-700">Welcome to FamilyTasks!</h3>
              <p className="mt-2 text-sm text-blue-800">To get started, please complete the following:</p>
              <ul className="list-disc list-inside mt-2 text-sm text-blue-800 space-y-1">
                <li>
                  <a href="#dashboard-style" className="text-blue-600 hover:underline">
                    Select your preferred dashboard style.
                  </a>
                </li>
                <li>
                  <a href="#sms-settings" className="text-blue-600 hover:underline">
                    Update your phone number and enable SMS notifications.
                  </a>
                </li>
                <li>
                  <a href="#timezone-settings" className="text-blue-600 hover:underline">
                    Set your correct timezone.
                  </a>
                </li>
              </ul>
            </div>
          )}

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

          {/* Appearance Section */}
          <AppearanceSection />

          {/* Dashboard Style Section */}
          <div id="dashboard-style">
            <DashboardStyleSection />
          </div>

          {/* Timezone Section */}
          {userData && (
            <div id="timezone-settings">
              <TimezoneSection 
                user={{
                  id: session.user.id,
                  name: session.user.name || "",
                  email: session.user.email || "",
                  timezone: ((userData as any).timezone as string) || "UTC"
                }}
              />
            </div>
          )}

          {/* SMS Settings Section - Only show if SMS columns exist */}
          {userData && typeof userData.phoneNumber !== 'undefined' && (
            <div id="sms-settings">
              <SMSSettingsSection 
                initialPhoneNumber={userData?.phoneNumber || undefined}
                initialSmsEnabled={userData?.smsNotificationsEnabled || false}
              />
            </div>
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