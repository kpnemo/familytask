"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { TaskCard } from "./task-card"
import { TaskFilters } from "./task-filters"
import { BonusTaskCard } from "./bonus-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  points: number
  dueDate: string
  status: "PENDING" | "AVAILABLE" | "COMPLETED" | "VERIFIED" | "OVERDUE"
  creator: { id: string; name: string; role: string }
  assignee?: { id: string; name: string; role: string }
  verifier?: { id: string; name: string; role: string }
  tags: Array<{ id: string; name: string; color: string }>
  completedAt?: string
  verifiedAt?: string
  updatedAt?: string
  createdAt?: string
  isBonusTask?: boolean
}

export function TaskList() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "",
    assignedTo: "",
    createdBy: ""
  })
  const [showMoreVerified, setShowMoreVerified] = useState(false)

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo)
      if (filters.createdBy) params.append("createdBy", filters.createdBy)

      const response = await fetch(`/api/tasks?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setTasks(result.data)
      } else {
        console.error("Failed to fetch tasks:", result.error)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filters])

  const handleTaskUpdate = () => {
    fetchTasks()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading tasks...</div>
      </div>
    )
  }

  // Group tasks by status
  const bonusTasks = tasks.filter(task => task.isBonusTask && task.status === "AVAILABLE")
  const pendingTasks = tasks.filter(task => task.status === "PENDING") // Include ALL pending tasks (regular + assigned bonus)
  const completedTasks = tasks.filter(task => task.status === "COMPLETED")
  
  // Filter verified tasks to last 30 days only
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const verifiedTasks = tasks.filter(task => {
    if (task.status !== "VERIFIED") return false
    // Use verifiedAt or updatedAt or createdAt for filtering
    const taskDate = new Date(task.verifiedAt || task.updatedAt || task.createdAt)
    return taskDate >= thirtyDaysAgo
  })
  
  const overdueTasks = tasks.filter(task => {
    const isOverdue = new Date(task.dueDate) < new Date() && task.status === "PENDING"
    return isOverdue
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TaskFilters filters={filters} onFiltersChange={setFilters} />

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{bonusTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed (Awaiting Verification)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Sections */}
      {bonusTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-700 mb-3">
            💰 Available Bonus Tasks ({bonusTasks.length})
          </h2>
          <div className="grid gap-4">
            {bonusTasks.map(task => (
              <BonusTaskCard 
                key={task.id} 
                task={task as any}
                onAssign={handleTaskUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {overdueTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-700 mb-3">
            🚨 Overdue Tasks ({overdueTasks.length})
          </h2>
          <div className="grid gap-4">
            {overdueTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleTaskUpdate}
                isOverdue={true}
              />
            ))}
          </div>
        </div>
      )}

      {pendingTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            📋 Pending Tasks ({pendingTasks.length})
          </h2>
          <div className="grid gap-4">
            {pendingTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-blue-700 mb-3">
            ✅ Completed (Awaiting Verification) ({completedTasks.length})
          </h2>
          <div className="grid gap-4">
            {completedTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onUpdate={handleTaskUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {verifiedTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-green-700">
              🎉 Verified Tasks ({verifiedTasks.length})
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</span>
          </div>
          <div className="grid gap-4">
            {verifiedTasks
              .slice(0, showMoreVerified ? verifiedTasks.length : 10)
              .map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdate={handleTaskUpdate}
                />
              ))}
          </div>
          {verifiedTasks.length > 10 && (
            <button
              onClick={() => setShowMoreVerified(!showMoreVerified)}
              className="mt-3 inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>{showMoreVerified ? `Show Less` : `Show More (${verifiedTasks.length - 10} more)`}</span>
              <Icons.chevronRight className={cn("h-3 w-3 transition-transform", showMoreVerified && "rotate-90")} />
            </button>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {session?.user.role === "PARENT" 
                ? "No tasks found. Create your first task to get started!"
                : "No tasks assigned to you yet."
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}