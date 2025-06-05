// filepath: src/components/features/dashboard-compact.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { SessionUser } from "@/types"
import { Task as FullTask } from "./task-card"
import { BonusTaskCard } from "./bonus-task-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

interface Props {
  user: SessionUser
}

interface FamilyMember {
  id: string
  name: string
  role: string
}

export default function CompactDashboard({ user }: Props) {
  const [pendingTasks, setPendingTasks] = useState<FullTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<FullTask[]>([])
  const [verifiedTasks, setVerifiedTasks] = useState<FullTask[]>([])
  const [bonusTasks, setBonusTasks] = useState<FullTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL'|'OVERDUE'|'UPCOMING'|'COMPLETED'|'VERIFIED'|'BONUS'>('ALL')
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false)
  const [assignedToFilter, setAssignedToFilter] = useState<string>("")
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loadingComplete, setLoadingComplete] = useState<string | null>(null)
  const [loadingVerify, setLoadingVerify] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      // Calculate 30 days ago for filtering completed/verified tasks
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
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
      
      if (completedData.success) {
        // Filter completed tasks to last 30 days based on updatedAt (when they were completed)
        const recentCompleted = completedData.data.filter((task: FullTask) => {
          const taskDate = new Date(task.updatedAt || task.createdAt)
          return taskDate >= thirtyDaysAgo
        })
        setCompletedTasks(recentCompleted)
      }
      
      if (verifiedData.success) {
        // Filter verified tasks to last 30 days based on updatedAt (when they were verified)
        const recentVerified = verifiedData.data.filter((task: FullTask) => {
          const taskDate = new Date(task.updatedAt || task.createdAt)
          return taskDate >= thirtyDaysAgo
        })
        setVerifiedTasks(recentVerified)
      }
      
      if (bonusData.success) {
        // Filter only bonus tasks that are actually available
        const availableBonusTasks = bonusData.data.filter((task: FullTask) => 
          task.isBonusTask && task.status === "AVAILABLE"
        )
        setBonusTasks(availableBonusTasks)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch("/api/families/members")
      const result = await response.json()
      
      if (result.success) {
        setFamilyMembers(result.data.map((member: { user: { id: string; name: string; role: string } }) => ({
          id: member.user.id,
          name: member.user.name,
          role: member.user.role
        })))
      }
    } catch (error) {
      console.error("Error fetching family members:", error)
    }
  }

  useEffect(() => {
    fetchData()
    if (user.role === "PARENT") {
      fetchFamilyMembers()
    }
  }, [user.role])

  // Memoized calculations to prevent state timing issues
  const taskCalculations = useMemo(() => {
    // Don't calculate during loading
    if (loading) {
      return {
        filteredPendingTasks: [],
        filteredCompletedTasks: [],
        filteredVerifiedTasks: [],
        allTasksAreMine: true,
        shouldShowOnlyMineButton: false,
        overdueTasks: [],
        todayTasks: [],
        futureTasks: [],
        upcomingTasks: [],
        totalTasks: 0
      }
    }

    // Apply filtering
    let filteredPendingTasks = pendingTasks
    let filteredCompletedTasks = completedTasks
    let filteredVerifiedTasks = verifiedTasks

    // Apply "Only Mine" filter if enabled
    if (showMyTasksOnly) {
      filteredPendingTasks = filteredPendingTasks.filter(task => task.assignedTo === user.id)
      filteredCompletedTasks = filteredCompletedTasks.filter(task => task.assignedTo === user.id)
      filteredVerifiedTasks = filteredVerifiedTasks.filter(task => task.assignedTo === user.id)
    }

    // Apply assignedTo filter if selected
    if (assignedToFilter) {
      filteredPendingTasks = filteredPendingTasks.filter(task => task.assignedTo === assignedToFilter)
      filteredCompletedTasks = filteredCompletedTasks.filter(task => task.assignedTo === assignedToFilter)
      filteredVerifiedTasks = filteredVerifiedTasks.filter(task => task.assignedTo === assignedToFilter)
    }

    // Check if all tasks belong to the current user
    const allTasks = [...pendingTasks, ...completedTasks, ...verifiedTasks]
    const allTasksAreMine = allTasks.every(task => task.assignedTo === user.id || task.assignee?.id === user.id)
    
    const shouldShowOnlyMineButton = !allTasksAreMine && (pendingTasks.length > 0 || completedTasks.length > 0 || verifiedTasks.length > 0)

    const now = new Date()
    const todayStart = new Date(now.setHours(0,0,0,0))
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1)

    // Overdue: pending tasks due before today
    const overdueTasks = filteredPendingTasks.filter(t => {
      const taskDate = new Date(t.dueDate)
      const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
      return taskDateOnly < todayStart
    })
    // Today's tasks: pending tasks due today
    const todayTasks = filteredPendingTasks.filter(t => {
      const d = new Date(t.dueDate)
      return d >= todayStart && d < tomorrowStart
    })
    // Future tasks: pending tasks due after today
    const futureTasks = filteredPendingTasks
      .filter(t => new Date(t.dueDate) >= tomorrowStart)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    
    // For Enhanced dashboard, show all pending tasks in "Next Up" section
    // Combine overdue, today, and future tasks in chronological order
    const upcomingTasks = [...overdueTasks, ...todayTasks, ...futureTasks]
      
    const totalTasks = filteredPendingTasks.length + filteredCompletedTasks.length + filteredVerifiedTasks.length + bonusTasks.length

    return {
      filteredPendingTasks,
      filteredCompletedTasks,
      filteredVerifiedTasks,
      allTasksAreMine,
      shouldShowOnlyMineButton,
      overdueTasks,
      todayTasks,
      futureTasks,
      upcomingTasks,
      totalTasks
    }
  }, [loading, pendingTasks, completedTasks, verifiedTasks, bonusTasks, showMyTasksOnly, assignedToFilter, user.id])

  const {
    filteredCompletedTasks,
    filteredVerifiedTasks,
    shouldShowOnlyMineButton,
    overdueTasks,
    upcomingTasks,
    totalTasks
  } = taskCalculations

  // Reset "Only Mine" toggle when button should be hidden (all tasks are mine)
  useEffect(() => {
    if (!shouldShowOnlyMineButton && showMyTasksOnly) {
      setShowMyTasksOnly(false)
    }
  }, [shouldShowOnlyMineButton, showMyTasksOnly])

  const handleComplete = async (taskId: string) => {
    setLoadingComplete(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        await fetchData() // Refresh all data
      }
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setLoadingComplete(null)
    }
  }

  const handleVerify = async (taskId: string) => {
    setLoadingVerify(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}/verify`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        await fetchData() // Refresh all data
      }
    } catch (error) {
      console.error('Error verifying task:', error)
    } finally {
      setLoadingVerify(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Compact Filter bar */}
      <div className="flex flex-wrap gap-1 text-xs">
        <button
          onClick={() => setFilter('ALL')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'ALL' ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          All ({totalTasks})
        </button>
        <button
          onClick={() => setFilter('OVERDUE')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'OVERDUE' ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          Overdue ({overdueTasks.length})
        </button>
        <button
          onClick={() => setFilter('UPCOMING')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'UPCOMING' ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          Next ({upcomingTasks.length})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'COMPLETED' ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          Awaiting ({filteredCompletedTasks.length})
        </button>
        <button
          onClick={() => setFilter('VERIFIED')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'VERIFIED' ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          Done ({filteredVerifiedTasks.length})
        </button>
        <button
          onClick={() => setFilter('BONUS')}
          className={cn("px-2 py-1 rounded-md text-xs", filter === 'BONUS' ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}
        >
          💰 ({bonusTasks.length})
        </button>
      </div>

      {/* Family Member Filter (Parents only) */}
      {user.role === "PARENT" && familyMembers.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Assigned to:
          </label>
          <select
            value={assignedToFilter}
            onChange={(e) => setAssignedToFilter(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Members</option>
            <option value={user.id}>My Tasks</option>
            {familyMembers
              .filter(member => member.id !== user.id)
              .map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Only Mine Toggle */}
      {shouldShowOnlyMineButton && !assignedToFilter && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
            className={cn(
              "inline-flex items-center space-x-1 px-2 py-1 text-xs rounded-md transition-colors",
              showMyTasksOnly 
                ? "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300" 
                : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
            )}
          >
            <Icons.user className="h-3 w-3" />
            <span>Only Mine</span>
            {showMyTasksOnly && <Icons.check className="h-3 w-3" />}
          </button>
        </div>
      )}

      {/* Compact Task Sections */}
      <div className="space-y-3">
        {/* Bonus Tasks */}
        {(filter === 'ALL' || filter === 'BONUS') && bonusTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-amber-700 mb-1">💰 Bonus Tasks</h3>
            <div className="space-y-1">
              {bonusTasks.map(task => (
                <BonusTaskCard key={task.id} task={task} onAssign={fetchData} />
              ))}
            </div>
          </div>
        )}

        {/* Overdue Tasks */}
        {filter !== 'UPCOMING' && (filter === 'ALL' || filter === 'OVERDUE') && overdueTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-700 mb-1">🚨 Overdue</h3>
            <div className="space-y-1">
              {overdueTasks.map(task => (
                <CompactTaskRow key={task.id} task={task} onComplete={handleComplete} onVerify={handleVerify} loadingComplete={loadingComplete} loadingVerify={loadingVerify} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {(filter === 'ALL' || filter === 'UPCOMING') && upcomingTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-1">Next Up</h3>
            <div className="space-y-1">
              {upcomingTasks.map(task => (
                <CompactTaskRow key={task.id} task={task} onComplete={handleComplete} onVerify={handleVerify} loadingComplete={loadingComplete} loadingVerify={loadingVerify} />
              ))}
            </div>
          </div>
        )}

        {/* Awaiting Verification */}
        {(filter === 'ALL' || filter === 'COMPLETED') && filteredCompletedTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-orange-700 mb-1">Awaiting Verification</h3>
            <div className="space-y-1">
              {filteredCompletedTasks.map(task => (
                <CompactTaskRow key={task.id} task={task} onComplete={handleComplete} onVerify={handleVerify} loadingComplete={loadingComplete} loadingVerify={loadingVerify} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Verified */}
        {(filter === 'ALL' || filter === 'VERIFIED') && filteredVerifiedTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-1">Recently Done</h3>
            <div className="space-y-1">
              {filteredVerifiedTasks.map(task => (
                <CompactTaskRow key={task.id} task={task} onComplete={handleComplete} onVerify={handleVerify} loadingComplete={loadingComplete} loadingVerify={loadingVerify} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state messages */}
        {filter === 'BONUS' && bonusTasks.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No bonus tasks available</p>
        )}
        {filter === 'UPCOMING' && upcomingTasks.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No pending tasks</p>
        )}
        {filter === 'ALL' && totalTasks === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No tasks found</p>
        )}
      </div>
    </div>
  )
}

// Compact single-line task component
function CompactTaskRow({ 
  task, 
  onComplete, 
  onVerify, 
  loadingComplete, 
  loadingVerify 
}: { 
  task: FullTask
  onComplete: (id: string) => void
  onVerify: (id: string) => void
  loadingComplete: string | null
  loadingVerify: string | null
}) {
  const { data: session } = useSession()
  const taskDate = new Date(task.dueDate)
  const today = new Date()
  const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isOverdue = taskDateOnly < todayOnly
  
  // Determine the correct link based on user role
  const isParent = session?.user?.role === "PARENT" || session?.user?.familyRole === "ADMIN_PARENT" || session?.user?.familyRole === "PARENT"
  const taskLink = isParent ? `/tasks/${task.id}/edit` : `/tasks/${task.id}`
  
  // Check if due date only task can be completed (on or after due date)
  const canCompleteToday = !task.dueDateOnly || (() => {
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    // Normalize dates to remove time component for comparison
    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)
    // Allow completion on or after the due date
    return today >= dueDate
  })()

  // Use the same logic as TaskCard
  const canComplete = task.assignee?.id === session?.user.id && task.status === "PENDING" && canCompleteToday
  const canVerify = session?.user.role === "PARENT" && task.status === "COMPLETED"
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  
  return (
    <div className={cn(
      "flex items-center justify-between py-2 px-2 text-sm rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
      isOverdue && task.status === "PENDING" ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "border-gray-200 dark:border-gray-700"
    )}>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Link 
          href={taskLink}
          className="truncate font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          {task.title}
        </Link>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{task.points}pts</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {task.assignee?.name || "Unassigned"}
          {task.assignee?.id === session?.user.id && (
            <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
          )}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(task.dueDate)}</span>
        {isOverdue && task.status === "PENDING" && (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">🚨</span>
        )}
      </div>
      
      {canComplete && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onComplete(task.id)}
          disabled={loadingComplete === task.id}
          className="ml-2 h-7 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
        >
          {loadingComplete === task.id ? '...' : 'Complete'}
        </Button>
      )}
      
      {canVerify && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onVerify(task.id)}
          disabled={loadingVerify === task.id}
          className="ml-2 h-7 px-2 text-xs bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
        >
          {loadingVerify === task.id ? '...' : 'Verify'}
        </Button>
      )}
      
      {task.status === "VERIFIED" && (
        <span className="ml-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <span>✓</span>
          <span>Done</span>
        </span>
      )}

      {task.status === "COMPLETED" && !canVerify && (
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <span>⏳</span>
          <span>Awaiting</span>
        </span>
      )}
    </div>
  )
}
