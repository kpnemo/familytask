import Link from "next/link"
import { Icons } from "@/components/ui/icons"
import { NotificationPopup } from "@/components/ui/notification-popup"
import { UserMenu } from "@/components/ui/user-menu"

interface AppHeaderProps {
  title: string
  user: {
    name?: string | null
    email?: string | null
    role?: string
    id?: string
  }
  showBackButton?: boolean
  backHref?: string
  rightContent?: React.ReactNode
}

export function AppHeader({ title, user, showBackButton = false, backHref = "/dashboard", rightContent }: AppHeaderProps) {
  return (
    <header className="border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-40 border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backHref} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Icons.chevronLeft className="h-5 w-5" />
              </Link>
            )}
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {rightContent}
            <NotificationPopup />
            
            <Link href="/settings" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <Icons.settings className="h-5 w-5" />
            </Link>
            
            <UserMenu user={user} />
          </div>
        </div>
      </div>
    </header>
  )
}