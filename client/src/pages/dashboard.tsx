import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/navigation/navbar';
import StatsCards from '@/components/dashboard/stats-cards';
import PulseChart from '@/components/dashboard/pulse-chart';
import FeedbackList from '@/components/dashboard/feedback-list';
import { Plus, Settings, Users, Bell, TrendingDown } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    retry: false,
  });

  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/teams', selectedTeamId, 'dashboard'],
    enabled: !!selectedTeamId,
    retry: false,
  });

  if (isLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Wish Wello!</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Get started by creating your first team and setting up anonymous feedback collection.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link href="/setup">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Team
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedTeam = teams.find((t: any) => t.id === selectedTeamId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedTeam?.name || 'Team Dashboard'}
            </h1>
            <p className="text-gray-600">Monitor your team's wellbeing and get actionable insights</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {teams.length > 1 && (
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
            <Link href="/setup">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Team
              </Button>
            </Link>
          </div>
        </div>

        {dashboardLoading ? (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ) : dashboardData ? (
          <>
            {/* Stats Cards */}
            <StatsCards data={dashboardData} />

            {/* Pulse Alert */}
            {dashboardData.trend < -2 && (
              <Card className="mb-8 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-900">Pulse Score Alert</div>
                    <div className="text-sm text-yellow-700">
                      Team pulse dropped by {Math.abs(dashboardData.trend).toFixed(1)} points. Consider scheduling a team check-in.
                    </div>
                  </div>
                  <Button className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white">
                    Take Action
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Chart and Comments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Pulse Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pulse Trend</span>
                    {dashboardData.trend < 0 && (
                      <div className="flex items-center text-red-500">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">
                          {dashboardData.trend.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <PulseChart data={dashboardData.pulseHistory} />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Comments */}
              <Card>
                <CardHeader>
                  <CardTitle>Anonymous Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeedbackList comments={dashboardData.recentComments} />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Settings className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Team Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure questions, schedule, and team members
                  </p>
                  <Link href="/setup">
                    <Button variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Invite Employees</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add team members and send feedback invitations
                  </p>
                  <Button variant="outline" className="w-full">
                    Invite
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Bell className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Alert Settings</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure when and how you receive notifications
                  </p>
                  <Button variant="outline" className="w-full">
                    Setup Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600 mb-6">
              Set up your team configuration and send the first check-in to see dashboard data.
            </p>
            <Link href="/setup">
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Setup Team
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
