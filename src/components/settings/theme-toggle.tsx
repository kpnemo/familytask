"use client"

import { useState, useEffect } from "react"
import { Icons } from "@/components/ui/icons"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement
    
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => toggleTheme("light")}
        className={`p-2 rounded-lg transition-colors ${
          theme === "light"
            ? "bg-blue-100 text-blue-700"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        aria-label="Light mode"
      >
        <Icons.sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => toggleTheme("dark")}
        className={`p-2 rounded-lg transition-colors ${
          theme === "dark"
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
        aria-label="Dark mode"
      >
        <Icons.moon className="h-4 w-4" />
      </button>
    </div>
  )
}