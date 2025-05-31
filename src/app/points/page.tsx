import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/utils"

export default async function PointsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get user's family
  const familyMember = await db.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true }
  })

  if (!familyMember) {
    redirect("/dashboard")
  }

  // Get family members
  const familyMembers = await db.familyMember.findMany({
    where: { familyId: familyMember.familyId },
    include: {
      user: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  // Get total points for each family member
  const membersWithPoints = await Promise.all(
    familyMembers.map(async (member) => {
      const totalPoints = await db.pointsHistory.aggregate({
        where: { 
          userId: member.userId,
          points: { gt: 0 }
        },
        _sum: { points: true }
      })

      return {
        ...member,
        totalPoints: totalPoints._sum.points || 0
      }
    })
  )

  // Sort by total points descending
  membersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints)

  // Get recent points history for current user
  const recentHistory = await db.pointsHistory.findMany({
    where: { 
      userId: session.user.id,
      points: { gt: 0 }
    },
    include: {
      task: {
        select: { title: true }
      },
      creator: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  })

  // Get user's current total points
  const userTotalPoints = membersWithPoints.find(m => m.userId === session.user.id)?.totalPoints || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Points & Rewards</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Current Points */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Your Points
              </CardTitle>
              <CardDescription>
                Points earned from completed tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 mb-2">
                  {userTotalPoints}
                </div>
                <div className="text-gray-500">Total Points Earned</div>
              </div>
            </CardContent>
          </Card>

          {/* Family Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🥇 Family Leaderboard
              </CardTitle>
              <CardDescription>
                See how everyone is doing!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {membersWithPoints.map((member, index) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤"}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.user.name}
                          {member.userId === session.user.id && (
                            <span className="text-blue-600 ml-1">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {member.user.role.toLowerCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {member.totalPoints} pts
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Points History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📈 Recent Points History
              </CardTitle>
              <CardDescription>
                Your latest points earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎯</div>
                  <div>No points earned yet!</div>
                  <div className="text-sm">Complete some tasks to start earning points.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                      <div>
                        <div className="font-medium">
                          +{entry.points} points
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.reason}
                        </div>
                        {entry.creator && (
                          <div className="text-xs text-gray-500">
                            Awarded by {entry.creator.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {formatDateTime(new Date(entry.createdAt))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rewards Section - Placeholder for future implementation */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎁 Rewards Shop
              </CardTitle>
              <CardDescription>
                Spend your points on awesome rewards!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🚧</div>
                <div className="font-medium">Coming Soon!</div>
                <div className="text-sm">Parents can set up rewards that kids can redeem with their points.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}