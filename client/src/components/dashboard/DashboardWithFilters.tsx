import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateRangeFilter, type DateRange } from './DateRangeFilter';
import { PulseChart } from './PulseChart';
import { TrendingUp, TrendingDown, Users, MessageSquare, BarChart3, Calendar } from 'lucide-react';

interface DashboardData {
  currentPulse: number | null;
  trend: number;
  responseRate: number;
  totalEmployees: number;
  pulseHistory: Array<{
    date: string;
    score: number;
    responseCount: number;
  }>;
  recentComments: Array<{
    text: string;
    submittedAt: string;
  }>;
}

interface DashboardWithFiltersProps {
  teamId: string;
  teamName: string;
}

export function DashboardWithFilters({ teamId, teamName }: DashboardWithFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    label: 'Last 30 days'
  });

  // Fetch dashboard data with date filtering
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/teams', teamId, 'dashboard', dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      });
      
      const response = await fetch(`/api/teams/${teamId}/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!teamId,
  });

  const data: DashboardData = dashboardData || {
    currentPulse: null,
    trend: 0,
    responseRate: 0,
    totalEmployees: 0,
    pulseHistory: [],
    recentComments: []
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Team Analytics</h2>
            <p className="text-muted-foreground">{teamName}</p>
          </div>
          <div className="w-48 h-9 bg-muted animate-pulse rounded"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
        
        <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load dashboard data. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0.2) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -0.2) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getPulseColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResponseRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800';
    if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Analytics</h2>
          <p className="text-muted-foreground">{teamName} • {dateRange.label}</p>
        </div>
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          className="sm:w-auto"
        />
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Pulse */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Pulse</p>
                <p className={`text-2xl font-bold ${getPulseColor(data.currentPulse)}`}>
                  {data.currentPulse ? data.currentPulse.toFixed(1) : 'N/A'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            {data.trend !== 0 && (
              <div className="flex items-center mt-2">
                {getTrendIcon(data.trend)}
                <span className={`text-xs ml-1 ${
                  data.trend > 0 ? 'text-green-600' : data.trend < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)} from last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{data.responseRate}%</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <Badge variant="secondary" className={`mt-2 ${getResponseRateColor(data.responseRate)}`}>
              {data.responseRate >= 80 ? 'Excellent' : 
               data.responseRate >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        {/* Total Employees */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold">{data.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Active team members
            </p>
          </CardContent>
        </Card>

        {/* Data Points */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Responses</p>
                <p className="text-2xl font-bold">
                  {data.pulseHistory.reduce((sum, item) => sum + item.responseCount, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              In selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pulse Chart */}
      <PulseChart
        data={data.pulseHistory}
        currentPulse={data.currentPulse}
        trend={data.trend}
        responseRate={data.responseRate}
      />

      {/* Recent Comments */}
      {data.recentComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentComments.slice(0, 5).map((comment, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground mb-2">"{comment.text}"</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {data.recentComments.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{data.recentComments.length - 5} more comments in this period
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {data.pulseHistory.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No data for this period</h3>
            <p className="text-muted-foreground mb-4">
              Try selecting a different date range or send your first survey to start collecting data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}