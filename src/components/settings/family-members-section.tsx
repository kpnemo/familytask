"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  name: string
  email: string
  role: "PARENT" | "CHILD"
  avatarUrl?: string
  createdAt: string
  phoneNumber?: string | null
}

interface FamilyMember {
  id: string
  role: "ADMIN_PARENT" | "PARENT" | "CHILD"
  joinedAt: string
  user: User
}

interface FamilyMembersSectionProps {
  members: FamilyMember[]
  userRole: "ADMIN_PARENT" | "PARENT" | "CHILD"
  onMemberUpdate: (memberId: string, name: string) => Promise<void>
  onMemberRemove: (memberId: string) => Promise<void>
}

export function FamilyMembersSection({ 
  members, 
  userRole, 
  onMemberUpdate, 
  onMemberRemove 
}: FamilyMembersSectionProps) {
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [editName, setEditName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [removingMember, setRemovingMember] = useState<FamilyMember | null>(null)
  const [isClient, setIsClient] = useState(false)

  const canEdit = ["PARENT", "ADMIN_PARENT"].includes(userRole)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleEditClick = (member: FamilyMember) => {
    setEditingMember(member)
    setEditName(member.user.name)
  }

  const handleEditSave = async () => {
    if (!editingMember || !editName.trim()) return

    setIsLoading(true)
    try {
      await onMemberUpdate(editingMember.id, editName.trim())
      setEditingMember(null)
      setEditName("")
    } catch (error) {
      console.error("Failed to update member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveClick = (member: FamilyMember) => {
    setRemovingMember(member)
  }

  const handleRemoveConfirm = async () => {
    if (!removingMember) return

    setIsLoading(true)
    try {
      await onMemberRemove(removingMember.id)
      setRemovingMember(null)
    } catch (error) {
      console.error("Failed to remove member:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "ADMIN_PARENT":
        return "Admin Parent"
      case "PARENT":
        return "Parent"
      case "CHILD":
        return "Child"
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN_PARENT":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "PARENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "CHILD":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icons.users className="h-5 w-5" />
            <span>Family Members</span>
          </CardTitle>
          <CardDescription>
            {canEdit 
              ? "Manage family members - edit names and remove members" 
              : "View all family members"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <Icons.user className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {member.user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {member.user.email}
                    </div>
                    {/* Show phone number only if user has phoneNumber field (i.e., current user is a parent) and member has a phone number */}
                    {member.user.phoneNumber && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        📞 {member.user.phoneNumber}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {getRoleDisplay(member.role)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {isClient ? (
                          `Joined ${new Date(member.joinedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}`
                        ) : (
                          `Joined ${new Date(member.joinedAt).toISOString().split('T')[0]}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditClick(member)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                      title="Edit member name"
                    >
                      <Icons.edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveClick(member)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Icons.trash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8">
                <Icons.users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  No family members
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Family members will appear here once they join.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog 
        open={!!editingMember} 
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Name</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="memberName">Name</Label>
              <Input
                id="memberName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter member name"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={isLoading || !editName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog 
        open={!!removingMember} 
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to remove{" "}
              <span className="font-medium">{removingMember?.user.name}</span>{" "}
              from the family? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setRemovingMember(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}