"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"
import { ThemeToggle } from "./theme-toggle"

export function AppearanceSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icons.palette className="h-5 w-5" />
          <span>Appearance</span>
        </CardTitle>
        <CardDescription>Customize how the app looks and feels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
              Theme
            </label>
            <ThemeToggle />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Choose between light and dark mode for better viewing comfort
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}