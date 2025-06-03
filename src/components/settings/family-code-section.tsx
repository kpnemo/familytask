"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

interface FamilyCodeSectionProps {
  familyName: string
  familyCode: string
  userRole: string
}

export function FamilyCodeSection({ familyName, familyCode, userRole }: FamilyCodeSectionProps) {
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(familyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const regenerateFamilyCode = async () => {
    setIsRegenerating(true)
    try {
      const response = await fetch("/api/families/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to regenerate family code")
      }

      // Refresh the page to show the new code
      window.location.reload()
    } catch (error) {
      console.error("Error regenerating family code:", error)
      alert("Failed to regenerate family code. Please try again.")
    } finally {
      setIsRegenerating(false)
    }
  }

  const canManageFamily = userRole === "ADMIN_PARENT" || userRole === "PARENT"

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Family Name</label>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{familyName}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Role</label>
          <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
            {userRole === "ADMIN_PARENT" ? "Admin Parent" : 
             userRole === "PARENT" ? "Parent" : "Child"}
          </p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Family Invitation Code</label>
        <div className="mt-1 flex items-center space-x-3">
          <div className="flex-1 font-mono text-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm">
            {familyCode}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex items-center space-x-2"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            💡 Share this code with family members so they can join your family!
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            Family members will enter this code during registration to join your family and start earning points.
          </p>
        </div>
      </div>

      {canManageFamily && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Regenerate Family Code</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new invitation code. The old code will stop working.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={regenerateFamilyCode}
              disabled={isRegenerating}
              className="flex items-center space-x-2"
            >
              <Icons.chevronRight className="h-4 w-4" />
              <span>{isRegenerating ? "Regenerating..." : "Regenerate"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}