import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PulseData {
  date: string;
  score: number;
  responseCount: number;
}

interface PulseChartProps {
  data: PulseData[];
  currentPulse: number | null;
  trend: number;
  responseRate: number;
}

export function PulseChart({ data, currentPulse, trend, responseRate }: PulseChartProps) {
  const getTrendIcon = () => {
    if (trend > 0.2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -0.2) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend > 0.2) return 'text-green-500';
    if (trend < -0.2) return 'text-red-500';
    return 'text-gray-500';
  };

  const getPulseColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Pulse Score
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Weekly wellbeing trend • {responseRate}% response rate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Score Display */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${getPulseColor(currentPulse)}`}>
              {currentPulse ? currentPulse.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              Current Pulse Score
            </div>
          </div>

          {/* Chart */}
          {data.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name === 'score' ? value.toFixed(1) : value,
                      name === 'score' ? 'Pulse Score' : 'Responses'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Pulse Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="text-lg font-medium">No data yet</div>
                <div className="text-sm">Send your first survey to see trends</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}