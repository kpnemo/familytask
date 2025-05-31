import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">FamilyTasks</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/settings" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Icons.settings className="h-5 w-5" />
              </Link>
              
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                    {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/tasks" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Icons.tasks className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">View Tasks</h3>
                    <p className="text-sm text-gray-500">See all family tasks</p>
                  </div>
                  <Icons.chevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>

                {session.user.role === "PARENT" && (
                  <Link href="/tasks/new" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Icons.plus className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Create Task</h3>
                      <p className="text-sm text-gray-500">Assign new tasks</p>
                    </div>
                    <Icons.chevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                  </Link>
                )}

                <Link href="/points" className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group">
                  <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                    <Icons.points className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Points & Rewards</h3>
                    <p className="text-sm text-gray-500">Track your progress</p>
                  </div>
                  <Icons.chevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              </div>
            </CardContent>
          </Card>

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