"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateTaskSchema, type UpdateTaskInput } from "@/lib/validations"
import { dateToInputString } from "@/lib/utils"

interface TaskData {
  id: string
  title: string
  description?: string | null
  points: number
  dueDate: string
  assignedTo: string
  status: string
  dueDateOnly?: boolean
  isRecurring?: boolean
  recurrencePattern?: string
  tags: Array<{ tag: { id: string; name: string; color: string } }>
}

interface FamilyMember {
  id: string
  name: string
  role: string
}

interface Tag {
  id: string
  name: string
  color: string
}

interface EditTaskFormProps {
  task: TaskData
}

export function EditTaskForm({ task }: EditTaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const router = useRouter()
  const { data: session } = useSession()
  
  // Check if current user is a parent
  const isParent = session?.user?.role === "PARENT" || session?.user?.familyRole === "ADMIN_PARENT" || session?.user?.familyRole === "PARENT"
  
  // Check if task can be reassigned (PENDING status and user is parent)
  const canReassign = isParent && task.status === "PENDING"

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      points: task.points,
      dueDate: (() => {
        const date = new Date(task.dueDate)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })(), // Direct date formatting
      assignedTo: task.assignedTo,
      dueDateOnly: task.dueDateOnly || false,
      tagIds: task.tags.map(t => t.tag.id)
    }
  })

  const dueDateOnly = watch("dueDateOnly")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch family members
        const membersResponse = await fetch("/api/families/members")
        const membersResult = await membersResponse.json()
        
        if (membersResult.success) {
          setFamilyMembers(membersResult.data.map((member: any) => ({
            id: member.user.id,
            name: member.user.name,
            role: member.user.role
          })))
        }

        // Fetch tags
        const tagsResponse = await fetch("/api/tags")
        const tagsResult = await tagsResponse.json()
        
        if (tagsResult.success) {
          setTags(tagsResult.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (data: UpdateTaskInput) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || "Failed to update task")
        return
      }

      router.push("/tasks")
      router.refresh()
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        router.push("/tasks")
        router.refresh()
      } else {
        setError("Failed to delete task")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Edit Task
          {task.isRecurring && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium" 
              title={`Recurring ${task.recurrencePattern?.toLowerCase()}`}
            >
              🔄 {task.recurrencePattern?.toLowerCase() || 'recurring'}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Update task details and assignment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Clean your room, Do homework, Take out trash"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Add more details about what needs to be done..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Points and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Points */}
            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                {...register("points", { valueAsNumber: true })}
              />
              {errors.points && (
                <p className="text-sm text-destructive">{errors.points.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
              />
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Task Assignment */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">
              {canReassign ? "Assigned To" : "Currently Assigned To"}
            </Label>
            {canReassign ? (
              // Editable dropdown for parents with PENDING tasks
              <select
                id="assignedTo"
                {...register("assignedTo")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role.toLowerCase()})
                  </option>
                ))}
              </select>
            ) : (
              // Read-only display for children or non-PENDING tasks
              <div className="bg-gray-50 rounded-md p-3 border">
                <p className="text-sm text-gray-700">
                  {familyMembers.find(m => m.id === task.assignedTo)?.name || "Loading..."}
                </p>
              </div>
            )}
            {!canReassign && (
              <p className="text-xs text-gray-500">
                {!isParent 
                  ? "Only parents can reassign tasks" 
                  : task.status !== "PENDING"
                  ? "Only pending tasks can be reassigned"
                  : "Assignment cannot be changed after task creation"}
              </p>
            )}
            {errors.assignedTo && (
              <p className="text-sm text-destructive">{errors.assignedTo.message}</p>
            )}
          </div>

          {/* Due Date Only Constraint */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dueDateOnly"
                {...register("dueDateOnly")}
                className="text-blue-600"
              />
              <Label htmlFor="dueDateOnly">⏰ On Due Date Only</Label>
            </div>
            {dueDateOnly && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  ⏰ <strong>Due Date Only:</strong> This task can only be completed on its specific due date. Perfect for daily routines like "do the dishes" that shouldn't be done early.
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={tag.id}
                      defaultChecked={task.tags.some(t => t.tag.id === tag.id)}
                      {...register("tagIds")}
                      className="text-blue-600"
                    />
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Deleting..." : "Delete Task"}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Updating..." : "Update Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}