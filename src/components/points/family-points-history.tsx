"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"

interface FamilyPointsEntry {
  id: string
  userId: string
  userName: string
  points: number
  reason: string
  createdAt: string
  createdBy: string
  taskTitle?: string
  isDeduction: boolean
}

interface MemberBalance {
  userId: string
  userName: string
  currentBalance: number
}

interface FamilyPointsHistoryProps {
  refreshTrigger?: number
}

export function FamilyPointsHistory({ refreshTrigger = 0 }: FamilyPointsHistoryProps) {
  const [history, setHistory] = useState<FamilyPointsEntry[]>([])
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFamilyHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/points/family-history')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to fetch family points history')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setHistory(data.data.history)
        setMemberBalances(data.data.memberBalances)
      } else {
        throw new Error(data.error || 'Failed to fetch family points history')
      }
    } catch (err) {
      console.error('Error fetching family points history:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilyHistory()
  }, [refreshTrigger])

  const formatPoints = (points: number) => {
    return points > 0 ? `+${points}` : `${points}`
  }

  const getPointsColor = (points: number) => {
    return points > 0 
      ? "text-green-600 dark:text-green-400" 
      : "text-red-600 dark:text-red-400"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Family Points History
          </CardTitle>
          <CardDescription>
            Complete log of all points changes for your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">Loading family history...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Family Points History
          </CardTitle>
          <CardDescription>
            Complete log of all points changes for your family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-red-500 dark:text-red-400">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Family Points History
        </CardTitle>
        <CardDescription>
          Complete log of all points changes for your family
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Balances Summary */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Current Balances</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {memberBalances.map((member) => (
              <div key={member.userId} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {member.userName}
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {member.currentBalance} pts
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Recent Activity</h4>
          
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No points history found for your family.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {entry.userName}
                      </span>
                      <span className={`font-bold ${getPointsColor(entry.points)}`}>
                        {formatPoints(entry.points)} pts
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {entry.reason}
                      {entry.taskTitle && (
                        <span className="text-blue-600 dark:text-blue-400 ml-1">
                          • {entry.taskTitle}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")} • by {entry.createdBy}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {entry.isDeduction ? (
                      <span className="text-red-600 dark:text-red-400 text-lg">💸</span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 text-lg">💰</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}