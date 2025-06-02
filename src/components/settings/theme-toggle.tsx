"use client"

import { useEffect, useState } from "react"
import { Icons } from "@/components/ui/icons"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  // Always call hooks at the top level
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <div className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm">
          <Icons.sun className="h-4 w-4" />
          <span className="text-sm font-medium">Light</span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 rounded-md text-gray-600 dark:text-gray-400">
          <Icons.moon className="h-4 w-4" />
          <span className="text-sm font-medium">Dark</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
      <button
        onClick={() => setTheme("light")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          theme === "light"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        aria-label="Switch to light mode"
      >
        <Icons.sun className="h-4 w-4" />
        <span className="text-sm font-medium">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
          theme === "dark"
            ? "bg-gray-900 dark:bg-gray-600 text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        aria-label="Switch to dark mode"
      >
        <Icons.moon className="h-4 w-4" />
        <span className="text-sm font-medium">Dark</span>
      </button>
    </div>
  )
}