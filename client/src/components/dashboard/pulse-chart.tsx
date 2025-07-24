import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PulseChartProps {
  data: Array<{
    date: string | Date;
    score: number;
    responseCount?: number;
  }>;
}

export default function PulseChart({ data }: PulseChartProps) {
  // Transform data to ensure proper formatting
  const chartData = data.map(item => ({
    date: typeof item.date === 'string' ? item.date : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: item.score,
    responseCount: item.responseCount || 0,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 7.0) return '#22C55E'; // Green
    if (score >= 4.0) return '#EAB308'; // Yellow
    return '#EF4444'; // Red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const responseCount = payload[0].payload.responseCount;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium" style={{ color: getScoreColor(score) }}>
              Pulse Score: {score.toFixed(1)}
            </span>
          </p>
          {responseCount > 0 && (
            <p className="text-xs text-gray-500">
              {responseCount} responses
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const color = getScoreColor(payload.score);
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={color} 
        stroke="white" 
        strokeWidth={2}
      />
    );
  };

  if (!chartData.length) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No pulse data available yet</p>
          <p className="text-sm">Data will appear after your first check-in</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="date" 
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          domain={[0, 10]}
          stroke="#6B7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#0070F3" 
          strokeWidth={3}
          dot={<CustomDot />}
          activeDot={{ r: 6, fill: '#0070F3', stroke: 'white', strokeWidth: 2 }}
        />
        {/* Add threshold lines */}
        <Line 
          type="monotone" 
          dataKey={() => 7} 
          stroke="#22C55E" 
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
        />
        <Line 
          type="monotone" 
          dataKey={() => 4} 
          stroke="#EAB308" 
          strokeWidth={1}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
