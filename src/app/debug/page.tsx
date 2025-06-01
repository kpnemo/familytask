import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function DebugPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Session Status:</h2>
        {session ? (
          <div>
            <p>✅ User is logged in</p>
            <p>Name: {session.user.name}</p>
            <p>Email: {session.user.email}</p>
            <p>ID: {session.user.id}</p>
          </div>
        ) : (
          <p>❌ No session found</p>
        )}
      </div>
    </div>
  )
}