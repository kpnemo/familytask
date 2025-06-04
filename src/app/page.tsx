import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard")
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-semibold text-slate-900">FamilyTasks</div>
          <div className="flex items-center gap-6">
            <Link href="/how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
              How it Works
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
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium text-slate-900 mb-6 leading-tight">
            Turn household chores into
            <span className="block text-slate-600 mt-2">family achievements</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            A simple, elegant way to motivate your family. Create tasks, track progress, 
            and celebrate accomplishments together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 text-base">
                Start Your Family Journey
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-base">
                I Already Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Built for modern families
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple tools that help families work together, stay motivated, and build lasting habits.
            </p>
            <div className="mt-8">
              <Link href="/how-it-works" className="inline-flex items-center text-slate-900 hover:text-slate-700 font-medium">
                See how it works
                <span className="ml-2">→</span>
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Smart Task Creation</h3>
              <p className="text-slate-600 leading-relaxed">
                Create meaningful tasks with custom point values. Set up recurring chores or one-time projects with ease.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Instant Motivation</h3>
              <p className="text-slate-600 leading-relaxed">
                Real-time progress tracking and point systems that keep everyone engaged and excited to contribute.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-medium text-slate-900 mb-3">Family Analytics</h3>
              <p className="text-slate-600 leading-relaxed">
                Beautiful insights into your family's productivity, with celebrations for milestones and achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-white mb-4">
            Ready to transform your household?
          </h2>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Join families who have already discovered the joy of working together towards common goals.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 text-base">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center text-slate-500 text-sm">
          <p>&copy; 2025 FamilyTasks. Made with care for families everywhere.</p>
        </div>
      </footer>
    </div>
  )
}