"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { formatDate } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description?: string
  points: number
  dueDate: string
  status: "PENDING" | "COMPLETED" | "VERIFIED" | "OVERDUE" | "AVAILABLE"
  dueDateOnly?: boolean
  isBonusTask?: boolean
  assignedTo?: string | null
  tags: Array<{ id: string; name: string; color: string }>
}

interface User {
  id: string
  name: string
  role: string
}

interface KidsStyleDashboardProps {
  user: User
}

export function KidsStyleDashboard({ user }: KidsStyleDashboardProps) {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTodaysTasks = async () => {
    try {
      // Fetch both assigned tasks and available bonus tasks
      const [assignedResponse, bonusResponse] = await Promise.all([
        fetch(`/api/tasks?assignedTo=${user.id}&status=PENDING`),
        fetch(`/api/tasks?status=AVAILABLE`)
      ])
      
      if (assignedResponse.ok && bonusResponse.ok) {
        const [assignedResult, bonusResult] = await Promise.all([
          assignedResponse.json(),
          bonusResponse.json()
        ])
        
        if (assignedResult.success && bonusResult.success) {
          // Combine assigned tasks and bonus tasks
          const allTasks = [...assignedResult.data, ...bonusResult.data]
          
          // Filter tasks that are due today OR overdue using consistent date logic
          const now = new Date()
          const todayYear = now.getFullYear()
          const todayMonth = now.getMonth()
          const todayDay = now.getDate()
          
          const relevantTasks = allTasks.filter((task: Task) => {
            const taskDate = new Date(task.dueDate)
            const taskYear = taskDate.getFullYear()
            const taskMonth = taskDate.getMonth()
            const taskDay = taskDate.getDate()
            
            // Create date numbers for comparison (ignore time completely)
            const todayDateNum = todayYear * 10000 + todayMonth * 100 + todayDay
            const taskDateNum = taskYear * 10000 + taskMonth * 100 + taskDay
            
            // Show tasks due today OR overdue (past due)
            return taskDateNum <= todayDateNum
          })

          // Sort tasks: overdue first, then today's tasks
          const sortedTasks = relevantTasks.sort((a: Task, b: Task) => {
            const aDate = new Date(a.dueDate)
            const bDate = new Date(b.dueDate)
            const aYear = aDate.getFullYear()
            const aMonth = aDate.getMonth()
            const aDay = aDate.getDate()
            const bYear = bDate.getFullYear()
            const bMonth = bDate.getMonth()
            const bDay = bDate.getDate()
            
            const aDateNum = aYear * 10000 + aMonth * 100 + aDay
            const bDateNum = bYear * 10000 + bMonth * 100 + bDay
            
            // Sort by date: older dates (overdue) first
            return aDateNum - bDateNum
          })
          
          setTasks(sortedTasks)
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchPoints = async () => {
    try {
      const response = await fetch('/api/user/points')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setPoints(result.points)
        }
      }
    } catch (error) {
      console.error('Error fetching points:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchTodaysTasks(), fetchPoints()])
      setLoading(false)
    }
    fetchData()
  }, [user.id])

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Refresh tasks and points
        await fetchTodaysTasks()
        await fetchPoints()
      } else {
        const error = await response.json()
        alert(error.error?.message || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task')
    }
  }

  const handleAssignBonusTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: user.id })
      })

      if (response.ok) {
        // Refresh tasks to show the newly assigned task
        await fetchTodaysTasks()
      } else {
        const error = await response.json()
        alert(error.error?.message || 'Failed to assign task')
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      alert('Failed to assign task')
    }
  }

  const canCompleteToday = (task: Task) => {
    if (!task.dueDateOnly) return true
    
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    
    // Compare date parts directly (ignore time completely)
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDay = now.getDate()
    
    const dueYear = dueDate.getFullYear()
    const dueMonth = dueDate.getMonth()
    const dueDateDay = dueDate.getDate()
    
    // Create date numbers for comparison  
    const todayDateNum = todayYear * 10000 + todayMonth * 100 + todayDay
    const dueDateNum = dueYear * 10000 + dueMonth * 100 + dueDateDay
    
    // Allow completion on or after the due date
    return todayDateNum >= dueDateNum
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icons.circle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Helper function to check if a task is overdue
  const isTaskOverdue = (task: Task) => {
    const now = new Date()
    const taskDate = new Date(task.dueDate)
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDay = now.getDate()
    const taskYear = taskDate.getFullYear()
    const taskMonth = taskDate.getMonth()
    const taskDay = taskDate.getDate()
    
    const todayDateNum = todayYear * 10000 + todayMonth * 100 + todayDay
    const taskDateNum = taskYear * 10000 + taskMonth * 100 + taskDay
    
    return taskDateNum < todayDateNum
  }

  // Helper function to check if a task is due today
  const isTaskDueToday = (task: Task) => {
    const now = new Date()
    const taskDate = new Date(task.dueDate)
    const todayYear = now.getFullYear()
    const todayMonth = now.getMonth()
    const todayDay = now.getDate()
    const taskYear = taskDate.getFullYear()
    const taskMonth = taskDate.getMonth()
    const taskDay = taskDate.getDate()
    
    return todayYear === taskYear && todayMonth === taskMonth && todayDay === taskDay
  }

  // Separate tasks by type and status
  const assignedTasks = tasks.filter(task => !task.isBonusTask)
  const bonusTasks = tasks.filter(task => task.isBonusTask && task.status === 'AVAILABLE')
  
  const completableAssignedTasks = assignedTasks.filter(task => canCompleteToday(task))
  const lockedTasks = assignedTasks.filter(task => !canCompleteToday(task))
  
  // Separate overdue and today's assigned tasks
  const overdueAssignedTasks = completableAssignedTasks.filter(task => isTaskOverdue(task))
  const todaysAssignedTasks = completableAssignedTasks.filter(task => isTaskDueToday(task))
  
  // Separate bonus tasks by timing
  const overdueBonusTasks = bonusTasks.filter(task => isTaskOverdue(task))
  const todaysBonusTasks = bonusTasks.filter(task => isTaskDueToday(task))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          👋 Hi {user.name}!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Here are your tasks
        </p>
        <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
            {points} points
          </span>
        </div>
      </div>

      {/* Tasks */}
      {overdueAssignedTasks.length === 0 && todaysAssignedTasks.length === 0 && overdueBonusTasks.length === 0 && todaysBonusTasks.length === 0 && lockedTasks.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              All done!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Great job! You've completed all your tasks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue Tasks Section */}
          {(overdueAssignedTasks.length > 0 || overdueBonusTasks.length > 0) && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                🚨 Overdue Tasks ({overdueAssignedTasks.length + overdueBonusTasks.length})
              </h2>
              {/* Overdue Assigned Tasks */}
              {overdueAssignedTasks.map((task) => (
                <Card key={task.id} className="border-2 border-red-300 bg-red-50 dark:bg-red-900/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2 text-red-700 dark:text-red-300">
                          ⚠️ {task.title}
                          {task.dueDateOnly && (
                            <span className="text-amber-600" title="Due date only">⏰</span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            📅 Was due: {formatDate(new Date(task.dueDate))}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          {task.points} pts
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-red-600 hover:bg-red-700 text-lg px-6 py-3"
                        size="lg"
                      >
                        <Icons.check className="w-5 h-5 mr-2" />
                        Complete Now!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Overdue Bonus Tasks */}
              {overdueBonusTasks.map((task) => (
                <Card key={task.id} className="border-2 border-red-300 bg-red-50 dark:bg-red-900/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2 text-red-700 dark:text-red-300">
                          ⚠️ 💰 {task.title}
                          {task.dueDateOnly && (
                            <span className="text-amber-600" title="Due date only">⏰</span>
                          )}
                          <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            Bonus Task
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            📅 Was due: {formatDate(new Date(task.dueDate))}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          {task.points} pts
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleAssignBonusTask(task.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-lg px-6 py-3"
                        size="lg"
                      >
                        <Icons.plus className="w-5 h-5 mr-2" />
                        Take Task!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Today's Tasks Section */}
          {(todaysAssignedTasks.length > 0 || todaysBonusTasks.length > 0) && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                📅 Today's Tasks ({todaysAssignedTasks.length + todaysBonusTasks.length})
              </h2>
              {/* Today's Assigned Tasks */}
              {todaysAssignedTasks.map((task) => (
                <Card key={task.id} className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {task.title}
                          {task.dueDateOnly && (
                            <span className="text-amber-600" title="Due date only">⏰</span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            📅 {formatDate(new Date(task.dueDate))}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {task.points} pts
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleCompleteTask(task.id)}
                        className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
                        size="lg"
                      >
                        <Icons.check className="w-5 h-5 mr-2" />
                        Done!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Today's Bonus Tasks */}
              {todaysBonusTasks.map((task) => (
                <Card key={task.id} className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          💰 {task.title}
                          {task.dueDateOnly && (
                            <span className="text-amber-600" title="Due date only">⏰</span>
                          )}
                          <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                            Bonus Task
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            📅 {formatDate(new Date(task.dueDate))}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {task.points} pts
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      <Button
                        onClick={() => handleAssignBonusTask(task.id)}
                        className="bg-amber-600 hover:bg-amber-700 text-lg px-6 py-3"
                        size="lg"
                      >
                        <Icons.plus className="w-5 h-5 mr-2" />
                        Take Task!
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Locked Tasks (due date only, not available yet) */}
          {lockedTasks.map((task) => (
            <Card key={task.id} className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/20 opacity-75">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2 text-gray-600">
                      <span>🔒</span>
                      {task.title}
                      <span className="text-amber-600">⏰</span>
                    </CardTitle>
                    <p className="text-amber-700 text-sm mt-1">
                      This task will be available on {formatDate(new Date(task.dueDate))}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">
                      {task.points} pts
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Encouragement Footer */}
      <div className="text-center py-6">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Keep up the great work! 🌟
        </p>
      </div>
    </div>
  )
}