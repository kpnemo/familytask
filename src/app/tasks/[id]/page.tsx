import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { AppHeader } from "@/components/layout/app-header"
import { TaskViewClient } from "@/components/tasks/task-view-client"
import { formatDateTime } from "@/lib/utils"

interface TaskPageProps {
  params: Promise<{ id: string }>
}

export default async function TaskPage({ params }: TaskPageProps) {
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
      verifier: {
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

  // Get user's family membership to check permissions
  const familyMembership = await db.familyMember.findFirst({
    where: { userId: session.user.id },
    include: { family: true }
  })

  const isParent = ["PARENT", "ADMIN_PARENT"].includes(familyMembership?.role || "")
  const isAssignee = task.assignedTo === session.user.id
  const isCreator = task.createdBy === session.user.id

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="Task Details" user={session.user} showBackButton={true} backHref="/tasks" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TaskViewClient
          task={task}
          isParent={isParent}
          isAssignee={isAssignee}
          isCreator={isCreator}
          currentUserId={session.user.id}
        />
      </main>
    </div>
  )
}