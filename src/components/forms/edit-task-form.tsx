"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateTaskSchema, type UpdateTaskInput } from "@/lib/validations"

interface TaskData {
  id: string
  title: string
  description?: string | null
  points: number
  dueDate: string
  assignedTo: string
  dueDateOnly?: boolean
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
      dueDate: new Date(task.dueDate).toISOString().slice(0, 10),
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
        <CardTitle>Edit Task</CardTitle>
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

          {/* Current Assignment (Read-only) */}
          <div className="space-y-2">
            <Label>Currently Assigned To</Label>
            <div className="bg-gray-50 rounded-md p-3 border">
              <p className="text-sm text-gray-700">
                {familyMembers.find(m => m.id === task.assignedTo)?.name || "Loading..."}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Note: Assignment cannot be changed after task creation
            </p>
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