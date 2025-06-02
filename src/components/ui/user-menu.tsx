"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
    id?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [points, setPoints] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch user points
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch("/api/user/points")
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setPoints(data.points || 0)
          }
        }
      } catch (error) {
        console.error("Error fetching points:", error)
      }
    }
    if (user.id) {
      fetchPoints()
    }
  }, [user.id])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors"
      >
        <Avatar>
          <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium">
            {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
        </div>
        <Icons.chevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-medium">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Points Display */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icons.points className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Points</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{points}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/tasks/new"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Icons.plus className="h-4 w-4" />
              <span>New Task</span>
            </Link>

            <Link
              href="/tasks"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Icons.tasks className="h-4 w-4" />
              <span>Tasks</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Icons.settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            
            <Link
              href="/points"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Icons.points className="h-4 w-4" />
              <span>Points & Rewards</span>
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <Link
                href="/api/auth/signout"
                className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Icons.logout className="h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}