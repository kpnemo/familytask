"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TaskFiltersProps {
  filters: {
    status: string
    assignedTo: string
    createdBy: string
  }
  onFiltersChange: (filters: { status: string; assignedTo: string; createdBy: string }) => void
}

interface FamilyMember {
  id: string
  name: string
  role: string
}

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const { data: session } = useSession()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        const response = await fetch("/api/families/members")
        const result = await response.json()
        
        if (result.success) {
          setFamilyMembers(result.data.map((member: { user: { id: string; name: string; role: string } }) => ({
            id: member.user.id,
            name: member.user.name,
            role: member.user.role
          })))
        }
      } catch (error) {
        console.error("Error fetching family members:", error)
      }
    }

    fetchFamilyMembers()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      status: "",
      assignedTo: "",
      createdBy: ""
    })
  }

  const hasActiveFilters = filters.status || filters.assignedTo || filters.createdBy
  const isChild = session?.user.role === "CHILD"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Show dropdowns only for parents */}
        {!isChild && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="AVAILABLE">Available Bonus</option>
                <option value="COMPLETED">Completed</option>
                <option value="VERIFIED">Verified</option>
              </select>
            </div>

            {/* Assigned To Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange("assignedTo", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Members</option>
                {session?.user.id && (
                  <option value={session.user.id}>My Tasks</option>
                )}
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Created By Filter (only for parents) */}
            {session?.user.role === "PARENT" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>
                <select
                  value={filters.createdBy}
                  onChange={(e) => handleFilterChange("createdBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Creators</option>
                  <option value={session.user.id}>Created by Me</option>
                  {familyMembers
                    .filter(member => member.role === "PARENT" && member.id !== session.user.id)
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Clear Filters Button */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Status Filter Buttons */}
        <div className={`${!isChild ? 'mt-4' : ''} flex flex-wrap gap-2`}>
          {/* Show All button */}
          <Button
            variant={!filters.status ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("status", "")}
          >
            Show All
          </Button>

          {/* Status-specific buttons */}
          <Button
            variant={filters.status === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("status", 
              filters.status === "PENDING" ? "" : "PENDING"
            )}
          >
            Pending
          </Button>

          <Button
            variant={filters.status === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("status", 
              filters.status === "COMPLETED" ? "" : "COMPLETED"
            )}
          >
            Completed
          </Button>

          <Button
            variant={filters.status === "VERIFIED" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("status", 
              filters.status === "VERIFIED" ? "" : "VERIFIED"
            )}
          >
            Verified
          </Button>

          <Button
            variant={filters.status === "AVAILABLE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("status", 
              filters.status === "AVAILABLE" ? "" : "AVAILABLE"
            )}
            className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
          >
            💰 Bonus
          </Button>

          {/* Parent-only buttons */}
          {!isChild && (
            <>
              <Button
                variant={filters.assignedTo === session?.user.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange("assignedTo", 
                  filters.assignedTo === session?.user.id ? "" : session?.user.id || ""
                )}
              >
                My Tasks
              </Button>

              {session?.user.role === "PARENT" && (
                <Button
                  variant={filters.createdBy === session.user.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange("createdBy", 
                    filters.createdBy === session.user.id ? "" : session.user.id
                  )}
                >
                  Created by Me
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}