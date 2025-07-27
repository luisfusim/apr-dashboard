import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type APRData } from '@/lib/supabase'
import { TrendingUp, TrendingDown, BarChart3, Calendar } from 'lucide-react'

interface StatisticsProps {
  data: APRData[]
  selectedProtocols: string[]
}

export function Statistics({ data, selectedProtocols }: StatisticsProps) {
  // Filter data based on selected protocols
  const filteredData = data.filter(item => 
    selectedProtocols.length === 0 || selectedProtocols.includes(item.protocol)
  )

  if (filteredData.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const aprs = filteredData.map(item => item.apr)
  const maxAPR = Math.max(...aprs)
  const minAPR = Math.min(...aprs)
  const avgAPR = aprs.reduce((sum, apr) => sum + apr, 0) / aprs.length
  const totalRecords = filteredData.length

  // Calculate trend (comparing first and last data points)
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const firstAPR = sortedData[0]?.apr || 0
  const lastAPR = sortedData[sortedData.length - 1]?.apr || 0
  const trend = lastAPR - firstAPR

  const stats = [
    {
      title: "Highest APR",
      value: `${maxAPR.toFixed(2)}%`,
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Lowest APR",
      value: `${minAPR.toFixed(2)}%`,
      icon: TrendingDown,
      color: "text-red-600"
    },
    {
      title: "Average APR",
      value: `${avgAPR.toFixed(2)}%`,
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Total Records",
      value: totalRecords.toString(),
      icon: Calendar,
      color: "text-purple-600"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {index === 2 && trend !== 0 && (
                <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(2)}% from start
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
