"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

interface PointsHistoryEntry {
  id: string
  points: number
  reason: string
  createdAt: string
  createdBy: string
  taskTitle?: string | null
  balanceBefore: number
  balanceAfter: number
  isDeduction: boolean
}

interface PointsHistoryData {
  history: PointsHistoryEntry[]
  currentBalance: number
}

interface PointsHistoryProps {
  userId?: string
  isParent: boolean
  refreshTrigger: number
}

export function PointsHistory({ userId, isParent, refreshTrigger }: PointsHistoryProps) {
  const [historyData, setHistoryData] = useState<PointsHistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = userId 
        ? `/api/points/history?userId=${userId}`
        : "/api/points/history"

      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to fetch points history")
      }

      const result = await response.json()
      setHistoryData(result.data)
    } catch (error) {
      console.error("Error fetching points history:", error)
      setError(error instanceof Error ? error.message : "Failed to load history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [userId, refreshTrigger])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEntryIcon = (entry: PointsHistoryEntry) => {
    if (entry.isDeduction) {
      return <Icons.points className="h-4 w-4 text-red-500" />
    } else if (entry.taskTitle) {
      return <Icons.check className="h-4 w-4 text-green-500" />
    } else {
      return <Icons.points className="h-4 w-4 text-blue-500" />
    }
  }

  const getEntryColor = (entry: PointsHistoryEntry) => {
    if (entry.isDeduction) {
      return "text-red-600"
    } else {
      return "text-green-600"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Icons.circle className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2">Loading history...</span>
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
            📈 Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <Icons.warning className="w-8 h-8 mx-auto mb-2" />
            <div>{error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!historyData) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📈 Points History
        </CardTitle>
        <CardDescription>
          Complete transaction log with running balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {historyData.history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div className="font-medium">No points history yet</div>
            <div className="text-sm">Points transactions will appear here</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historyData.history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getEntryIcon(entry)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${getEntryColor(entry)}`}>
                        {entry.points > 0 ? "+" : ""}{entry.points} points
                      </span>
                      {entry.taskTitle && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Task
                        </span>
                      )}
                      {entry.isDeduction && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Reward Shop
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {entry.reason}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(entry.createdAt)} • By {entry.createdBy}
                    </div>
                    {isParent && (
                      <div className="text-xs text-gray-400 mt-1">
                        Balance: {entry.balanceBefore} → {entry.balanceAfter}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.balanceAfter} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    Balance
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}