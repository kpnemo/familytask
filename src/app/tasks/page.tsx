import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { TaskList } from "@/components/features/task-list"
import { AppHeader } from "@/components/layout/app-header"

export default async function TasksPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const headerRightContent = session.user.role === "PARENT" ? (
    <Link href="/tasks/new">
      <Button>+ Create Task</Button>
    </Link>
  ) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader 
        title="Family Tasks" 
        user={session.user} 
        showBackButton={true} 
        rightContent={headerRightContent}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TaskList />
      </div>
    </div>
  )
}