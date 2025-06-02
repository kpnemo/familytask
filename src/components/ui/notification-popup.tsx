"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/ui/icons"
import { formatDateTime } from "@/lib/utils"

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

export function NotificationPopup() {
  const [count, setCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch unread count on mount
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

  // Fetch notifications when popup opens
  const fetchNotifications = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      fetchNotifications()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const markAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      })
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setCount(prev => {
          const deletedNotification = notifications.find(n => n.id === notificationId)
          return deletedNotification && !deletedNotification.read ? Math.max(0, prev - 1) : prev
        })
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
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_all" })
      })
      if (res.ok) {
        setNotifications([])
        setCount(0)
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
    setIsOpen(false) // Close popup when navigating
  }

  const togglePopup = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={togglePopup}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Icons.bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 
                       sm:right-0 sm:w-80 sm:max-w-none
                       md:right-0 md:w-96
                       transform -translate-x-2 sm:translate-x-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  disabled={actionLoading === "clear_all"}
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
                >
                  {actionLoading === "clear_all" ? "Clearing..." : "Clear All"}
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              <div className="space-y-1">
                {notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 relative ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between pr-8">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDateTime(new Date(notification.createdAt))}
                        </p>
                        {notification.relatedTask && (
                          <button
                            onClick={() => handleTaskClick(notification.relatedTask!.id)}
                            className="inline-block text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline mt-1 cursor-pointer"
                            title="Click to view task"
                          >
                            📝 Task: {notification.relatedTask.title}
                          </button>
                        )}
                        
                        {/* Mark as read button */}
                        <div className="flex gap-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              disabled={actionLoading === notification.id}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50"
                            >
                              {actionLoading === notification.id ? "Marking..." : "Mark read"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* X Delete Button */}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      disabled={actionLoading === notification.id}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
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
                      <div className="absolute top-3 right-10 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 10 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
              <span className="text-sm text-gray-500">Showing 10 of {notifications.length} notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}