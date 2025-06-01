"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

export function WeeklyView() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tasks/weekly")
        const data = await res.json()
        if (data.success) setTasks(data.tasks)
      } catch (error) {
        console.error("Error:", error)
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

  const groupedTasks = tasks.reduce((acc: any, task: any) => {
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
            <div key={date} className="border-l-2 border-gray-200 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {getDateLabel(date)} ({groupedTasks[date].length})
              </h3>
              {groupedTasks[date].slice(0, 3).map((task: any) => (
                <div key={task.id} className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  • {task.title} ({task.assignee.name})
                </div>
              ))}
              {groupedTasks[date].length > 3 && (
                <div className="text-xs text-gray-500">+{groupedTasks[date].length - 3} more</div>
              )}
            </div>
          ))}
          {Object.keys(groupedTasks).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">No tasks in the next 7 days</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}