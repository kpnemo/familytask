import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function SimpleDashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome back, {session.user.name}!
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              🎉 Dashboard is working!
            </h2>
            <p className="text-green-700">
              You have successfully accessed the dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Actions:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="/tasks"
                className="bg-blue-50 rounded-lg p-4 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-blue-900">View Tasks</h4>
                <p className="text-sm text-blue-600">See all family tasks</p>
              </a>

              <a
                href="/points"
                className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">⭐</div>
                <h4 className="font-semibold text-yellow-900">Points</h4>
                <p className="text-sm text-yellow-600">Track points & rewards</p>
              </a>

              {session.user.role === "PARENT" && (
                <a
                  href="/tasks/new"
                  className="bg-green-50 rounded-lg p-4 border border-green-200 hover:border-green-300 hover:shadow-md transition-all text-center"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <h4 className="font-semibold text-green-900">Create Task</h4>
                  <p className="text-sm text-green-600">Assign new tasks</p>
                </a>
              )}
            </div>
          </div>

          <div className="mt-6">
            <a 
              href="/api/auth/signout" 
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}