"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/ui/icons"

interface Version {
  version: string
  date: string
  changes: string[]
}

interface ReleaseNotesData {
  content: string
  versions: Version[]
}

export default function ReleaseNotesPage() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReleaseNotes = async () => {
      try {
        const response = await fetch("/api/release-notes")
        const result = await response.json()
        
        if (result.success) {
          setReleaseNotes(result.data)
        } else {
          setError(result.error?.message || "Failed to load release notes")
        }
      } catch (error) {
        setError("Failed to load release notes")
      } finally {
        setLoading(false)
      }
    }

    fetchReleaseNotes()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex items-center justify-center">
        <Icons.circle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Icons.warning className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-semibold">Unable to Load Release Notes</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Icons.chevronLeft className="h-6 w-6" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Release Notes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                What's new in FamilyTasks
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {releaseNotes?.versions.map((version, index) => (
            <Card key={version.version} className={index === 0 ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10" : ""}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? "bg-blue-500" : "bg-gray-300"}`} />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Version {version.version}
                      {index === 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Latest
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{version.date}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {version.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <Icons.check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{change}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          
          {(!releaseNotes?.versions || releaseNotes.versions.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Icons.circle className="h-12 w-12 text-gray-400 mx-auto" />
                  <h2 className="text-lg font-semibold">No Release Notes Available</h2>
                  <p className="text-gray-600">Release notes will appear here when available.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}