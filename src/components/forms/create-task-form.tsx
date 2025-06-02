"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createTaskSchema, type CreateTaskInput } from "@/lib/validations"

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

interface CreateTaskFormProps {
  currentUserId: string
  currentUserName: string
  currentUserRole: string
}

export function CreateTaskForm({ currentUserId, currentUserName, currentUserRole }: CreateTaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      points: 1,
      isRecurring: false,
      assignedTo: currentUserId
    }
  })

  const isRecurring = watch("isRecurring")

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch family members
        const membersResponse = await fetch("/api/families/members")
        
        if (!membersResponse.ok) {
          console.error("Failed to fetch family members:", membersResponse.status, membersResponse.statusText)
          // Fallback: add current user to the list
          setFamilyMembers([{
            id: currentUserId,
            name: currentUserName,
            role: currentUserRole
          }])
          setValue("assignedTo", currentUserId)
          return
        }
        
        const membersResult = await membersResponse.json()
        console.log("Family members API response:", membersResult)
        
        if (membersResult.success && membersResult.data) {
          const members = membersResult.data.map((member: any) => ({
            id: member.user.id,
            name: member.user.name,
            role: member.user.role
          }))
          console.log("Processed family members:", members)
          setFamilyMembers(members)
        } else {
          console.error("Family members API failed:", membersResult)
          // Fallback: add current user to the list
          setFamilyMembers([{
            id: currentUserId,
            name: currentUserName,
            role: currentUserRole
          }])
        }
        
        // Always set current user as default assignee
        setValue("assignedTo", currentUserId)

        // Fetch tags
        const tagsResponse = await fetch("/api/tags")
        if (tagsResponse.ok) {
          const tagsResult = await tagsResponse.json()
          if (tagsResult.success) {
            setTags(tagsResult.data)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback: add current user to the list
        setFamilyMembers([{
          id: currentUserId,
          name: currentUserName,
          role: currentUserRole
        }])
        setValue("assignedTo", currentUserId)
      }
    }

    fetchData()
  }, [currentUserId, currentUserName, currentUserRole, setValue])

  const onSubmit = async (data: CreateTaskInput) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || "Failed to create task")
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

  // Set default due date to tomorrow
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setValue("dueDate", tomorrow.toISOString().slice(0, 10)) // YYYY-MM-DD format
  }, [setValue])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>
          Create and assign a task to a family member
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

          {/* Assign To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To *</Label>
            <select
              id="assignedTo"
              {...register("assignedTo")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a family member</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
            {errors.assignedTo && (
              <p className="text-sm text-destructive">{errors.assignedTo.message}</p>
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

          {/* Recurring Task */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                {...register("isRecurring")}
                className="text-blue-600"
              />
              <Label htmlFor="isRecurring">Recurring Task</Label>
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurrencePattern">Repeat *</Label>
                <select
                  id="recurrencePattern"
                  {...register("recurrencePattern")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
                {errors.recurrencePattern && (
                  <p className="text-sm text-destructive">{errors.recurrencePattern.message}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
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
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}