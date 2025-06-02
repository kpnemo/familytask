// src/components/features/dashboard2-parent.tsx
"use client"

import { useState, useEffect } from "react"
import { TaskCard, Task as FullTask } from "./task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SessionUser } from "@/types"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface Props {
  user: SessionUser
}

export default function Dashboard2Parent({ user }: Props) {
  const [tasks, setTasks] = useState<FullTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL'|'OVERDUE'|'TODAY'|'UPCOMING'>('ALL')

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks?status=PENDING")
        const result = await res.json()
        if (result.success) setTasks(result.data)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0))
  const endOfToday = new Date(today.setHours(23, 59, 59, 999))
  const inSevenDays = new Date()
  inSevenDays.setDate(startOfToday.getDate() + 7)

  const overdue = tasks.filter(t => new Date(t.dueDate) < startOfToday)
  const dueToday = tasks.filter(t => {
    const d = new Date(t.dueDate)
    return d >= startOfToday && d <= endOfToday
  })
  const upcoming = tasks.filter(t => {
    const d = new Date(t.dueDate)
    return d > endOfToday && d <= inSevenDays
  })

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
  // Calculate days left
  const getDaysLeft = (dateString: string) => {
    const target = new Date(dateString)
    const today = new Date()
    today.setHours(0,0,0,0)
    target.setHours(0,0,0,0)
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }
  // Group upcoming tasks by date
  const groupedUpcoming = upcoming.reduce((acc, task) => {
    const dateKey = task.dueDate.split('T')[0]
    acc[dateKey] = acc[dateKey] || []
    acc[dateKey].push(task)
    return acc
  }, {} as Record<string, FullTask[]>)

  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Due Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{dueToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcoming.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex space-x-3">
        <button
          onClick={() => setFilter('ALL')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", filter === 'ALL' && "font-semibold")}
        >
          <Icons.tasks className="h-4 w-4" />
          <span>All ({tasks.length})</span>
        </button>
        <button
          onClick={() => setFilter('OVERDUE')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", filter === 'OVERDUE' && "font-semibold")}
        >
          <Icons.warning className="h-4 w-4" />
          <span>Overdue ({overdue.length})</span>
        </button>
        <button
          onClick={() => setFilter('TODAY')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors", filter === 'TODAY' && "font-semibold")}
        >
          <Icons.calendar className="h-4 w-4" />
          <span>Today ({dueToday.length})</span>
        </button>
        <button
          onClick={() => setFilter('UPCOMING')}
          className={cn("inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", filter === 'UPCOMING' && "font-semibold")}
        >
          <Icons.clock className="h-4 w-4" />
          <span>Next 7 Days ({upcoming.length})</span>
        </button>
      </div>

      {/* Task Sections (filtered) */}
      {(filter === 'ALL' || filter === 'OVERDUE') && overdue.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-700">Overdue Tasks ({overdue.length})</h2>
          <div className="grid gap-4 mt-2">
            {overdue.map(task => (
              <TaskCard key={task.id} task={task} isOverdue onUpdate={() => {}} />
            ))}
          </div>
        </div>
      )}
      {(filter === 'ALL' || filter === 'TODAY') && dueToday.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-yellow-700">Due Today ({dueToday.length})</h2>
          <div className="grid gap-4 mt-2">
            {dueToday.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={() => {}} />
            ))}
          </div>
        </div>
      )}
      {(filter === 'ALL' || filter === 'UPCOMING') && upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-blue-700">Upcoming Tasks</h2>
          <div className="mt-4 space-y-6">
            {Object.entries(groupedUpcoming).map(([date, tasks]) => {
              const daysLeft = getDaysLeft(date)
              const daysText =
                daysLeft > 1
                  ? `in ${daysLeft} days`
                  : daysLeft === 1
                  ? `in 1 day`
                  : daysLeft === 0
                  ? `Today`
                  : `overdue`
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
                      <TaskCard key={task.id} task={task} onUpdate={() => {}} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
