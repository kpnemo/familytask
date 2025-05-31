"use client"

import { useState, useEffect } from "react"
import { formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  relatedTask?: {
    id: string
    title: string
  }
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications")
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data)
        } else {
          setError("Failed to load notifications")
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setError("Error loading notifications")
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      setError("Request timeout")
      setLoading(false)
    }, 10000)

    fetchNotifications().finally(() => {
      clearTimeout(timeoutId)
    })
  }, [])

  const markAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        )
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const clearAllNotifications = async () => {
    setActionLoading("clear_all")
    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "delete_all" })
      })

      if (response.ok) {
        setNotifications([])
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    setActionLoading("mark_all")
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "clear_all" })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-yellow-600">Loading notifications...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (notifications.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-yellow-600">No notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''} 
          {unreadCount > 0 && (
            <span className="ml-1 text-yellow-600 font-medium">
              ({unreadCount} unread)
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              disabled={actionLoading === "mark_all"}
              className="text-xs"
            >
              {actionLoading === "mark_all" ? "Marking..." : "Mark All Read"}
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={clearAllNotifications}
            disabled={actionLoading === "clear_all"}
            className="text-xs"
          >
            {actionLoading === "clear_all" ? "Clearing..." : "Clear All"}
          </Button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`bg-white rounded p-3 border-l-4 ${
              notification.read ? 'border-l-gray-300' : 'border-l-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(new Date(notification.createdAt))}
                </p>
                {notification.relatedTask && (
                  <p className="text-xs text-blue-600 mt-1">
                    Related to: {notification.relatedTask.title}
                  </p>
                )}
                
                {/* Individual notification actions */}
                <div className="flex gap-2 mt-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={actionLoading === notification.id}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {actionLoading === notification.id ? "Marking..." : "Mark Read"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    disabled={actionLoading === notification.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {actionLoading === notification.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}