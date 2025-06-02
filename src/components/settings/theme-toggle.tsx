"use client"

import { useEffect, useState } from "react"
import { Icons } from "@/components/ui/icons"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    setMounted(true)
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme")
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme as "light" | "dark")
    
    // Apply theme to document
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

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
        onClick={() => handleThemeChange("light")}
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
        onClick={() => handleThemeChange("dark")}
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