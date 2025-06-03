"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

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
  const router = useRouter()

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

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === "FAMILY_SETUP_GUIDE") {
      router.push("/settings")
    } else if (notification.relatedTask) {
      router.push(`/tasks/${notification.relatedTask.id}`)
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
            className={`bg-white rounded p-3 border-l-4 relative cursor-pointer hover:bg-gray-50 transition-colors ${
              notification.read ? 'border-l-gray-300' : 'border-l-yellow-500'
            } ${notification.type === 'FAMILY_SETUP_GUIDE' ? 'border-l-blue-500' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(new Date(notification.createdAt))}
                </p>
                {notification.type === "FAMILY_SETUP_GUIDE" && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    🔧 Click to go to Settings
                  </p>
                )}
                {notification.relatedTask && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTaskClick(notification.relatedTask!.id)
                    }}
                    className="inline-block text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 cursor-pointer"
                    title="Click to view task"
                  >
                    📝 Task: {notification.relatedTask.title}
                  </button>
                )}
                
                {/* Individual notification actions */}
                <div className="flex gap-2 mt-2">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      disabled={actionLoading === notification.id}
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {actionLoading === notification.id ? "Marking..." : "Mark Read"}
                    </button>
                  )}
                </div>
              </div>
              
              {/* X Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNotification(notification.id)
                }}
                disabled={actionLoading === notification.id}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                title="Delete notification"
              >
                {actionLoading === notification.id ? (
                  <Icons.circle className="w-4 h-4 animate-spin" />
                ) : (
                  <Icons.x className="w-4 h-4" />
                )}
              </button>
              
              {/* Unread indicator */}
              {!notification.read && (
                <div className="absolute top-3 right-10 w-2 h-2 bg-yellow-500 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}