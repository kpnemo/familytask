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
import { dateToInputString } from "@/lib/utils"

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
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([{
    id: currentUserId,
    name: currentUserName,
    role: currentUserRole
  }])
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
      points: currentUserRole === "CHILD" ? 0 : 1,
      isRecurring: false,
      isBonusTask: false,
      dueDateOnly: false,
      assignedTo: currentUserId,
      tagIds: []
    }
  })

  const assignedTo = watch("assignedTo")
  const isBonusTask = watch("isBonusTask")
  const isRecurring = watch("isRecurring")
  const dueDateOnly = watch("dueDateOnly")

  useEffect(() => {
    const fetchData = async () => {
      // Immediately set current user as fallback to ensure UI shows something
      const currentUserFallback = [{
        id: currentUserId,
        name: currentUserName,
        role: currentUserRole
      }]

      try {
        // Fetch family members
        const membersResponse = await fetch("/api/families/members")
        
        if (!membersResponse.ok) {
          console.error("Failed to fetch family members:", membersResponse.status, membersResponse.statusText)
          setFamilyMembers(currentUserFallback)
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
          setFamilyMembers(currentUserFallback)
        }

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
        setFamilyMembers(currentUserFallback)
      }
    }

    fetchData()
  }, [currentUserId, currentUserName, currentUserRole])

  const onSubmit = async (data: CreateTaskInput) => {
    console.log("Form submission started with data:", data);
    setIsLoading(true)
    setError("")

    try {
      // For bonus tasks, completely remove assignedTo from the data
      const submitData = { ...data };
      if (data.isBonusTask) {
        delete submitData.assignedTo;
      }

      console.log("Submitting task data:", submitData);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API Error:", result);
        setError(result.error?.message || result.message || "Failed to create task")
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

  // Set default due date to today - fetch user's timezone setting
  useEffect(() => {
    const setTodayDate = async () => {
      try {
        // Try to get user's stored timezone first
        const response = await fetch('/api/user/timezone')
        let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.timezone) {
            userTimezone = result.data.timezone
          }
        }
        
        // Create date in user's timezone
        const now = new Date()
        const todayInUserTz = new Date(now.toLocaleString("en-US", {timeZone: userTimezone}))
        
        const year = todayInUserTz.getFullYear()
        const month = String(todayInUserTz.getMonth() + 1).padStart(2, '0')
        const day = String(todayInUserTz.getDate()).padStart(2, '0')
        const todayString = `${year}-${month}-${day}`
        
        setValue("dueDate", todayString)
      } catch (error) {
        // Fallback to browser timezone
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayString = `${year}-${month}-${day}`
        setValue("dueDate", todayString)
      }
    }
    
    setTodayDate()
  }, [setValue])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>
          Create a task and assign it to a family member, or create a bonus task for anyone to claim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Debug form errors */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">Form Validation Errors:</p>
              <ul className="text-xs text-red-600 mt-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{field}: {error?.message}</li>
                ))}
              </ul>
            </div>
          )}
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
                min={currentUserRole === "CHILD" ? "0" : "1"}
                max="100"
                disabled={currentUserRole === "CHILD"}
                {...register("points", { valueAsNumber: true })}
                className={currentUserRole === "CHILD" ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {currentUserRole === "CHILD" && (
                <p className="text-xs text-gray-500">
                  👦 Kids can create tasks but cannot assign points. Parents will review and assign points later.
                </p>
              )}
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

          {/* Bonus Task Toggle - Only for parents */}
          {currentUserRole === "PARENT" && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isBonusTask"
                  className="text-blue-600"
                  onChange={(e) => {
                    // Update the form value
                    setValue("isBonusTask", e.target.checked, { shouldValidate: true });
                    
                    // Update assignedTo based on bonus task status
                    if (e.target.checked) {
                      setValue("assignedTo", "", { shouldValidate: true });
                    } else {
                      setValue("assignedTo", currentUserId, { shouldValidate: true });
                    }
                  }}
                />
                <Label htmlFor="isBonusTask">Bonus Task</Label>
              </div>
              {isBonusTask && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">
                    💰 <strong>Bonus Task:</strong> This task will be available for any family member to claim. Perfect for urgent tasks with higher point rewards!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Assign To - Only show for regular tasks */}
          {!isBonusTask && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To *</Label>
              <select
                id="assignedTo"
                {...register("assignedTo")}
                value={assignedTo || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {!assignedTo && <option value="">Select a family member</option>}
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
          )}

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
              onClick={() => console.log("Submit button clicked, isBonusTask:", isBonusTask)}
            >
              {isLoading ? "Creating..." : isBonusTask ? "Create Bonus Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}