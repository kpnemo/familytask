import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { EditTaskForm } from "@/components/forms/edit-task-form"

interface EditTaskPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get the task with full details
  const task = await db.task.findFirst({
    where: {
      id,
      family: {
        members: {
          some: { userId: session.user.id }
        }
      }
    },
    include: {
      creator: {
        select: { id: true, name: true, role: true }
      },
      assignee: {
        select: { id: true, name: true, role: true }
      },
      tags: {
        include: {
          tag: true
        }
      }
    }
  })

  if (!task) {
    notFound()
  }

  // Check permissions - only creator or parents can edit
  if (task.createdBy !== session.user.id && session.user.role === "CHILD") {
    redirect("/tasks")
  }

  // Only allow editing of pending tasks
  if (task.status !== "PENDING") {
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EditTaskForm task={{
          ...task,
          assignedTo: task.assignee?.id || task.assignedTo || ""
        }} />
      </div>
    </div>
  )
}