"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeclineTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  onDecline: (reason: string) => Promise<void>
  taskTitle: string
  loading: boolean
}

export function DeclineTaskDialog({ 
  isOpen, 
  onClose, 
  onDecline, 
  taskTitle, 
  loading 
}: DeclineTaskDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (reason.length > 500) {
      setError("Reason must be under 500 characters")
      return
    }

    setError("")
    await onDecline(reason.trim())
    setReason("")
    onClose()
  }

  const handleClose = () => {
    setReason("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Decline Task</DialogTitle>
          <DialogDescription>
            Send "{taskTitle}" back to the child for rework. You can optionally explain what needs to be improved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for declining (optional)
              </Label>
              <textarea
                id="reason"
                placeholder="e.g., I checked your homework and found several math errors that need to be corrected. Please review problems 3, 7, and 12."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                maxLength={500}
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{error && <span className="text-red-500">{error}</span>}</span>
                <span>{reason.length}/500</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
            >
              {loading ? "Declining..." : "Decline Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}