// src/components/features/dashboard2-parent.tsx
"use client"

import { useState, useEffect } from "react"
import { TaskCard, Task as FullTask } from "./task-card"
import { BonusTaskCard } from "./bonus-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionUser } from "@/types"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface Props {
  user: SessionUser
}

export default function Dashboard2Parent({ user }: Props) {
  const [pendingTasks, setPendingTasks] = useState<FullTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<FullTask[]>([])
  const [verifiedTasks, setVerifiedTasks] = useState<FullTask[]>([])
  const [bonusTasks, setBonusTasks] = useState<FullTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL'|'OVERDUE'|'UPCOMING'|'COMPLETED'|'VERIFIED'|'BONUS'>('ALL')
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)

  const fetchData = async () => {
    try {
      const [pendingRes, completedRes, verifiedRes, bonusRes] = await Promise.all([
        fetch("/api/tasks?status=PENDING"),
        fetch("/api/tasks?status=COMPLETED"),
        fetch("/api/tasks?status=VERIFIED"),
        fetch("/api/tasks?status=AVAILABLE")
      ])
      const pendingData = await pendingRes.json()
      const completedData = await completedRes.json()
      const verifiedData = await verifiedRes.json()
      const bonusData = await bonusRes.json()
      if (pendingData.success) setPendingTasks(pendingData.data)
      if (completedData.success) setCompletedTasks(completedData.data)
      if (verifiedData.success) setVerifiedTasks(verifiedData.data)
      if (bonusData.success) {
        // Filter only bonus tasks that are actually available
        const availableBonusTasks = bonusData.data.filter((task: FullTask) => 
          task.isBonusTask && task.status === "AVAILABLE"
        )
        setBonusTasks(availableBonusTasks)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Apply "My Tasks Only" filter if enabled
  const filteredPendingTasks = showMyTasksOnly 
    ? pendingTasks.filter(task => task.assignedTo === user.id)
    : pendingTasks
  const filteredCompletedTasks = showMyTasksOnly 
    ? completedTasks.filter(task => task.assignedTo === user.id)
    : completedTasks
  const filteredVerifiedTasks = showMyTasksOnly 
    ? verifiedTasks.filter(task => task.assignedTo === user.id)
    : verifiedTasks

  const now = new Date()
  const todayStart = new Date(now.setHours(0,0,0,0))
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1)

  // Overdue: pending tasks due before today
  const overdueTasks = filteredPendingTasks.filter(t => new Date(t.dueDate) < todayStart)
  // Today's tasks: pending tasks due today
  const todayTasks = filteredPendingTasks.filter(t => {
    const d = new Date(t.dueDate)
    return d >= todayStart && d < tomorrowStart
  })
  // Future tasks: pending tasks due after today
  const futureTasks = filteredPendingTasks
    .filter(t => new Date(t.dueDate) >= tomorrowStart)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  
  // Determine upcoming display: if any today, show overdue + today; else first 5 future
  const upcomingTasks = todayTasks.length > 0
    ? [...overdueTasks, ...todayTasks]
    : futureTasks.slice(0, 5)

  // All completed (both COMPLETED and VERIFIED statuses)
  const completedAll = [...filteredCompletedTasks, ...filteredVerifiedTasks]
  
  // Calculate total tasks for "All" filter
  const totalTasks = filteredPendingTasks.length + filteredCompletedTasks.length + filteredVerifiedTasks.length + bonusTasks.length

  // Helper to label dates
  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Calculate days left from today
  const getDaysLeft = (dateString: string) => {
    const target = new Date(dateString)
    const today = new Date()
    // normalize
    today.setHours(0,0,0,0)
    target.setHours(0,0,0,0)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        {/* All */}
        <button
          onClick={() => setFilter('ALL')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", filter === 'ALL' && "font-semibold")}
        >
          <Icons.tasks className="h-4 w-4" />
          <span>All ({totalTasks})</span>
        </button>
        {/* Overdue */}
        <button
          onClick={() => setFilter('OVERDUE')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", filter === 'OVERDUE' && "font-semibold")}
        >
          <Icons.warning className="h-4 w-4" />
          <span>Overdue ({overdueTasks.length})</span>
        </button>
        {/* Next Up */}
        <button
          onClick={() => setFilter('UPCOMING')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors", filter === 'UPCOMING' && "font-semibold")}
        >
          <Icons.clock className="h-4 w-4" />
          <span>Next Up ({upcomingTasks.length})</span>
        </button>
        {/* Completed (Awaiting Verification) */}
        <button
          onClick={() => setFilter('COMPLETED')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors", filter === 'COMPLETED' && "font-semibold")}
        >
          <Icons.eye className="h-4 w-4" />
          <span>Awaiting Verification ({filteredCompletedTasks.length})</span>
        </button>
        {/* Verified */}
        <button
          onClick={() => setFilter('VERIFIED')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", filter === 'VERIFIED' && "font-semibold")}
        >
          <Icons.check className="h-4 w-4" />
          <span>Verified ({filteredVerifiedTasks.length})</span>
        </button>
        {/* Bonus Tasks */}
        <button
          onClick={() => setFilter('BONUS')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors", filter === 'BONUS' && "font-semibold")}
        >
          <span className="text-sm">💰</span>
          <span>Bonus ({bonusTasks.length})</span>
        </button>
      </div>

      {/* My Tasks Only Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
          className={cn(
            "inline-flex items-center space-x-2 px-3 py-1 text-sm rounded-md transition-colors",
            showMyTasksOnly 
              ? "bg-blue-100 text-blue-700 border border-blue-200" 
              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
          )}
        >
          <Icons.user className="h-3 w-3" />
          <span>My Tasks Only</span>
          {showMyTasksOnly && <Icons.check className="h-3 w-3" />}
        </button>
        <span className="text-sm text-gray-500">
          {showMyTasksOnly ? `Showing ${totalTasks} of ${pendingTasks.length + completedTasks.length + verifiedTasks.length} tasks` : `Showing all ${pendingTasks.length + completedTasks.length + verifiedTasks.length} family tasks`}
        </span>
      </div>

      {/* Sections (filtered) */}
      {/* Bonus Tasks - Always show at top when available */}
      {(filter === 'ALL' || filter === 'BONUS') && bonusTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-700">💰 Available Bonus Tasks ({bonusTasks.length})</h2>
          <div className="grid gap-4 mt-2">
            {bonusTasks.map(task => (
              <BonusTaskCard key={task.id} task={task as any} onAssign={fetchData} />
            ))}
          </div>
        </div>
      )}

      {filter !== 'UPCOMING' && (filter === 'ALL' || filter === 'OVERDUE') && overdueTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-700">🚨 Overdue Tasks ({overdueTasks.length})</h2>
          <div className="grid gap-4 mt-2">
            {overdueTasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={fetchData} isOverdue />
            ))}
          </div>
        </div>
      )}

      {(filter === 'ALL' || filter === 'UPCOMING') && (
        <div>
          <h2 className="text-lg font-semibold text-green-700">Next Up</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-gray-600 mt-2">No pending tasks—great job staying on top of everything!</p>
          ) : (
            <div className="mt-4 space-y-6">
              {Object.entries(
                upcomingTasks.reduce((acc, task) => {
                  const dateKey = task.dueDate.split('T')[0]
                  acc[dateKey] = acc[dateKey] || []
                  acc[dateKey].push(task)
                  return acc
                }, {} as Record<string, FullTask[]>)
              ).map(([date, tasks]) => {
                const daysLeft = getDaysLeft(date)
                const daysText =
                  daysLeft > 1 ? `in ${daysLeft} days` : daysLeft === 1 ? `in 1 day` : daysLeft === 0 ? `Today` : `overdue`
                return (
                  <div key={date} className="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-medium text-gray-800 dark:text-gray-200">
                        {getDateLabel(date)} ({tasks.length})
                      </h3>
                      <span
                        className={cn(
                          "text-sm",
                          daysLeft === 1 ? "text-red-600 font-bold" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {daysText}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {tasks.map(task => (
                        <TaskCard key={task.id} task={task} onUpdate={fetchData} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {(filter === 'ALL' || filter === 'COMPLETED') && filteredCompletedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-orange-700">Awaiting Verification ({filteredCompletedTasks.length})</h2>
          <div className="grid gap-4 mt-2">
            {filteredCompletedTasks.slice(0, 10).map(task => (
              <TaskCard key={task.id} task={task} onUpdate={fetchData} />
            ))}
          </div>
        </div>
      )}

      {(filter === 'ALL' || filter === 'VERIFIED') && filteredVerifiedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-green-700">Recently Verified ({filteredVerifiedTasks.length})</h2>
          <div className="grid gap-4 mt-2">
            {filteredVerifiedTasks.slice(0, 10).map(task => (
              <TaskCard key={task.id} task={task} onUpdate={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Show message when filtering for bonus tasks but none available */}
      {filter === 'BONUS' && bonusTasks.length === 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-700">💰 Available Bonus Tasks</h2>
          <p className="text-gray-600 mt-2">No bonus tasks available right now. Check back later!</p>
        </div>
      )}
    </div>
  )
}
