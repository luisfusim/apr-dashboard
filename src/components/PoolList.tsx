import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, type AerodromePool } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw, Search, BadgePercent, Vault, ArrowLeftRight, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PoolAPRHistory {
  scraped_at: string
  apr: number | null
  total_tvl: number | null
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | '180d' | 'custom'

interface TimeRangeOption {
  value: TimeRange
  label: string
  days: number | null
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: '24h', label: 'Last 24 Hours', days: 1 },
  { value: '7d', label: 'Last 7 Days', days: 7 },
  { value: '30d', label: 'Last 30 Days', days: 30 },
  { value: '90d', label: 'Last 90 Days', days: 90 },
  { value: '180d', label: 'Last 180 Days', days: 180 },
  { value: 'custom', label: 'Custom Range', days: null }
]

export function PoolList() {
  const [pools, setPools] = useState<AerodromePool[]>([])
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  const [poolHistory, setPoolHistory] = useState<PoolAPRHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Filter and sort pools by APR
  const filteredPools = useMemo(() => {
    return [...pools]
      .filter(pool => pool.pool_name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (b.apr || 0) - (a.apr || 0)) // Handle null values
  }, [pools, searchQuery])

  // Fetch unique pools with latest data
  useEffect(() => {
    fetchPools()
  }, [])

  // Set default custom dates when custom range is selected
  useEffect(() => {
    if (timeRange === 'custom' && !customStartDate && !customEndDate) {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      setCustomStartDate(sevenDaysAgo.toISOString().split('T')[0])
      setCustomEndDate(now.toISOString().split('T')[0])
    }
  }, [timeRange])

  // Refresh pool history when time range changes
  useEffect(() => {
    if (selectedPool) {
      fetchPoolHistory(selectedPool)
    }
  }, [timeRange, customStartDate, customEndDate])

  const fetchPools = async () => {
    try {
      setLoading(true)
      
      // Get the latest record for each pool
      const { data, error } = await supabase
        .from('aerodrome_pools')
        .select('*')
        .order('scraped_at', { ascending: false })

      if (error) throw error
      
      // Group by pool_name and get the latest entry for each
      const latestPools = data?.reduce((acc: AerodromePool[], pool) => {
        const existingPool = acc.find(p => p.pool_name === pool.pool_name)
        if (!existingPool) {
          acc.push(pool)
        }
        return acc
      }, []) || []
      
      // Sort by TVL descending
      latestPools.sort((a, b) => (b.total_tvl || 0) - (a.total_tvl || 0))
      
      setPools(latestPools)
    } catch (error) {
      console.error('Error fetching pools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPoolHistory = async (poolName: string) => {
    try {
      setHistoryLoading(true)
      
      let query = supabase
        .from('aerodrome_pools')
        .select('scraped_at, apr, total_tvl')
        .eq('pool_name', poolName)
        .order('scraped_at', { ascending: true })
      
      // Apply time range filter
      if (timeRange === 'custom') {
        if (customStartDate) {
          query = query.gte('scraped_at', `${customStartDate}T00:00:00`)
        }
        if (customEndDate) {
          query = query.lte('scraped_at', `${customEndDate}T23:59:59`)
        }
      } else {
        const option = timeRangeOptions.find(opt => opt.value === timeRange)
        if (option?.days) {
          const daysAgo = new Date()
          daysAgo.setDate(daysAgo.getDate() - option.days)
          query = query.gte('scraped_at', daysAgo.toISOString())
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setPoolHistory(data || [])
    } catch (error) {
      console.error('Error fetching pool history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handlePoolSelect = (poolName: string) => {
    setSelectedPool(poolName)
    fetchPoolHistory(poolName)
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  
  // Format currency with K/M suffix for chart labels
  const formatCurrencyCompact = (value: number | null) => {
    if (!value) return '$0'
    
    if (value >= 1000000) {
      return `$${Math.round(value / 1000000)}M`
    } else if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`
    } else {
      return `$${Math.round(value)}`
    }
  }

  const formatAPR = (apr: number | null) => {
    if (!apr) return '0.00%'
    return `${apr.toFixed(2)}%`
  }
  

  const getTimeRangeText = () => {
    if (timeRange === 'custom') {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate).toLocaleDateString()
        const end = new Date(customEndDate).toLocaleDateString()
        return `${start} - ${end}`
      }
      return 'Custom Range'
    }
    const option = timeRangeOptions.find(opt => opt.value === timeRange)
    return option?.label || 'Last 7 Days'
  }

  // Group history data by date for charts with improved date formatting
  const chartData = useMemo(() => {
    // Process dates to determine if we need to show hours or days+hours
    const dates = poolHistory.map(item => new Date(item.scraped_at))
    
    // Check if all dates are from the same day
    const allSameDay = dates.length > 0 && dates.every(date => 
      date.getDate() === dates[0].getDate() && 
      date.getMonth() === dates[0].getMonth() && 
      date.getFullYear() === dates[0].getFullYear()
    )
    
    return poolHistory.map(item => {
      const date = new Date(item.scraped_at)
      return {
        rawDate: date, // Store raw date for sorting and comparison
        date: date.toLocaleDateString(), // Keep this for backward compatibility
        formattedDate: allSameDay
          ? date.toLocaleTimeString([], { hour: '2-digit', hour12: false })
          : `${date.getDate()} ${date.toLocaleTimeString([], { hour: '2-digit', hour12: false })}`,
        apr: item.apr,
        total_tvl: item.total_tvl
      }
    }).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()) // Ensure chronological order
  }, [poolHistory])

  // Calculate min and max APR values for Y-axis domain
  const aprDomain = useMemo(() => {
    if (poolHistory.length === 0) return [0, 100]
    
    let minApr = Infinity
    let maxApr = -Infinity
    
    poolHistory.forEach(item => {
      if (item.apr !== null) {
        if (item.apr < minApr) minApr = item.apr
        if (item.apr > maxApr) maxApr = item.apr
      }
    })
    
    // Calculate range and use dynamic padding based on data spread
    const range = maxApr - minApr
    const padding = Math.max(range * 0.05, 0.1) // 5% padding or minimum 0.1%
    
    const yAxisMin = Math.max(0, Math.floor((minApr - padding) * 10) / 10)
    const yAxisMax = Math.ceil((maxApr + padding) * 10) / 10
    
    return [yAxisMin, yAxisMax]
  }, [poolHistory])

  // Calculate min and max TVL values for Y-axis domain
  const tvlDomain = useMemo(() => {
    if (poolHistory.length === 0) return [0, 1000000]
    
    let minTvl = Infinity
    let maxTvl = -Infinity
    
    poolHistory.forEach(item => {
      if (item.total_tvl !== null) {
        if (item.total_tvl < minTvl) minTvl = item.total_tvl
        if (item.total_tvl > maxTvl) maxTvl = item.total_tvl
      }
    })
    
    // Calculate range and use dynamic padding based on data spread
    const range = maxTvl - minTvl
    const padding = Math.max(range * 0.03, 1000) // 3% padding or minimum $1000
    
    const yAxisMin = Math.max(0, Math.floor(minTvl - padding))
    const yAxisMax = Math.ceil(maxTvl + padding)
    
    return [yAxisMin, yAxisMax]
  }, [poolHistory])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading pools...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedPool}</h2>
        
        {/* Time Range Select and Search Input */}
        <div className="flex items-center gap-2">
          {/* Time Range Select */}
          {selectedPool && (
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="relative w-full sm:w-80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                placeholder="Search pools..."
                className={cn(
                  "w-full h-10 pl-9 pr-3 py-2 rounded-md border border-slate-200 dark:border-slate-700",
                  "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full overflow-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                {/* Pool List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredPools.length > 0 ? (
                    filteredPools.map((pool) => (
                      <div
                        key={pool.id}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
                          selectedPool === pool.pool_name && "bg-blue-50 dark:bg-blue-900/20"
                        )}
                        onClick={() => {
                          handlePoolSelect(pool.pool_name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100">{pool.pool_name}</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">{formatAPR(pool.apr)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-slate-500 dark:text-slate-400">
                      No pools found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
           
          <Button onClick={fetchPools} variant="outline" size="icon" className="h-10 w-10">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Section - Full Width */}
      {selectedPool ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Custom Date Inputs */}
            {timeRange === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 mt-4">
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">From Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-slate-100 bg-white border-slate-300"
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">To Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-slate-100 bg-white border-slate-300"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <Button
                    size="sm"
                    onClick={() => selectedPool && fetchPoolHistory(selectedPool)}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Apply Range
                  </Button>
                </div>
              </div>
            )}
          </div>
                    {/* Pool Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Values */}
            <Card className="bg-white dark:bg-gray-900 backdrop-blur-sm border-blue-200/50 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-800 dark:text-slate-200">Current Values</CardTitle>
                  {poolHistory.length > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(poolHistory[poolHistory.length - 1].scraped_at).toLocaleString([], {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                  {/* Current APR */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                        <BadgePercent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current APR</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatAPR(poolHistory[poolHistory.length - 1]?.apr)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Current TVL */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                        <Vault className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current TVL</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(poolHistory[poolHistory.length - 1]?.total_tvl)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* 24h Volume */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                        <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">24h Volume</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-slate-100">$74,892</p>
                      </div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
            
            {/* APR Stats */}
            <Card className="bg-white dark:bg-gray-900 backdrop-blur-sm border-blue-200/50 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-200">APR Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg text-slate-700 dark:text-slate-300">Loading stats...</div>
                    </div>
                  ) : chartData.length > 0 ? (
                    <>
                      {/* Highest APR */}
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                            <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Highest APR</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatAPR(Math.max(...chartData.filter(d => d.apr !== null).map(d => d.apr || 0)))}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Average APR */}
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                            <Minus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average APR</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatAPR(
                                chartData.filter(d => d.apr !== null).reduce((acc, d) => acc + (d.apr || 0), 0) / chartData.filter(d => d.apr !== null).length
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Lowest APR */}
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                            <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lowest APR</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatAPR(Math.min(...chartData.filter(d => d.apr !== null).map(d => d.apr || 0)))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg text-slate-700 dark:text-slate-300">No data available</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* TVL Stats */}
            <Card className="bg-white dark:bg-gray-900 backdrop-blur-sm border-blue-200/50 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-200">TVL Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg text-slate-700 dark:text-slate-300">Loading stats...</div>
                    </div>
                  ) : chartData.length > 0 ? (
                    <>
                      {/* Highest TVL */}
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                            <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Highest TVL</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(Math.max(...chartData.filter(d => d.total_tvl !== null).map(d => d.total_tvl || 0)))}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Average TVL */}
                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-full">
                            <Minus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Average TVL</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(
                                chartData.filter(d => d.total_tvl !== null).reduce((acc, d) => acc + (d.total_tvl || 0), 0) / chartData.filter(d => d.total_tvl !== null).length
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Lowest TVL */}
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full">
                            <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lowest TVL</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(Math.min(...chartData.filter(d => d.total_tvl !== null).map(d => d.total_tvl || 0)))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-lg text-slate-700 dark:text-slate-300">No data available</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Combined APR & TVL Chart */}
            <Card className="bg-white dark:bg-gray-900 backdrop-blur-sm border-blue-200/50 dark:border-gray-800 lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-slate-800 dark:text-slate-200">APR & TVL History - {getTimeRangeText()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-lg text-slate-700 dark:text-slate-300">Loading chart...</div>
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 20, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} />
                        <XAxis 
                          dataKey="formattedDate" 
                          tick={{ fontSize: 12 }}
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          yAxisId="left"
                          orientation="left"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'APR (%)', angle: -90, position: 'insideLeft', offset: -15 }}
                          domain={aprDomain}
                          allowDataOverflow={false}
                          tickFormatter={(value) => `${value}%`}
                          stroke="#3b82f6"
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 12 }}
                          label={{ value: 'TVL ($)', angle: 90, position: 'insideRight', offset: -15 }}
                          domain={tvlDomain}
                          allowDataOverflow={false}
                          tickFormatter={(value) => formatCurrencyCompact(value)}
                          stroke="#9333ea"
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            
                            // Find current data point index
                            const currentIndex = chartData.findIndex(item => 
                              item.formattedDate === label
                            );
                            const previousData = currentIndex > 0 ? chartData[currentIndex - 1] : null;
                            
                            // Get the full date from the current data point
                            const currentData = chartData[currentIndex];
                            const fullDate = currentData?.rawDate instanceof Date 
                              ? `${currentData.rawDate.toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })} at ${currentData.rawDate.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}`
                              : label;
                            
                            return (
                              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                                <div className="text-slate-200 font-bold text-sm mb-2">
                                  {fullDate}
                                </div>
                                {payload.map((entry, index) => {
                                  const value = entry.value as number;
                                  const name = entry.name;
                                  let changeText = '';
                                  let changeColor = '#94a3b8';
                                  
                                  if (previousData) {
                                    if (name === 'APR' && previousData.apr !== null && previousData.apr !== undefined) {
                                      const change = value - previousData.apr;
                                      const changePercent = ((change / previousData.apr) * 100).toFixed(2);
                                      const changeSymbol = change >= 0 ? '+' : '';
                                      changeText = ` (${changeSymbol}${changePercent}%)`;
                                      changeColor = change >= 0 ? '#10b981' : '#ef4444';
                                    } else if (name === 'TVL' && previousData.total_tvl !== null && previousData.total_tvl !== undefined) {
                                      const change = value - previousData.total_tvl;
                                      const changePercent = ((change / previousData.total_tvl) * 100).toFixed(2);
                                      const changeSymbol = change >= 0 ? '+' : '';
                                      changeText = ` (${changeSymbol}${changePercent}%)`;
                                      changeColor = change >= 0 ? '#10b981' : '#ef4444';
                                    }
                                  }
                                  
                                  return (
                                    <div key={index} className="flex items-center text-sm mb-1">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-slate-200 font-medium">{name}: </span>
                                      <span className="text-slate-100">
                                        {name === 'APR' 
                                          ? `${value.toFixed(2)}%` 
                                          : new Intl.NumberFormat('en-US', {
                                              style: 'currency',
                                              currency: 'USD',
                                              minimumFractionDigits: 0,
                                              maximumFractionDigits: 0,
                                            }).format(value)
                                        }
                                        {changeText && (
                                          <span style={{ color: changeColor, marginLeft: '4px' }}>
                                            {changeText}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }}
                          contentStyle={{
                            backgroundColor: 'rgba(30, 41, 59, 0.95)',
                            border: '1px solid rgba(100, 116, 139, 0.5)',
                            borderRadius: '8px',
                            color: '#e2e8f0',
                            padding: '12px',
                            fontSize: '14px',
                            minWidth: '200px'
                          }}
                          itemStyle={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}
                          labelStyle={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="apr"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          name="APR"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="total_tvl"
                          stroke="#9333ea"
                          strokeWidth={2}
                          dot={{ fill: '#9333ea', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                          name="TVL"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-lg text-slate-700 dark:text-slate-300">No data available</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg text-slate-700 dark:text-slate-300">Loading pools...</div>
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
              <Search className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-2" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No pools found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Try a different search term or clear the search box
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg border-slate-300 dark:border-slate-700">
              <Search className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-2" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Select a pool to view analytics</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Use the search box above to find and select a pool to view its APR history and TVL data
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
