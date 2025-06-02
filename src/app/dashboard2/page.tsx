// src/app/dashboard2/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AppHeader } from "@/components/layout/app-header"
import Dashboard2Parent from "@/components/features/dashboard2-parent"
import Dashboard2Kid from "@/components/features/dashboard2-kid"

export default async function Dashboard2() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="FamilyTasks" user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {session.user.role === "PARENT" ? (
          <Dashboard2Parent user={session.user} />
        ) : (
          <Dashboard2Kid user={session.user} />
        )}
      </main>
    </div>
  )
}
