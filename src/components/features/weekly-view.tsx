"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  points: number
  status: string
  dueDate: string
  assignee: {
    name: string
    id: string
  }
  creator?: {
    name: string
    id: string
  }
}

export function WeeklyView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks/weekly")
        if (res.ok) {
          const data = await res.json()
          if (data.success) setTasks(data.tasks || [])
        }
      } catch (error) {
        // Silent fail for production
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [])

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Icons.check className="h-3 w-3 text-green-500" />
      case "IN_PROGRESS":
        return <Icons.clock className="h-3 w-3 text-yellow-500" />
      case "PENDING_VERIFICATION":
        return <Icons.eye className="h-3 w-3 text-blue-500" />
      default:
        return <Icons.circle className="h-3 w-3 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
      case "IN_PROGRESS":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
      case "PENDING_VERIFICATION":
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    }
  }

  const handleTaskAction = async (taskId: string, action: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
      
      if (res.ok) {
        // Refresh tasks after action
        const fetchRes = await fetch("/api/tasks/weekly")
        const data = await fetchRes.json()
        if (data.success) setTasks(data.tasks)
      }
    } catch (error) {
      // Silent fail for production
    }
  }

  const groupedTasks = tasks.reduce((acc: any, task: Task) => {
    const dateKey = task.dueDate.split('T')[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(task)
    return acc
  }, {})

  if (loading) return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icons.calendar className="h-5 w-5" />
          <span>Next 7 Days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>Loading...</CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icons.calendar className="h-5 w-5" />
          <span>Next 7 Days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.keys(groupedTasks).sort().slice(0, 7).map(date => (
            <div key={date} className="border-l-2 border-gray-200 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                {getDateLabel(date)} ({groupedTasks[date].length} task{groupedTasks[date].length !== 1 ? 's' : ''})
              </h3>
              
              <div className="space-y-2">
                {groupedTasks[date].slice(0, 4).map((task: Task) => (
                  <div 
                    key={task.id} 
                    className={`p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer ${getStatusColor(task.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(task.status)}
                          <Link 
                            href={`/tasks/${task.id}`}
                            className="font-medium text-sm hover:underline truncate"
                          >
                            {task.title}
                          </Link>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                          <span>{task.assignee.name}</span>
                          <span>•</span>
                          <span>{task.points} pts</span>
                          <span>•</span>
                          <span className="capitalize">{task.status.replace('_', ' ').toLowerCase()}</span>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex items-center space-x-1 ml-2">
                        {task.status === "PENDING" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleTaskAction(task.id, "complete")
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                            title="Mark Complete"
                          >
                            <Icons.check className="h-3 w-3" />
                          </button>
                        )}
                        
                        {task.status === "PENDING_VERIFICATION" && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              handleTaskAction(task.id, "verify")
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Verify Task"
                          >
                            <Icons.eye className="h-3 w-3" />
                          </button>
                        )}
                        
                        <Link
                          href={`/tasks/${task.id}/edit`}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit Task"
                        >
                          <Icons.edit className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {groupedTasks[date].length > 4 && (
                  <Link 
                    href="/tasks"
                    className="block text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    +{groupedTasks[date].length - 4} more tasks
                  </Link>
                )}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedTasks).length === 0 && (
            <div className="text-center py-8">
              <Icons.calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No tasks in the next 7 days</p>
              <Link 
                href="/tasks/new"
                className="text-blue-600 hover:text-blue-800 text-sm hover:underline"
              >
                Create your first task
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}