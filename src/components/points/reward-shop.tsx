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
  const [action, setAction] = useState<'deduct' | 'add'>('deduct')
  const [isLoading, setIsLoading] = useState(false)

  // Show all family members for both add and deduct actions
  const eligibleMembers = familyMembers

  const selectedMember = eligibleMembers.find(member => member.userId === selectedUserId)

  const handlePointsAction = async () => {
    if (!selectedUserId || !points || !reason) return

    const pointsNum = parseInt(points)
    if (isNaN(pointsNum) || pointsNum <= 0) {
      alert("Please enter a valid positive number of points")
      return
    }

    // Only check balance for deductions
    if (action === 'deduct' && (!selectedMember || pointsNum > selectedMember.totalPoints)) {
      alert(`${selectedMember?.user.name || "User"} only has ${selectedMember?.totalPoints || 0} points available`)
      return
    }

    setIsLoading(true)
    try {
      const endpoint = action === 'deduct' ? "/api/points/deduct" : "/api/points/add"
      const response = await fetch(endpoint, {
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
        throw new Error(error.error?.message || `Failed to ${action} points`)
      }

      // Reset form
      setSelectedUserId("")
      setPoints("")
      setReason("")
      
      // Notify parent component to refresh
      onPointsDeducted()

      alert(`Points ${action === 'deduct' ? 'deducted' : 'added'} successfully!`)
    } catch (error) {
      console.error(`Error ${action}ing points:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} points`)
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
          🎁 Points Manager
        </CardTitle>
        <CardDescription>
          Add bonus points or deduct points when kids redeem rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action Selection */}
          <div>
            <Label htmlFor="actionSelect">Action</Label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setAction('add')
                  setSelectedUserId("")  // Reset selection when switching
                }}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  action === 'add'
                    ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">💰</span>
                Add Points
              </button>
              <button
                type="button"
                onClick={() => {
                  setAction('deduct')
                  setSelectedUserId("")  // Reset selection when switching
                }}
                className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  action === 'deduct'
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">🎁</span>
                Deduct Points
              </button>
            </div>
          </div>

          {eligibleMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">{action === 'add' ? '💰' : '🎯'}</div>
              <div className="font-medium">
                {action === 'add' ? 'No family members found' : 'No family members with points found'}
              </div>
              <div className="text-sm">
                {action === 'add' 
                  ? 'Add family members to give them bonus points.' 
                  : 'Family members need to earn points by completing tasks first.'
                }
              </div>
            </div>
          ) : (
            <>
              {/* Family Member Selection */}
              <div>
                <Label htmlFor="memberSelect">Select Family Member</Label>
                <select
                  id="memberSelect"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a family member...</option>
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

              {/* Points Amount */}
              <div>
                <Label htmlFor="pointsInput">
                  Points to {action === 'add' ? 'Add' : 'Deduct'}
                </Label>
                <Input
                  id="pointsInput"
                  type="number"
                  min="1"
                  max={action === 'deduct' ? (selectedMember?.totalPoints || 0) : undefined}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Enter points amount"
                  className="mt-1"
                />
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reasonInput">
                  {action === 'add' ? 'Bonus Reason' : 'Reason / Reward Description'}
                </Label>
                <Input
                  id="reasonInput"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === 'add' 
                      ? "e.g., Extra chores, Good behavior, Birthday..." 
                      : "e.g., Movie tickets, Ice cream, Toy..."
                  }
                  className="mt-1"
                  maxLength={200}
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handlePointsAction}
                disabled={!selectedUserId || !points || !reason || isLoading}
                className={`w-full text-white ${
                  action === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">{action === 'add' ? '💰' : '🎁'}</span>
                    {action === 'add' ? 'Add' : 'Deduct'} {points || "0"} Points
                  </>
                )}
              </Button>

              {selectedMember && points && (
                <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {selectedMember.user.name} will have{" "}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {action === 'add'
                      ? selectedMember.totalPoints + (parseInt(points) || 0)
                      : Math.max(0, selectedMember.totalPoints - (parseInt(points) || 0))
                    } points
                  </span>{" "}
                  {action === 'add' ? 'total' : 'remaining'}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}