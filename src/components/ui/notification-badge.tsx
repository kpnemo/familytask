"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Icons } from "@/components/ui/icons"

export function NotificationBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count")
        const data = await res.json()
        if (data.success) setCount(data.count)
      } catch (error) {
        console.error("Error fetching count:", error)
      }
    }
    fetchCount()
  }, [])

  return (
    <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
      <Icons.bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}