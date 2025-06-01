"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"

interface FamilyMember {
  userId: string
  user: {
    id: string
    name: string
    role: "PARENT" | "CHILD"
  }
  totalPoints: number
}

interface RewardShopProps {
  familyMembers: FamilyMember[]
  isParent: boolean
  onPointsDeducted: () => void
}

export function RewardShop({ familyMembers, isParent, onPointsDeducted }: RewardShopProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [points, setPoints] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Filter to only show kids for parents
  const eligibleMembers = familyMembers.filter(member => 
    member.user.role === "CHILD" && member.totalPoints > 0
  )

  const selectedMember = eligibleMembers.find(member => member.userId === selectedUserId)

  const handleDeductPoints = async () => {
    if (!selectedUserId || !points || !reason) return

    const pointsNum = parseInt(points)
    if (isNaN(pointsNum) || pointsNum <= 0) {
      alert("Please enter a valid positive number of points")
      return
    }

    if (!selectedMember || pointsNum > selectedMember.totalPoints) {
      alert(`${selectedMember?.user.name || "User"} only has ${selectedMember?.totalPoints || 0} points available`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/points/deduct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          points: pointsNum,
          reason: reason.trim()
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to deduct points")
      }

      // Reset form
      setSelectedUserId("")
      setPoints("")
      setReason("")
      
      // Notify parent component to refresh
      onPointsDeducted()

      alert("Points deducted successfully!")
    } catch (error) {
      console.error("Error deducting points:", error)
      alert(error instanceof Error ? error.message : "Failed to deduct points")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isParent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎁 Rewards Shop
          </CardTitle>
          <CardDescription>
            Spend your points on awesome rewards! Ask a parent to help you redeem points.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">🏪</div>
            <div className="font-medium">Ask a parent to set up rewards!</div>
            <div className="text-sm">Parents can deduct points when you get real-world rewards.</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎁 Rewards Shop
        </CardTitle>
        <CardDescription>
          Deduct points from kids when they redeem rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {eligibleMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🎯</div>
              <div className="font-medium">No kids with points found</div>
              <div className="text-sm">Kids need to earn points by completing tasks first.</div>
            </div>
          ) : (
            <>
              {/* Kid Selection */}
              <div>
                <Label htmlFor="kidSelect">Select Kid</Label>
                <select
                  id="kidSelect"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a kid...</option>
                  {eligibleMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name} ({member.totalPoints} points)
                    </option>
                  ))}
                </select>
              </div>

              {selectedMember && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{selectedMember.user.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Available Points</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedMember.totalPoints}
                    </div>
                  </div>
                </div>
              )}

              {/* Points to Deduct */}
              <div>
                <Label htmlFor="pointsInput">Points to Deduct</Label>
                <Input
                  id="pointsInput"
                  type="number"
                  min="1"
                  max={selectedMember?.totalPoints || 0}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points amount"
                  className="mt-1"
                />
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reasonInput">Reason / Reward Description</Label>
                <Input
                  id="reasonInput"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Movie tickets, Ice cream, Toy..."
                  className="mt-1"
                  maxLength={200}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleDeductPoints}
                disabled={!selectedUserId || !points || !reason || isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icons.points className="w-4 h-4 mr-2" />
                    Deduct {points || "0"} Points
                  </>
                )}
              </Button>

              {selectedMember && points && (
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {selectedMember.user.name} will have{" "}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {Math.max(0, selectedMember.totalPoints - (parseInt(points) || 0))} points
                  </span>{" "}
                  remaining
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}