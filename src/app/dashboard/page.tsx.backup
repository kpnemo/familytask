import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get family information including family code and all members
  const familyInfo = await db.familyMember.findFirst({
    where: { userId: session.user.id },
    include: {
      family: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true
                }
              }
            },
            orderBy: [
              { role: 'asc' }, // ADMIN_PARENT, PARENT, CHILD
              { joinedAt: 'asc' }
            ]
          }
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to FamilyTasks Dashboard!
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              🎉 Authentication is working!
            </h2>
            <p className="text-green-700">
              You have successfully logged in to the FamilyTasks application.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Information:</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {session.user.role}</p>
              <p><strong>Family Name:</strong> {familyInfo?.family.name || "Not assigned"}</p>
              <p><strong>Family Role:</strong> {session.user.familyRole || "Not assigned"}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-indigo-800 mb-4">
              🚀 Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <a
                href="/tasks"
                className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-indigo-900">View Tasks</h4>
                <p className="text-sm text-indigo-600">See all family tasks</p>
              </a>

              {session.user.role === "PARENT" && (
                <a
                  href="/tasks/new"
                  className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all text-center"
                >
                  <div className="text-2xl mb-2">➕</div>
                  <h4 className="font-semibold text-indigo-900">Create Task</h4>
                  <p className="text-sm text-indigo-600">Assign new tasks</p>
                </a>
              )}

              <a
                href="/points"
                className="bg-white rounded-lg p-4 border border-indigo-200 hover:border-indigo-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-2xl mb-2">⭐</div>
                <h4 className="font-semibold text-indigo-900">Points</h4>
                <p className="text-sm text-indigo-600">Track points & rewards</p>
              </a>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              🔔 Recent Notifications
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-yellow-600">Notifications temporarily disabled for debugging.</p>
            </div>
          </div>

          {familyInfo?.family && (
            <>
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  📋 Family Code (for inviting others):
                </h3>
                <div className="bg-white rounded-md p-3 border-2 border-dashed border-blue-300">
                  <p className="text-2xl font-mono font-bold text-center tracking-wider text-blue-700">
                    {familyInfo.family.familyCode}
                  </p>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Share this code with family members so they can join your family when registering.
                </p>
              </div>

              <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">
                  👨‍👩‍👧‍👦 Family Members ({familyInfo.family.members.length})
                </h3>
                <div className="space-y-3">
                  {familyInfo.family.members.map((member) => (
                    <div 
                      key={member.id} 
                      className={`bg-white rounded-lg p-3 border-l-4 ${
                        member.user.id === session.user.id 
                          ? 'border-l-green-500 bg-green-50' 
                          : 'border-l-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {member.user.name}
                              {member.user.id === session.user.id && (
                                <span className="text-sm text-green-600 font-normal"> (You)</span>
                              )}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.role === 'ADMIN_PARENT' 
                                ? 'bg-red-100 text-red-800'
                                : member.role === 'PARENT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {member.role === 'ADMIN_PARENT' ? '👑 Admin Parent' : 
                               member.role === 'PARENT' ? '👨‍👩‍ Parent' : 
                               '🧒 Child'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {member.user.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block w-3 h-3 rounded-full ${
                            member.user.role === 'PARENT' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`} title={member.user.role}></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Family Statistics:</strong>
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-purple-800">
                        {familyInfo.family.members.filter(m => m.role.includes('PARENT')).length}
                      </p>
                      <p className="text-xs text-purple-600">Parents</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-800">
                        {familyInfo.family.members.filter(m => m.role === 'CHILD').length}
                      </p>
                      <p className="text-xs text-purple-600">Children</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-800">
                        {familyInfo.family.members.length}
                      </p>
                      <p className="text-xs text-purple-600">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

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