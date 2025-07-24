import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';

interface StatsCardsProps {
  data: {
    currentPulse: number | null;
    trend: number;
    responseRate: number;
    totalEmployees: number;
  };
}

export default function StatsCards({ data }: StatsCardsProps) {
  const { currentPulse, trend, responseRate, totalEmployees } = data;

  const getPulseStatus = (score: number | null) => {
    if (score === null) return { status: 'No Data', color: 'text-gray-500', bgColor: 'bg-gray-50' };
    if (score >= 7.0) return { status: 'HEALTHY', color: 'text-green-700', bgColor: 'bg-green-50' };
    if (score >= 4.0) return { status: 'CAUTION', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    return { status: 'CRITICAL', color: 'text-red-700', bgColor: 'bg-red-50' };
  };

  const getRiskLevel = (score: number | null, trend: number) => {
    if (score === null) return { level: 'Unknown', color: 'text-gray-500', icon: Users };
    if (score >= 7.0 && trend >= 0) return { level: 'LOW', color: 'text-green-600', icon: TrendingUp };
    if (score >= 4.0 && trend > -2.0) return { level: 'MEDIUM', color: 'text-yellow-600', icon: AlertTriangle };
    return { level: 'HIGH', color: 'text-red-600', icon: TrendingDown };
  };

  const pulseStatus = getPulseStatus(currentPulse);
  const riskLevel = getRiskLevel(currentPulse, trend);
  const RiskIcon = riskLevel.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Current Pulse */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Current Pulse</span>
            <div 
              className={`w-3 h-3 rounded-full ${
                currentPulse === null ? 'bg-gray-400' :
                currentPulse >= 7.0 ? 'bg-green-500' :
                currentPulse >= 4.0 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
            />
          </div>
          <div className="text-3xl font-bold text-gray-900 font-mono mb-1">
            {currentPulse !== null ? currentPulse.toFixed(1) : '—'}
          </div>
          <div className="text-sm text-gray-500">
            {trend !== 0 && currentPulse !== null ? (
              <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)} from last week
              </span>
            ) : (
              'No previous data'
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response Rate */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Response Rate</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 font-mono mb-1">
            {responseRate}%
          </div>
          <div className="text-sm text-gray-500">
            {Math.round((responseRate / 100) * totalEmployees)}/{totalEmployees} responses
          </div>
        </CardContent>
      </Card>

      {/* Trend */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Trend</span>
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : trend < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <div className="w-4 h-4 bg-gray-400 rounded-full" />
            )}
          </div>
          <div className={`text-3xl font-bold font-mono mb-1 ${
            trend > 0 ? 'text-green-600' : 
            trend < 0 ? 'text-red-600' : 
            'text-gray-900'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            {Math.abs(trend) > 2 ? '⚠️ Significant change' : 'Normal variance'}
          </div>
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Risk Level</span>
            <RiskIcon className={`w-4 h-4 ${riskLevel.color}`} />
          </div>
          <div className={`text-xl font-bold mb-1 ${riskLevel.color}`}>
            {riskLevel.level}
          </div>
          <div className="text-sm text-gray-500">
            {riskLevel.level === 'LOW' ? 'Team is doing well' :
             riskLevel.level === 'MEDIUM' ? 'Monitor closely' :
             riskLevel.level === 'HIGH' ? 'Needs attention' :
             'Insufficient data'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
