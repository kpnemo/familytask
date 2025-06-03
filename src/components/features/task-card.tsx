"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { formatDate, formatDateTime, isTaskOverdue } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DeclineTaskDialog } from "./decline-task-dialog"

export interface Task {
  id: string
  title: string
  description?: string
  points: number
  dueDate: string
  status: "PENDING" | "COMPLETED" | "VERIFIED" | "OVERDUE"
  creator: { id: string; name: string; role: string }
  assignee: { id: string; name: string; role: string }
  verifier?: { id: string; name: string; role: string }
  tags: Array<{ id: string; name: string; color: string }>
  completedAt?: string
  verifiedAt?: string
  isRecurring?: boolean
  recurrencePattern?: string
  dueDateOnly?: boolean
  // Legacy field names for backwards compatibility
  assignedTo?: string
  createdBy?: string
}

interface TaskCardProps {
  task: Task
  onUpdate: () => void
  isOverdue?: boolean
}

export function TaskCard({ task, onUpdate, isOverdue = false }: TaskCardProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const router = useRouter()

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

  const canComplete = task.assignee.id === session?.user.id && task.status === "PENDING" && canCompleteToday
  const canVerify = session?.user.role === "PARENT" && task.status === "COMPLETED"
  const canEdit = task.creator.id === session?.user.id || session?.user.role === "PARENT"
  const canDelete = session?.user.role === "PARENT" // Only parents/admins can delete

  const handleComplete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST"
      })

      if (response.ok) {
        onUpdate()
      } else {
        console.error("Failed to complete task")
      }
    } catch (error) {
      console.error("Error completing task:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/verify`, {
        method: "POST"
      })

      if (response.ok) {
        onUpdate()
      } else {
        console.error("Failed to verify task")
      }
    } catch (error) {
      console.error("Error verifying task:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async (reason: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason })
      })

      if (response.ok) {
        onUpdate()
      } else {
        console.error("Failed to decline task")
      }
    } catch (error) {
      console.error("Error declining task:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmMessage = task.status === "VERIFIED" 
      ? `Are you sure you want to delete "${task.title}"?\n\nThis task is VERIFIED and points will be reversed for ${task.assignee.name}.\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show success message with details
        let successMessage = `Task "${result.data.taskTitle}" deleted successfully.`
        if (result.data.pointsAdjustment) {
          successMessage += `\n\n${result.data.pointsAdjustment.pointsReversed} points have been reversed.`
        }
        
        alert(successMessage)
        onUpdate()
      } else {
        const error = await response.json()
        alert(error.error?.message || "Failed to delete task")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      alert("Failed to delete task")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = () => {
    switch (task.status) {
      case "PENDING":
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOverdue 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          }`}>
            {isOverdue ? '🚨 Overdue' : '📋 Pending'}
          </span>
        )
      case "COMPLETED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            ✅ Completed
          </span>
        )
      case "VERIFIED":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            🎉 Verified
          </span>
        )
      default:
        return null
    }
  }

  const dueDate = new Date(task.dueDate)
  const isOverdueTask = isTaskOverdue(dueDate) && task.status === "PENDING"

  return (
    <Card className={`${isOverdueTask ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {task.title}
                {task.isRecurring && (
                  <span 
                    className="text-purple-600 dark:text-purple-400" 
                    title={`Recurring ${task.recurrencePattern?.toLowerCase()}`}
                  >
                    🔄
                  </span>
                )}
                {task.dueDateOnly && (
                  <span 
                    className="text-amber-600 dark:text-amber-400" 
                    title="This task can only be completed on its due date"
                  >
                    ⏰
                  </span>
                )}
              </h3>
              {getStatusBadge()}
            </div>
            
            {task.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{task.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {(task.tags || []).map(tag => (
                 <span
                   key={tag.id}
                   className="px-2 py-1 rounded-full text-xs font-medium text-white"
                   style={{ backgroundColor: tag.color }}
                 >
                   {tag.name}
                 </span>
               ))}
             </div>
          </div>

          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {task.points} pts
            </div>
            <div className={`text-sm ${
              isOverdueTask 
                ? 'text-red-600 dark:text-red-400 font-medium' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Due: {formatDate(dueDate)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              <strong>Assigned to:</strong> {task.assignee.name}
              {task.assignee.id === session?.user.id && (
                <span className="text-blue-600 dark:text-blue-400 ml-1">(You)</span>
              )}
            </div>
            <div>
              <strong>Created by:</strong> {task.creator.name}
            </div>
            {task.completedAt && (
              <div>
                <strong>Completed:</strong> {formatDateTime(new Date(task.completedAt))}
              </div>
            )}
            {task.verifiedAt && task.verifier && (
              <div>
                <strong>Verified by:</strong> {task.verifier.name} on {formatDateTime(new Date(task.verifiedAt))}
              </div>
            )}
            {task.dueDateOnly && task.assignee.id === session?.user.id && task.status === "PENDING" && !canCompleteToday && (
              <div className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1 mt-2">
                <span>⏰</span>
                <span>Available on {formatDate(new Date(task.dueDate))}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {canComplete && (
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Completing..." : "Mark Complete"}
              </Button>
            )}

            {canVerify && (
              <>
                <Button 
                  onClick={handleVerify} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Verifying..." : "Verify & Award Points"}
                </Button>
                <Button 
                  onClick={() => setShowDeclineDialog(true)} 
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  Decline
                </Button>
              </>
            )}

            {canEdit && task.status === "PENDING" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/tasks/${task.id}/edit`)}
              >
                Edit
              </Button>
            )}

            {canDelete && (
              <Button 
                onClick={handleDelete}
                disabled={loading}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <DeclineTaskDialog
        isOpen={showDeclineDialog}
        onClose={() => setShowDeclineDialog(false)}
        onDecline={handleDecline}
        taskTitle={task.title}
        loading={loading}
      />
    </Card>
  )
}