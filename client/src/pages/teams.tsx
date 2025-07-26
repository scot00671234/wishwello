import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/navigation/navbar';
import { NotificationManager } from '@/components/teams/NotificationManager';
import { TeamEditDialog } from '@/components/teams/TeamEditDialog';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit, 
  Users, 
  Clock, 
  MessageSquare, 
  Settings,
  Trash2,
  Eye
} from 'lucide-react';
import { Link } from 'wouter';

interface Team {
  id: string;
  name: string;
  managerId: string;
  createdAt: string;
  employees: Array<{
    id: string;
    email: string;
    isActive: boolean;
  }>;
  questions: Array<{
    id: string;
    title: string;
    type: 'metric' | 'yesno' | 'comment';
    isRequired: boolean;
    order: number;
  }>;
  schedules: Array<{
    id: string;
    frequency: string;
    dayOfWeek: number;
    hour: number;
    isActive: boolean;
    lastSentAt?: string;
  }>;
}

export default function Teams() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    enabled: isAuthenticated,
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return apiRequest('DELETE', `/api/teams/${teamId}`);
    },
    onSuccess: () => {
      toast({
        title: "Team Deleted",
        description: "Team has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setSelectedTeam(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  });

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsEditDialogOpen(true);
  };

  const formatSchedule = (schedule: Team['schedules'][0]) => {
    if (!schedule) return 'No schedule';
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const time = `${schedule.hour.toString().padStart(2, '0')}:00`;
    
    return `${schedule.frequency} on ${days[schedule.dayOfWeek]} at ${time}`;
  };

  if (authLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600">Manage your teams, employees, questions, and schedules</p>
          </div>
          <Link href="/setup">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Team
            </Button>
          </Link>
        </div>

        {/* Teams Grid */}
        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team: Team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{team.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        Created {new Date(team.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(team)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this team?')) {
                            deleteTeamMutation.mutate(team.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Employees */}
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {team.employees?.length || 0} employees
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {team.employees?.filter(e => e.isActive).length || 0} active
                    </Badge>
                  </div>

                  {/* Questions */}
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {team.questions?.length || 0} questions
                    </span>
                  </div>

                  {/* Schedule */}
                  {team.schedules && team.schedules.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-600">
                          {formatSchedule(team.schedules[0])}
                        </div>
                        {team.schedules[0].lastSentAt && (
                          <div className="text-xs text-gray-500">
                            Last sent: {new Date(team.schedules[0].lastSentAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2 border-t">
                    <Link href={`/dashboard?team=${team.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openEditDialog(team)}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first team to start collecting employee feedback.
            </p>
            <Link href="/setup">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </Link>
          </div>
        )}

        {/* Notification Manager for Selected Team */}
        {selectedTeam && (
          <div className="mt-8">
            <NotificationManager 
              teamId={selectedTeam.id} 
              teamName={selectedTeam.name}
            />
          </div>
        )}
      </div>

      {/* Edit Team Dialog */}
      <TeamEditDialog 
        team={selectedTeam}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </div>
  );
}