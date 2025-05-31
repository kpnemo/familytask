import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { CreateTaskForm } from "@/components/forms/create-task-form"

export default async function NewTaskPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Only parents can create tasks
  if (session.user.role !== "PARENT") {
    redirect("/tasks")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/tasks" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Back to Tasks
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CreateTaskForm />
      </div>
    </div>
  )
}