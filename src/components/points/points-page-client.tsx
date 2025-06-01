"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RewardShop } from "./reward-shop"
import { PointsHistory } from "./points-history"

interface FamilyMember {
  userId: string
  user: {
    id: string
    name: string
    role: "PARENT" | "CHILD"
  }
  totalPoints: number
}

interface PointsPageClientProps {
  familyMembers: FamilyMember[]
  userTotalPoints: number
  isParent: boolean
  currentUserId: string
}

export function PointsPageClient({ 
  familyMembers, 
  userTotalPoints, 
  isParent, 
  currentUserId 
}: PointsPageClientProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePointsDeducted = () => {
    setRefreshTrigger(prev => prev + 1)
    // Force a page refresh to update the leaderboard with new balances
    window.location.reload()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Current Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Your Points
          </CardTitle>
          <CardDescription>
            Current points balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">
              {userTotalPoints}
            </div>
            <div className="text-gray-500">Current Balance</div>
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
            {familyMembers.map((member, index) => (
              <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤"}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.user.name}
                      {member.userId === currentUserId && (
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

      {/* Reward Shop */}
      <div className="lg:col-span-2">
        <RewardShop
          familyMembers={familyMembers}
          isParent={isParent}
          onPointsDeducted={handlePointsDeducted}
        />
      </div>

      {/* Points History */}
      <div className="lg:col-span-2">
        <PointsHistory
          isParent={isParent}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  )
}