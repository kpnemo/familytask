import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AppHeader } from "@/components/layout/app-header"
import { PointsPageClient } from "@/components/points/points-page-client"

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

  const isParent = ["PARENT", "ADMIN_PARENT"].includes(familyMember.role)

  // Get family members
  const familyMembers = await db.familyMember.findMany({
    where: { familyId: familyMember.familyId },
    include: {
      user: {
        select: { id: true, name: true, role: true }
      }
    }
  })

  // Get total points for each family member (using sum of all points history)
  const membersWithPoints = await Promise.all(
    familyMembers.map(async (member) => {
      const pointsSum = await db.pointsHistory.aggregate({
        where: { 
          userId: member.userId,
          familyId: familyMember.familyId
        },
        _sum: { points: true }
      })

      return {
        ...member,
        totalPoints: pointsSum._sum.points || 0
      }
    })
  )

  // Sort by total points descending
  membersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints)

  // Get user's current total points
  const userTotalPoints = membersWithPoints.find(m => m.userId === session.user.id)?.totalPoints || 0

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="Points & Rewards" user={session.user} showBackButton={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PointsPageClient
          familyMembers={membersWithPoints}
          userTotalPoints={userTotalPoints}
          isParent={isParent}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  )
}