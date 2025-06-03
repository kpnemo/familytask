"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: string
  name: string
  email: string
  timezone: string
}

interface TimezoneSettingsProps {
  user: User
}

export function TimezoneSection({ user }: TimezoneSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState(user.timezone)
  const [error, setError] = useState("")
  const [currentTime, setCurrentTime] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  // Get user's detected timezone
  const detectedTimezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"

  useEffect(() => {
    setIsMounted(true)
    // Auto-detect and suggest timezone if user is on UTC (default)
    if (user.timezone === "UTC" && detectedTimezone !== "UTC") {
      setSelectedTimezone(detectedTimezone)
    }
    // Update current time
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString())
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [user.timezone, detectedTimezone])

  const handleUpdateTimezone = async () => {
    if (selectedTimezone === user.timezone) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/user/timezone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ timezone: selectedTimezone })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error?.message || "Failed to update timezone")
        return
      }

      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Common timezones
  const commonTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago", 
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney"
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timezone Settings</CardTitle>
        <CardDescription>
          Set your timezone for accurate task due dates and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Your Timezone</Label>
          <select
            id="timezone"
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Detected timezone first if not in common list */}
            {isMounted && !commonTimezones.includes(detectedTimezone) && (
              <option value={detectedTimezone}>
                {detectedTimezone} (Detected)
              </option>
            )}
            
            {/* Common timezones */}
            {commonTimezones.map(tz => (
              <option key={tz} value={tz}>
                {tz} {isMounted && tz === detectedTimezone ? "(Detected)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Current timezone:</strong> {user.timezone}</p>
          {isMounted && detectedTimezone !== user.timezone && (
            <p><strong>Detected timezone:</strong> {detectedTimezone}</p>
          )}
          {isMounted && (
            <p><strong>Current time:</strong> {currentTime}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          onClick={handleUpdateTimezone}
          disabled={isLoading || selectedTimezone === user.timezone}
          className="w-full"
        >
          {isLoading ? "Updating..." : "Update Timezone"}
        </Button>
      </CardContent>
    </Card>
  )
}