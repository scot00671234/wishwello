import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/navigation/navbar';
import { DashboardWithFilters } from '@/components/dashboard/DashboardWithFilters';
import { Plus, Users, Settings } from 'lucide-react';
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

  const { data: teams = [], isLoading: teamsLoading } = useQuery<any[]>({
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
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-32">
          <div className="text-center">
            <div className="w-20 h-20 bg-black/5 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h1 className="text-4xl font-bold text-black mb-6">Welcome to Wish Wello!</h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Get started by creating your first team and setting up anonymous feedback collection.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/setup">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-full font-medium">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Team
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-full font-medium">
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
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header with Team Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-black mb-3">
              {selectedTeam?.name || 'Team Dashboard'}
            </h1>
            <p className="text-gray-600 text-lg">Monitor your team's wellbeing and get actionable insights</p>
          </div>
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            <Link href="/setup">
              <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium">
                <Plus className="w-4 h-4 mr-2" />
                New Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Team Navigation Cards */}
        {teams.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {teams.map((team: any) => (
              <div
                key={team.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTeamId === team.id
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className={`text-sm ${selectedTeamId === team.id ? 'text-gray-200' : 'text-gray-500'}`}>
                      {team.companyName || 'No company'}
                    </p>
                  </div>
                  <Users className={`h-5 w-5 ${selectedTeamId === team.id ? 'text-white' : 'text-gray-400'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

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
        ) : selectedTeam ? (
          <DashboardWithFilters 
            teamId={selectedTeamId}
            teamName={selectedTeam.name}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600 mb-6">
              Set up your team configuration and send the first check-in to see dashboard data.
            </p>
            <Link href="/teams">
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Manage Teams
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
