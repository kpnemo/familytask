"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import { formatDateTime } from "@/lib/utils"

interface User {
  id: string
  name: string
  role: string
}

interface Tag {
  tag: {
    id: string
    name: string
    color: string
  }
}

interface Task {
  id: string
  title: string
  description?: string
  points: number
  dueDate: string
  status: "PENDING" | "AVAILABLE" | "COMPLETED" | "VERIFIED" | "OVERDUE"
  createdAt: string
  completedAt?: string
  verifiedAt?: string
  creator: User
  assignee: User | null
  verifier?: User
  tags: Tag[]
  isBonusTask?: boolean
  dueDateOnly?: boolean
}

interface TaskViewClientProps {
  task: Task
  isParent: boolean
  isAssignee: boolean
  isCreator: boolean
  currentUserId: string
}

export function TaskViewClient({ 
  task, 
  isParent, 
  isAssignee, 
  isCreator, 
  currentUserId 
}: TaskViewClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(task.status)
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "VERIFIED":
        return "bg-green-100 text-green-800 border-green-200"
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Icons.clock className="h-4 w-4" />
      case "COMPLETED":
        return <Icons.check className="h-4 w-4" />
      case "VERIFIED":
        return <Icons.check className="h-4 w-4" />
      case "OVERDUE":
        return <Icons.warning className="h-4 w-4" />
      default:
        return <Icons.circle className="h-4 w-4" />
    }
  }

  const handleCompleteTask = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("API Error:", error)
        console.error("Response status:", response.status)
        const errorMessage = error.error?.message || "Failed to complete task"
        console.error("Error message:", errorMessage)
        throw new Error(errorMessage)
      }

      setCurrentStatus("COMPLETED")
      router.refresh()
    } catch (error) {
      console.error("Error completing task:", error)
      // Show user-friendly error message
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert("Failed to complete task")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyTask = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to verify task")
      }

      setCurrentStatus("VERIFIED")
      router.refresh()
    } catch (error) {
      console.error("Error verifying task:", error)
      alert(error instanceof Error ? error.message : "Failed to verify task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineTask = async () => {
    if (!confirm("Are you sure you want to decline this task? It will be reset to pending status.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to decline task")
      }

      setCurrentStatus("PENDING")
      router.refresh()
    } catch (error) {
      console.error("Error declining task:", error)
      alert(error instanceof Error ? error.message : "Failed to decline task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignToMe = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to assign task")
      }

      // Refresh the page to show updated task
      router.refresh()
    } catch (error) {
      console.error("Error assigning task:", error)
      alert(error instanceof Error ? error.message : "Failed to assign task")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTask = async () => {
    const confirmMessage = currentStatus === "VERIFIED" 
      ? `Are you sure you want to delete "${task.title}"?\n\nThis task is VERIFIED and points will be reversed for ${task.assignee?.name || 'the assignee'}.\n\nThis action cannot be undone.`
      : `Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to delete task")
      }

      const result = await response.json()
      
      // Show success message with details
      let successMessage = `Task "${result.data.taskTitle}" deleted successfully.`
      if (result.data.pointsAdjustment) {
        successMessage += `\n\n${result.data.pointsAdjustment.pointsReversed} points have been reversed.`
      }
      
      alert(successMessage)
      
      // Navigate back to tasks list
      router.push("/tasks")
      router.refresh()
    } catch (error) {
      console.error("Error deleting task:", error)
      alert(error instanceof Error ? error.message : "Failed to delete task")
    } finally {
      setIsLoading(false)
    }
  }

  const isOverdue = new Date(task.dueDate) < new Date() && currentStatus === "PENDING"
  
  // Check if due date only task can be completed today
  const canCompleteToday = !task.dueDateOnly || (() => {
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    // Use local date strings for comparison to avoid timezone issues
    const todayStr = today.toLocaleDateString()
    const dueDateStr = dueDate.toLocaleDateString()
    return todayStr === dueDateStr
  })()

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <CardDescription className="mt-2">
                Created by {task.creator.name} • {task.assignee ? `Assigned to ${task.assignee.name}` : '💰 Bonus Task - Available to Claim'}
              </CardDescription>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(isOverdue ? "OVERDUE" : currentStatus)}`}>
              {getStatusIcon(isOverdue ? "OVERDUE" : currentStatus)}
              <span className="text-sm font-medium">
                {isOverdue ? "OVERDUE" : currentStatus}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Task Details</h4>
              {task.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">{task.description}</p>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Points:</span>
                  <span className="font-medium">{task.points}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due Date:</span>
                  <div className="text-right">
                    <span className={`font-medium ${isOverdue ? "text-red-600" : ""}`}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                    {task.dueDateOnly && (
                      <div className="text-xs text-amber-600 flex items-center justify-end gap-1 mt-1">
                        <span>⏰</span>
                        <span>Due date only</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{formatDateTime(new Date(task.createdAt))}</span>
                </div>
                {task.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed:</span>
                    <span>{formatDateTime(new Date(task.completedAt))}</span>
                  </div>
                )}
                {task.verifiedAt && task.verifier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verified by:</span>
                    <span>{task.verifier.name} on {formatDateTime(new Date(task.verifiedAt))}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">People</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Icons.user className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{task.creator.name}</div>
                    <div className="text-xs text-gray-500">Creator • {task.creator.role}</div>
                  </div>
                </div>
                {task.assignee ? (
                  <div className="flex items-center gap-3">
                    <Icons.user className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{task.assignee.name}</div>
                      <div className="text-xs text-gray-500">Assignee • {task.assignee.role}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💰</span>
                    <div>
                      <div className="text-sm font-medium text-amber-700">Bonus Task</div>
                      <div className="text-xs text-amber-600">Available for anyone to claim</div>
                    </div>
                  </div>
                )}
              </div>

              {task.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tagRelation) => (
                      <span
                        key={tagRelation.tag.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tagRelation.tag.color }}
                      >
                        {tagRelation.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Assign to Me - for bonus tasks */}
            {!task.assignee && task.isBonusTask && currentStatus === "AVAILABLE" && (
              <Button
                onClick={handleAssignToMe}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <span className="text-sm mr-2">💰</span>
                    Assign to Me
                  </>
                )}
              </Button>
            )}

            {/* Complete Task - for assignee when pending */}
            {isAssignee && currentStatus === "PENDING" && canCompleteToday && (
              <Button
                onClick={handleCompleteTask}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Icons.check className="w-4 h-4 mr-2" />
                    Complete Task
                  </>
                )}
              </Button>
            )}

            {/* Message for due-date-only tasks not yet due */}
            {isAssignee && currentStatus === "PENDING" && task.dueDateOnly && !canCompleteToday && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <span>⏰</span>
                  <span>This task can only be completed on {new Date(task.dueDate).toLocaleDateString()}</span>
                </p>
              </div>
            )}

            {/* Verify Task - for parents when completed */}
            {isParent && currentStatus === "COMPLETED" && (
              <Button
                onClick={handleVerifyTask}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Icons.check className="w-4 h-4 mr-2" />
                    Verify Task
                  </>
                )}
              </Button>
            )}

            {/* Decline Task - for parents when completed */}
            {isParent && currentStatus === "COMPLETED" && (
              <Button
                onClick={handleDeclineTask}
                disabled={isLoading}
                variant="destructive"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Declining...
                  </>
                ) : (
                  <>
                    <Icons.warning className="w-4 h-4 mr-2" />
                    Decline Task
                  </>
                )}
              </Button>
            )}

            {/* Edit Task - for creator when pending */}
            {isCreator && currentStatus === "PENDING" && (
              <Button asChild variant="outline">
                <Link href={`/tasks/${task.id}/edit`}>
                  <Icons.edit className="w-4 h-4 mr-2" />
                  Edit Task
                </Link>
              </Button>
            )}

            {/* Delete Task - for parents/admins only */}
            {isParent && (
              <Button
                onClick={handleDeleteTask}
                disabled={isLoading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Icons.circle className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Icons.trash className="w-4 h-4 mr-2" />
                    Delete Task
                  </>
                )}
              </Button>
            )}

            {/* Back to Tasks */}
            <Button asChild variant="outline">
              <Link href="/tasks">
                <Icons.chevronLeft className="w-4 h-4 mr-2" />
                Back to Tasks
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}