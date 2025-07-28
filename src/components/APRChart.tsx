import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { type APRData } from '@/lib/supabase'

interface APRChartProps {
  data: APRData[]
  selectedProtocols: string[]
}

interface ChartDataPoint {
  date: string
  [protocol: string]: string | number
}

export function APRChart({ data, selectedProtocols }: APRChartProps) {
  // Filter data based on selected protocols
  const filteredData = data.filter(item => 
    selectedProtocols.length === 0 || selectedProtocols.includes(item.protocol)
  )

  // Group data by date and protocol for the chart
  const chartData = filteredData.reduce((acc: ChartDataPoint[], item) => {
    const date = new Date(item.date).getDate().toString()
    const existingEntry = acc.find((entry: ChartDataPoint) => entry.date === date)
    
    if (existingEntry) {
      existingEntry[item.protocol] = item.apr
    } else {
      acc.push({
        date,
        [item.protocol]: item.apr
      })
    }
    
    return acc
  }, [] as ChartDataPoint[])

  // Sort by date
  chartData.sort((a: ChartDataPoint, b: ChartDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate min and max APR values for Y-axis domain
  let minApr = Infinity
  let maxApr = -Infinity
  
  filteredData.forEach(item => {
    if (item.apr < minApr) minApr = item.apr
    if (item.apr > maxApr) maxApr = item.apr
  })
  
  // Calculate range and use dynamic padding based on data spread
  const range = maxApr - minApr
  const padding = Math.max(range * 0.05, 0.1) // 5% padding or minimum 0.1%
  
  const yAxisMin = Math.max(0, Math.floor((minApr - padding) * 10) / 10)
  const yAxisMax = Math.ceil((maxApr + padding) * 10) / 10
  
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
          content={({ active, payload, label }) => {
            if (!active || !payload || payload.length === 0) return null;
            
            // Find current data point index
            const currentIndex = chartData.findIndex(item => 
              item.date === label
            );
            const previousData = currentIndex > 0 ? chartData[currentIndex - 1] : null;
            
            // Get the full date from the current data point
             const currentData = chartData[currentIndex];
             const fullDate = currentData?.date 
               ? new Date(currentData.date).toLocaleDateString('en-US', {
                   weekday: 'long',
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric'
                 }) + ' at ' + new Date(currentData.date).toLocaleTimeString('en-US', {
                   hour: '2-digit',
                   minute: '2-digit',
                   hour12: true
                 })
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
                  
                  if (previousData && name === 'APR') {
                     if (previousData.apr !== null && previousData.apr !== undefined) {
                       const prevValue = Number(previousData.apr);
                       const change = value - prevValue;
                       const changePercent = ((change / prevValue) * 100).toFixed(2);
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
                        {value.toFixed(2)}%
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
