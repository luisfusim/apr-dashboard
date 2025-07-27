import { PoolList } from './PoolList'
import { ThemeToggle } from './ThemeToggle'

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900 backdrop-blur-sm border-b border-blue-200/50 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AERODROME</h1>
              </div>
              <div className="hidden sm:block h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />
              <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">APR Dashboard</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Pool Analytics & Performance
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time APR data visualization and historical analysis for Aerodrome pools
          </p>
        </div>

        {/* Aerodrome Pools Content */}
        <PoolList />
      </div>
    </div>
  )
}
