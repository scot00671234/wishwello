import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Badge component - creating inline since it's not in shadcn
const Badge = ({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary'; 
  className?: string; 
}) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
    variant === 'secondary' 
      ? 'bg-gray-100 text-gray-800' 
      : 'bg-blue-100 text-blue-800'
  } ${className}`}>
    {children}
  </span>
);
import Navbar from '@/components/navigation/navbar';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit, 
  Users, 
  Clock, 
  MessageSquare, 
  Settings,
  Mail,
  Calendar,
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
  const [editFormData, setEditFormData] = useState({
    name: '',
    employees: '',
    questions: [] as Array<{ title: string; type: 'metric' | 'yesno' | 'comment'; isRequired: boolean }>,
    frequency: 'weekly',
    dayOfWeek: 1,
    hour: 9
  });

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    retry: false,
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data: { teamId: string; updates: any }) =>
      apiRequest(`/api/teams/${data.teamId}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Team updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update team',
        variant: 'destructive',
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) =>
      apiRequest(`/api/teams/${teamId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
        variant: 'destructive',
      });
    },
  });

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setEditFormData({
      name: team.name,
      employees: team.employees.map(e => e.email).join('\n'),
      questions: team.questions.map(q => ({
        title: q.title,
        type: q.type,
        isRequired: q.isRequired
      })),
      frequency: team.schedules[0]?.frequency || 'weekly',
      dayOfWeek: team.schedules[0]?.dayOfWeek || 1,
      hour: team.schedules[0]?.hour || 9
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam) return;

    const employees = editFormData.employees
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    updateTeamMutation.mutate({
      teamId: selectedTeam.id,
      updates: {
        name: editFormData.name,
        employees,
        questions: editFormData.questions,
        schedule: {
          frequency: editFormData.frequency,
          dayOfWeek: editFormData.dayOfWeek,
          hour: editFormData.hour
        }
      }
    });
  };

  const formatSchedule = (schedule: any) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const time = `${schedule.hour}:00`;
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
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team: {selectedTeam?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Team Name */}
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter team name"
              />
            </div>

            {/* Employee Emails */}
            <div>
              <Label htmlFor="employees">Employee Emails</Label>
              <Textarea
                id="employees"
                value={editFormData.employees}
                onChange={(e) => setEditFormData(prev => ({ ...prev, employees: e.target.value }))}
                placeholder="Enter one email per line"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                One email address per line. Changes will update the employee list.
              </p>
            </div>

            {/* Questions */}
            <div>
              <Label>Questions ({editFormData.questions.length})</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                {editFormData.questions.map((question, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="flex-1 truncate">{question.title}</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {question.type}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use the setup wizard to modify questions in detail.
              </p>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <Label>Check-in Schedule</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="frequency" className="text-xs">Frequency</Label>
                  <select
                    id="frequency"
                    value={editFormData.frequency}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dayOfWeek" className="text-xs">Day</Label>
                  <select
                    id="dayOfWeek"
                    value={editFormData.dayOfWeek}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="hour" className="text-xs">Hour</Label>
                  <select
                    id="hour"
                    value={editFormData.hour}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateTeam}
                disabled={updateTeamMutation.isPending || !editFormData.name.trim()}
              >
                {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}