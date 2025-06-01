"use client"

import { useState } from "react"
import { FamilyMembersSection } from "./family-members-section"

interface User {
  id: string
  name: string
  email: string
  role: "PARENT" | "CHILD"
  avatarUrl?: string
  createdAt: string
}

interface FamilyMember {
  id: string
  role: "ADMIN_PARENT" | "PARENT" | "CHILD"
  joinedAt: string
  user: User
}

interface FamilyMembersWrapperProps {
  initialMembers: FamilyMember[]
  userRole: "ADMIN_PARENT" | "PARENT" | "CHILD"
}

export function FamilyMembersWrapper({ 
  initialMembers, 
  userRole 
}: FamilyMembersWrapperProps) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers)

  const handleMemberUpdate = async (memberId: string, name: string) => {
    try {
      const response = await fetch(`/api/families/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update member')
      }

      const { data: updatedMember } = await response.json()

      // Update the member in our local state
      setMembers(prevMembers =>
        prevMembers.map(member =>
          member.id === memberId ? updatedMember : member
        )
      )
    } catch (error) {
      console.error('Error updating member:', error)
      alert(error instanceof Error ? error.message : 'Failed to update member')
      throw error
    }
  }

  const handleMemberRemove = async (memberId: string) => {
    try {
      const response = await fetch(`/api/families/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to remove member')
      }

      // Remove the member from our local state
      setMembers(prevMembers =>
        prevMembers.filter(member => member.id !== memberId)
      )
    } catch (error) {
      console.error('Error removing member:', error)
      alert(error instanceof Error ? error.message : 'Failed to remove member')
      throw error
    }
  }

  return (
    <FamilyMembersSection
      members={members}
      userRole={userRole}
      onMemberUpdate={handleMemberUpdate}
      onMemberRemove={handleMemberRemove}
    />
  )
}