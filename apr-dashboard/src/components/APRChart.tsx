import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { type APRData } from '@/lib/supabase'

interface APRChartProps {
  data: APRData[]
  selectedProtocols: string[]
}

export function APRChart({ data, selectedProtocols }: APRChartProps) {
  // Filter data based on selected protocols
  const filteredData = data.filter(item => 
    selectedProtocols.length === 0 || selectedProtocols.includes(item.protocol)
  )

  // Group data by date and protocol for the chart
  const chartData = filteredData.reduce((acc: any[], item) => {
    const date = new Date(item.date).toLocaleDateString()
    const existingEntry = acc.find((entry: any) => entry.date === date)
    
    if (existingEntry) {
      existingEntry[item.protocol] = item.apr
    } else {
      acc.push({
        date,
        [item.protocol]: item.apr
      })
    }
    
    return acc
  }, [] as any[])

  // Sort by date
  chartData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate min and max APR values for Y-axis domain
  let minApr = Infinity
  let maxApr = -Infinity
  
  filteredData.forEach(item => {
    if (item.apr < minApr) minApr = item.apr
    if (item.apr > maxApr) maxApr = item.apr
  })
  
  // Add 10% padding to the top and set minimum to 0 or slightly below the minimum value
  const yAxisMin = Math.max(0, Math.floor(minApr * 0.9))
  const yAxisMax = Math.ceil(maxApr * 1.1)
  
  // Get unique protocols for line colors
  const protocols = [...new Set(filteredData.map(item => item.protocol))]
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#ff1493']

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ value: 'APR (%)', angle: -90, position: 'insideLeft' }}
          domain={[yAxisMin, yAxisMax]}
          allowDataOverflow={false}
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toFixed(2)}%`, 'APR']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        {protocols.map((protocol, index) => (
          <Line
            key={protocol}
            type="monotone"
            dataKey={protocol}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
