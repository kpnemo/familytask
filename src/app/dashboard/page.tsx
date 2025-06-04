import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { AppHeader } from "@/components/layout/app-header"
import { WeeklyView } from "@/components/features/weekly-view"
import { BonusTasksWidget } from "@/components/features/bonus-tasks-widget"
import Dashboard2Unified from "@/components/features/dashboard2-unified"
import CompactDashboard from "@/components/features/dashboard-compact"
import { KidsStyleDashboard } from "@/components/features/dashboard-kids-style"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get user's dashboard preference, with smart defaults
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { dashboardStyle: true, role: true }
  })

  // Default to STYLE2 for kids, STYLE1 for parents if no preference set
  const defaultStyle = session.user.role === "CHILD" ? "STYLE2" : "STYLE1"
  const dashboardStyle = user?.dashboardStyle || defaultStyle

  // Kids Style - Simple dashboard showing only today's tasks
  if (dashboardStyle === "KIDS_STYLE") {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
        <AppHeader title="FamilyTasks" user={session.user} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <KidsStyleDashboard user={session.user} />
        </main>
      </div>
    )
  }

  // Compact Style - mobile friendly single-line task view
  if (dashboardStyle === "COMPACT") {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
        <AppHeader title="FamilyTasks" user={session.user} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CompactDashboard user={session.user} />
        </main>
      </div>
    )
  }

  // Enhanced dashboard (STYLE2)
  if (dashboardStyle === "STYLE2") {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
        <AppHeader title="FamilyTasks" user={session.user} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard2Unified user={session.user} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="FamilyTasks" user={session.user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user.name?.split(' ')[0]}!
            </h2>
            <p className="text-gray-600">Here's your family task dashboard.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <Link href="/tasks" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Icons.tasks className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">View Tasks</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">See all family tasks</p>
                    </div>
                    <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
                  </Link>

                  {session.user.role === "PARENT" && (
                    <Link href="/tasks/new" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                        <Icons.plus className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">Create Task</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Assign new tasks</p>
                      </div>
                      <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
                    </Link>
                  )}

                  <Link href="/points" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg group-hover:bg-yellow-200 dark:group-hover:bg-yellow-900/50 transition-colors">
                      <Icons.points className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">Points & Rewards</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Track your progress</p>
                    </div>
                    <Icons.chevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Bonus Tasks Widget */}
            <BonusTasksWidget />

            {/* Weekly View */}
            <WeeklyView />
          </div>

          {/* Sign Out */}
          <div className="flex justify-center pt-8">
            <Link 
              href="/api/auth/signout" 
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.logout className="h-4 w-4" />
              <span>Sign Out</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}