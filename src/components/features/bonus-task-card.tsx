"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskWithRelations } from "@/types"
import { isTaskOverdue } from "@/lib/utils"

interface BonusTaskCardProps {
  task: TaskWithRelations
  onAssign?: () => void
}

export function BonusTaskCard({ task, onAssign }: BonusTaskCardProps) {
  const [isAssigning, setIsAssigning] = useState(false)

  const handleAssignToMe = async () => {
    setIsAssigning(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/assign`, {
        method: "POST"
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error?.message || "Failed to assign task")
        return
      }

      // Call the onAssign callback to refresh the parent component
      onAssign?.()
    } catch (error) {
      alert("Something went wrong. Please try again.")
    } finally {
      setIsAssigning(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  const isOverdue = isTaskOverdue(new Date(task.dueDate))

  return (
    <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💰</span>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {task.title}
              </CardTitle>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm font-medium">
              {task.points} points
            </div>
            <div className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              Due: {formatDate(task.dueDate)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Created by {task.creator.name}
            </div>
            {task.tags.length > 0 && (
              <div className="flex gap-1">
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
            )}
          </div>
          
          <Button
            onClick={handleAssignToMe}
            disabled={isAssigning}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isAssigning ? "Assigning..." : "Assign to Me"}
          </Button>
        </div>
        
        {isOverdue && (
          <div className="mt-2 text-xs text-red-600 font-medium">
            ⚠️ This task is overdue!
          </div>
        )}
      </CardContent>
    </Card>
  )
}