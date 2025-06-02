"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BonusTaskCard } from "./bonus-task-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  description?: string
  points: number
  dueDate: string
  status: string
  creator: { id: string; name: string; role: string }
  assignee?: { id: string; name: string; role: string }
  tags: Array<{ id: string; name: string; color: string }>
  isBonusTask: boolean
}

export function BonusTasksWidget() {
  const [bonusTasks, setBonusTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBonusTasks = async () => {
    try {
      const response = await fetch("/api/tasks?status=AVAILABLE")
      const result = await response.json()

      if (result.success) {
        const availableBonusTasks = result.data.filter((task: Task) => 
          task.isBonusTask && task.status === "AVAILABLE"
        )
        setBonusTasks(availableBonusTasks)
      } else {
        console.error("Failed to fetch bonus tasks:", result.error)
      }
    } catch (error) {
      console.error("Error fetching bonus tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBonusTasks()
  }, [])

  const handleTaskAssigned = () => {
    fetchBonusTasks() // Refresh the list when a task is assigned
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Available Bonus Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Loading bonus tasks...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (bonusTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 Available Bonus Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">🎯</div>
            <div>No bonus tasks available right now.</div>
            <div className="text-sm mt-1">Check back later for new opportunities!</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Available Bonus Tasks
          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm font-medium">
            {bonusTasks.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bonusTasks.slice(0, 3).map(task => (
          <BonusTaskCard 
            key={task.id} 
            task={task as any}
            onAssign={handleTaskAssigned}
          />
        ))}
        
        {bonusTasks.length > 3 && (
          <div className="text-center pt-2">
            <Link 
              href="/tasks" 
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              View {bonusTasks.length - 3} more bonus tasks →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}