// src/components/features/dashboard2-kid.tsx
"use client"

import { useState, useEffect } from "react"
import { TaskCard } from "./task-card"
import { BonusTaskCard } from "./bonus-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionUser } from "@/types"
import { Icons } from "@/components/ui/icons"
import { Task as FullTask } from "./task-card"
import Link from "next/link"
import { cn } from '@/lib/utils'

interface Task extends Pick<FullTask, 'id' | 'title' | 'dueDate' | 'points' | 'status' | 'assignee' | 'tags' | 'creator'> {}

interface Props {
  user: SessionUser
}

export default function Dashboard2Kid({ user }: Props) {
  const [weeklyTasks, setWeeklyTasks] = useState<Task[]>([])
  const [pendingTasks, setPendingTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [verifiedTasks, setVerifiedTasks] = useState<Task[]>([])
  const [bonusTasks, setBonusTasks] = useState<FullTask[]>([])
  const [loading, setLoading] = useState(true)
  // UI filter: overdue, upcoming, completed
  const [filter, setFilter] = useState<'ALL'|'OVERDUE'|'UPCOMING'|'COMPLETED'|'BONUS'>('ALL')
  
  // Calculate total task count for All filter
  const totalTasks = pendingTasks.length + completedTasks.length + verifiedTasks.length + bonusTasks.length

  const fetchData = async () => {
    try {
      const [weeklyRes, pendingRes, completedRes, verifiedRes, bonusRes] = await Promise.all([
        fetch("/api/tasks/weekly"),
        fetch("/api/tasks?status=PENDING"),
        fetch("/api/tasks?status=COMPLETED"),
        fetch("/api/tasks?status=VERIFIED"),
        fetch("/api/tasks?status=AVAILABLE")
      ])
      const weeklyData = await weeklyRes.json()
      const pendingData = await pendingRes.json()
      const completedData = await completedRes.json()
      const verifiedData = await verifiedRes.json()
      const bonusData = await bonusRes.json()
      if (weeklyData.success) setWeeklyTasks(weeklyData.tasks)
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

  const now = new Date()
  // Normalize to date-only for comparisons
  const todayStart = new Date(now.setHours(0,0,0,0))
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1)
  // Overdue: pending tasks due before today
  const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < todayStart)
  // Today's tasks: pending tasks due today
  const todayTasks = pendingTasks.filter(t => {
    const d = new Date(t.dueDate)
    return d >= todayStart && d < tomorrowStart
  })
  // Future tasks: pending tasks due after today
  const futureTasks = pendingTasks
    .filter(t => new Date(t.dueDate) >= tomorrowStart)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  // Determine upcoming display: if any today, show overdue + today; else first 5 future
  const upcomingTasks = todayTasks.length > 0
    ? [...overdueTasks, ...todayTasks]
    : futureTasks.slice(0, 5)
  const completedAll = [...completedTasks, ...verifiedTasks]

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
      {/* Filter bar (primary button style) */}
      <div className="flex space-x-3">
        {/* All */}
        <button
          onClick={() => setFilter('ALL')}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${filter === 'ALL' ? 'font-semibold' : ''}`}
        >
          <Icons.tasks className="h-4 w-4" />
          <span>All ({totalTasks})</span>
        </button>
        {/* Overdue */}
        <button
          onClick={() => setFilter('OVERDUE')}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${filter === 'OVERDUE' ? 'font-semibold' : ''}`}
        >
          <Icons.warning className="h-4 w-4" />
          <span>Overdue ({overdueTasks.length})</span>
        </button>
        {/* Next Up */}
        <button
          onClick={() => setFilter('UPCOMING')}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors ${filter === 'UPCOMING' ? 'font-semibold' : ''}`}
        >
          <Icons.clock className="h-4 w-4" />
          <span>Next Up ({upcomingTasks.length})</span>
        </button>
        {/* Completed */}
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${filter === 'COMPLETED' ? 'font-semibold' : ''}`}
        >
          <Icons.check className="h-4 w-4" />
          <span>Completed ({completedAll.length})</span>
        </button>
        {/* Bonus Tasks */}
        <button
          onClick={() => setFilter('BONUS')}
          className={`inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors ${filter === 'BONUS' ? 'font-semibold' : ''}`}
        >
          <span className="text-sm">💰</span>
          <span>Bonus ({bonusTasks.length})</span>
        </button>
      </div>
      {/* Link to full tasks page */}
      <div className="mt-2">
        <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
          View All Tasks
        </Link>
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
            <p className="text-gray-600 mt-2">No pending tasks—enjoy your free time!</p>
          ) : (
            <div className="mt-4 space-y-6">
              {Object.entries(
                upcomingTasks.reduce((acc, task) => {
                  const dateKey = task.dueDate.split('T')[0]
                  acc[dateKey] = acc[dateKey] || []
                  acc[dateKey].push(task)
                  return acc
                }, {} as Record<string, Task[]>)
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
      {(filter === 'ALL' || filter === 'COMPLETED') && (
        <div>
          <h2 className="text-lg font-semibold text-purple-700">Recently Completed</h2>
          {completedAll.length === 0 ? (
            <p className="text-gray-600 mt-2">No tasks completed yet.</p>
          ) : (
            <div className="grid gap-4 mt-2">
              {completedAll.slice(0, 5).map(task => (
                <TaskCard key={task.id} task={task} onUpdate={fetchData} />
              ))}
            </div>
          )}
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
