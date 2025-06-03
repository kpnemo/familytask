import { NextRequest, NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export async function GET(req: NextRequest) {
  try {
    const releaseNotesPath = join(process.cwd(), 'RELEASE-NOTES.md')
    
    if (!existsSync(releaseNotesPath)) {
      return NextResponse.json({
        success: false,
        error: { code: "NOT_FOUND", message: "Release notes not found" }
      }, { status: 404 })
    }

    const content = readFileSync(releaseNotesPath, 'utf8')
    
    // Parse the markdown content to extract versions
    const versions = parseReleaseNotes(content)
    
    return NextResponse.json({
      success: true,
      data: {
        content,
        versions
      }
    })

  } catch (error) {
    console.error("Error reading release notes:", error)
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

function parseReleaseNotes(content: string) {
  const lines = content.split('\n')
  const versions: Array<{
    version: string
    date: string
    changes: string[]
  }> = []
  
  let currentVersion: any = null
  
  for (const line of lines) {
    // Match version headers like "## [1.0.13] - 2025-01-06"
    const versionMatch = line.match(/^## \[(.+?)\] - (.+)$/)
    if (versionMatch) {
      if (currentVersion) {
        versions.push(currentVersion)
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        changes: []
      }
    } else if (currentVersion && line.startsWith('- ')) {
      // Add change items
      currentVersion.changes.push(line.substring(2))
    }
  }
  
  if (currentVersion) {
    versions.push(currentVersion)
  }
  
  return versions
}