"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function DashboardStyleSection() {
  const [currentStyle, setCurrentStyle] = useState<string>("STYLE1")
  const [isLoading, setIsLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    const fetchDashboardStyle = async () => {
      try {
        const response = await fetch("/api/user/dashboard-style")
        const result = await response.json()
        
        if (result.success) {
          setCurrentStyle(result.data.dashboardStyle)
          setUserRole(result.data.role)
        }
      } catch (error) {
        console.error("Error fetching dashboard style:", error)
      }
    }

    fetchDashboardStyle()
  }, [])

  const updateDashboardStyle = async (style: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/dashboard-style", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ dashboardStyle: style })
      })

      const result = await response.json()
      
      if (result.success) {
        setCurrentStyle(result.data.dashboardStyle)
        // Reload the page to show the new dashboard style
        window.location.href = "/dashboard"
      } else {
        console.error("Failed to update dashboard style:", result.error?.message)
      }
    } catch (error) {
      console.error("Error updating dashboard style:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Style</CardTitle>
        <CardDescription>
          Choose your preferred dashboard layout and design
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Style 1 - Classic */}
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            currentStyle === "STYLE1" 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}>
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-3 relative overflow-hidden">
              <div className="absolute inset-2 space-y-1">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="flex gap-1 mt-2">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Classic Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Traditional layout with quick actions and weekly view
              </p>
              <Button
                onClick={() => updateDashboardStyle("STYLE1")}
                disabled={isLoading}
                variant={currentStyle === "STYLE1" ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                {currentStyle === "STYLE1" ? "Current Style" : "Select Style"}
              </Button>
            </div>
          </div>

          {/* Style 2 - Modern */}
          <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            currentStyle === "STYLE2" 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          }`}>
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-3 relative overflow-hidden">
              <div className="absolute inset-2 space-y-1">
                <div className="h-2 bg-blue-300 dark:bg-blue-600 rounded"></div>
                <div className="h-2 bg-green-300 dark:bg-green-600 rounded w-2/3"></div>
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <div className="h-6 bg-blue-300 dark:bg-blue-600 rounded"></div>
                  <div className="h-6 bg-green-300 dark:bg-green-600 rounded"></div>
                  <div className="h-6 bg-purple-300 dark:bg-purple-600 rounded"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Enhanced Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userRole === "CHILD" 
                  ? "Kid-friendly interface with engaging task cards" 
                  : "Modern layout with enhanced task management"}
              </p>
              <Button
                onClick={() => updateDashboardStyle("STYLE2")}
                disabled={isLoading}
                variant={currentStyle === "STYLE2" ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                {currentStyle === "STYLE2" ? "Current Style" : "Select Style"}
              </Button>
            </div>
          </div>

          {/* Kids Style - Simple */}
          {userRole === "CHILD" && (
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              currentStyle === "KIDS_STYLE" 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}>
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-3 relative overflow-hidden">
                <div className="absolute inset-2 space-y-1">
                  <div className="h-3 bg-green-300 dark:bg-green-600 rounded flex items-center justify-center text-xs text-white">
                    Today
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-yellow-300 dark:bg-yellow-600 rounded"></div>
                    <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded"></div>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-2">
                    👋 Hi!
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Kids Style</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simple view showing only today's tasks - perfect for young kids!
                </p>
                <Button
                  onClick={() => updateDashboardStyle("KIDS_STYLE")}
                  disabled={isLoading}
                  variant={currentStyle === "KIDS_STYLE" ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {currentStyle === "KIDS_STYLE" ? "Current Style" : "Select Style"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {userRole === "CHILD" && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> The Enhanced Dashboard is designed especially for kids with a more engaging and visual interface!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}