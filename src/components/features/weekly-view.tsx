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
  } | null
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

  const getDateColor = (dueDate: string) => {
    const today = new Date()
    const taskDate = new Date(dueDate)
    today.setHours(0, 0, 0, 0)
    taskDate.setHours(0, 0, 0, 0)
    
    if (taskDate < today) {
      // Overdue - red
      return "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700"
    } else if (taskDate.getTime() === today.getTime()) {
      // Today - yellow
      return "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
    } else {
      // Future - white/default
      return "text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
                  <Link 
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className={`block p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer ${getDateColor(task.dueDate)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(task.status)}
                          <span className="font-medium text-sm truncate">
                            {task.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
                          <span>{task.assignee ? task.assignee.name : '💰 Bonus - Available to Claim'}</span>
                          <span>•</span>
                          <span>{task.points} pts</span>
                          <span>•</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
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