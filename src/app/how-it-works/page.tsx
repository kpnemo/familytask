import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            FamilyTasks
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-medium text-slate-900 mb-6 leading-tight">
            How FamilyTasks Works
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            A simple system that transforms everyday chores into engaging family activities. Here's how it all comes together.
          </p>
        </div>
      </section>

      {/* Getting Started */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Getting Started
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Set up your family in minutes and start building better habits together.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-medium text-slate-900 mb-4">
                1. Create Your Family
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Parents register and get a unique 8-character family code. Share this code with your family members so they can join your household.
              </p>
              <div className="bg-slate-100 rounded-lg p-4 font-mono text-slate-700">
                Family Code: <span className="font-bold">ABC12345</span>
              </div>
            </div>
            <div className="bg-slate-100 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <p className="text-slate-600">Family setup in settings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Styles */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Choose Your Dashboard Style
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Different views for different family members. Parents get detailed management tools, kids get fun, easy-to-use interfaces.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Style 1 - Classic</h3>
              <p className="text-slate-600 leading-relaxed">
                Clean, professional dashboard perfect for parents. Full task management and family oversight.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">🎨</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Style 2 - Modern</h3>
              <p className="text-slate-600 leading-relaxed">
                Contemporary card-based layout with enhanced visual feedback and modern design elements.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl">🎮</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Kids Style</h3>
              <p className="text-slate-600 leading-relaxed">
                Fun, colorful interface designed specifically for children. Large buttons, simple navigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Task Types */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Three Types of Tasks
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Flexible task system that adapts to your family's needs and different types of chores.
            </p>
          </div>

          <div className="space-y-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-medium text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">📝</span>
                  Regular Tasks
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Standard tasks with specific due dates and times. Perfect for scheduled chores like "Take out trash by 7 PM" or "Feed the dog at 6 AM".
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>• Set specific due dates and times</li>
                  <li>• Assign to specific family members</li>
                  <li>• Custom point values</li>
                  <li>• Recurring options available</li>
                </ul>
              </div>
              <div className="bg-slate-100 rounded-2xl p-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">Clean bedroom</h4>
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">5 pts</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Due: Today at 8:00 PM</p>
                  <div className="text-xs text-slate-500">Assigned to: Emma</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
              <div className="md:order-2">
                <h3 className="text-2xl font-medium text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">⭐</span>
                  Bonus Tasks
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Unassigned tasks that anyone can claim for extra points. Great for encouraging initiative and helping kids earn extra rewards.
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>• Available for self-assignment</li>
                  <li>• First-come, first-served basis</li>
                  <li>• Higher point values for motivation</li>
                  <li>• Builds responsibility and initiative</li>
                </ul>
              </div>
              <div className="md:order-1 bg-slate-100 rounded-2xl p-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">Organize garage</h4>
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">15 pts</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Available for anyone</p>
                  <button className="text-xs bg-slate-900 text-white px-3 py-1 rounded">Claim Task</button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-medium text-slate-900 mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">📅</span>
                  Due Date Only Tasks
                </h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  Tasks with just a date, no specific time. Perfect for flexible chores like "Mow the lawn this weekend" or "Study for test by Friday".
                </p>
                <ul className="text-slate-600 space-y-2">
                  <li>• Flexible completion timing</li>
                  <li>• Day-based deadlines</li>
                  <li>• Great for longer projects</li>
                  <li>• Reduces time pressure stress</li>
                </ul>
              </div>
              <div className="bg-slate-100 rounded-2xl p-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">Study for math test</h4>
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">10 pts</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Due: Friday (anytime)</p>
                  <div className="text-xs text-slate-500">Assigned to: Alex</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kid-Friendly Features */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Built for Kids
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple, intuitive design that makes it easy for children of all ages to participate and stay motivated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-medium text-slate-900 mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-green-600 text-sm">✓</span>
                  One-Click Completion
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Kids can mark tasks as complete with a single tap. Parents verify completion later.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-900 mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 bg-yellow-100 rounded flex items-center justify-center text-yellow-600 text-sm">⭐</span>
                  Instant Point Feedback
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  See points earned immediately and track progress toward family rewards and goals.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-900 mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-sm">🎯</span>
                  Clear Visual Progress
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Large, colorful indicators show what's due, what's complete, and what's available to claim.
                </p>
              </div>
            </div>

            <div className="bg-slate-100 rounded-2xl p-8">
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2">Your Tasks</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Make bed</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Done! +3 pts</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                      <span className="text-sm">Homework</span>
                      <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Complete</button>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">147 points</div>
                  <div className="text-sm text-slate-600">Total earned this week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Settings & Management */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Family Management
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Parents have full control over family settings, task creation, and reward management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Family Settings</h3>
              <p className="text-slate-600 leading-relaxed">
                Manage family members, set timezones, configure notifications, and customize dashboard preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">SMS Notifications</h3>
              <p className="text-slate-600 leading-relaxed">
                Optional text message alerts for task assignments, completions, and important family updates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Reward Shop</h3>
              <p className="text-slate-600 leading-relaxed">
                Parents can deduct points for real-world rewards like extra screen time or special treats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Join thousands of families who have transformed their household management with FamilyTasks.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-base">
              Create Your Family Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-slate-500 text-sm">
            &copy; 2025 FamilyTasks. Made with care for families everywhere.
          </div>
          <Link href="/" className="text-slate-500 hover:text-slate-900 text-sm">
            Back to Home
          </Link>
        </div>
      </footer>
    </div>
  )
}