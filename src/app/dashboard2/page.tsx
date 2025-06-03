// src/app/dashboard2/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { AppHeader } from "@/components/layout/app-header"
import Dashboard2Unified from "@/components/features/dashboard2-unified"

export default async function Dashboard2() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <AppHeader title="FamilyTasks" user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard2Unified user={session.user} />
      </main>
    </div>
  )
}
