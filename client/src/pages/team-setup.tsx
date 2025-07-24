import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/navigation/navbar';
import TeamSetupForm from '@/components/forms/team-setup-form';
import QuestionEditor from '@/components/forms/question-editor';
import { ArrowLeft, Users, Clock, MessageCircle, Save } from 'lucide-react';
import { Link } from 'wouter';

export default function TeamSetup() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [teamData, setTeamData] = useState({
    name: '',
    employees: [] as string[],
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 5, // Friday
      hour: 10, // 10 AM
    },
    questions: [] as any[],
  });

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

  const { data: templates } = useQuery({
    queryKey: ['/api/templates'],
    retry: false,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/teams', { name: data.name });
      return response.json();
    },
    onSuccess: (team) => {
      setTeamData(prev => ({ ...prev, teamId: team.id }));
      setCurrentStep(2);
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addEmployeesMutation = useMutation({
    mutationFn: async ({ teamId, emails }: { teamId: string; emails: string[] }) => {
      await apiRequest('POST', `/api/teams/${teamId}/employees`, { emails });
    },
    onSuccess: () => {
      setCurrentStep(3);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to add employees. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async ({ teamId, schedule }: { teamId: string; schedule: any }) => {
      await apiRequest('POST', `/api/teams/${teamId}/schedule`, schedule);
    },
    onSuccess: () => {
      setCurrentStep(4);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveQuestionsMutation = useMutation({
    mutationFn: async ({ teamId, questions }: { teamId: string; questions: any[] }) => {
      await apiRequest('POST', `/api/teams/${teamId}/questions`, { questions });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Team setup completed successfully!",
      });
      // Redirect to dashboard
      window.location.href = '/';
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to save questions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStepSubmit = (stepData: any) => {
    switch (currentStep) {
      case 1:
        createTeamMutation.mutate(stepData);
        break;
      case 2:
        setTeamData(prev => ({ ...prev, employees: stepData.employees }));
        addEmployeesMutation.mutate({
          teamId: (teamData as any).teamId,
          emails: stepData.employees,
        });
        break;
      case 3:
        setTeamData(prev => ({ ...prev, schedule: stepData }));
        saveScheduleMutation.mutate({
          teamId: (teamData as any).teamId,
          schedule: stepData,
        });
        break;
      case 4:
        setTeamData(prev => ({ ...prev, questions: stepData.questions }));
        saveQuestionsMutation.mutate({
          teamId: (teamData as any).teamId,
          questions: stepData.questions,
        });
        break;
    }
  };

  const loadTemplate = (template: any) => {
    const questions = template.questions.map((q: any, index: number) => ({
      ...q,
      order: index,
    }));
    setTeamData(prev => ({ ...prev, questions }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, title: 'Team Info', icon: Users },
    { id: 2, title: 'Add Employees', icon: Users },
    { id: 3, title: 'Schedule', icon: Clock },
    { id: 4, title: 'Questions', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Setup</h1>
              <p className="text-gray-600">Configure your team for wellbeing tracking</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                      isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                      'border-gray-300 bg-white text-gray-400'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Create Your Team</CardTitle>
                </CardHeader>
                <TeamSetupForm
                  initialData={{ name: teamData.name }}
                  onSubmit={handleStepSubmit}
                  isLoading={createTeamMutation.isPending}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Add Team Members</CardTitle>
                </CardHeader>
                <EmployeeForm
                  onSubmit={handleStepSubmit}
                  isLoading={addEmployeesMutation.isPending}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Configure Check-in Schedule</CardTitle>
                </CardHeader>
                <ScheduleForm
                  initialData={teamData.schedule}
                  onSubmit={handleStepSubmit}
                  isLoading={saveScheduleMutation.isPending}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Setup Questions</CardTitle>
                </CardHeader>
                
                {/* Templates */}
                {templates && templates.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Start Templates</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {templates.map((template: any) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          className="h-auto p-4 flex flex-col items-center space-y-2"
                          onClick={() => loadTemplate(template)}
                        >
                          <MessageCircle className="w-6 h-6" />
                          <span className="text-sm font-medium">{template.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <QuestionEditor
                  questions={teamData.questions}
                  onChange={(questions) => setTeamData(prev => ({ ...prev, questions }))}
                  onSubmit={handleStepSubmit}
                  isLoading={saveQuestionsMutation.isPending}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Employee Form Component
function EmployeeForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [employees, setEmployees] = useState<string[]>(['']);
  const [csvText, setCsvText] = useState('');

  const addEmployee = () => {
    setEmployees([...employees, '']);
  };

  const removeEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const updateEmployee = (index: number, email: string) => {
    const updated = [...employees];
    updated[index] = email;
    setEmployees(updated);
  };

  const handleCsvImport = () => {
    const emails = csvText
      .split(/[,\n\r\t]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    setEmployees([...employees.filter(e => e), ...emails]);
    setCsvText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = employees.filter(email => email && email.includes('@'));
    onSubmit({ employees: validEmails });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Employee Emails</Label>
        <div className="space-y-3 mt-2">
          {employees.map((email, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => updateEmployee(index, e.target.value)}
                placeholder="employee@company.com"
                className="flex-1"
              />
              {employees.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEmployee(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addEmployee}
          className="mt-3"
        >
          Add Another Employee
        </Button>
      </div>

      <div className="border-t pt-6">
        <Label>Bulk Import (CSV)</Label>
        <Textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Paste comma-separated emails here..."
          className="mt-2"
          rows={3}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCsvImport}
          className="mt-2"
        >
          Import from CSV
        </Button>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || employees.filter(e => e).length === 0}>
          {isLoading ? "Adding..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}

// Schedule Form Component
function ScheduleForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData: any; 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [schedule, setSchedule] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(schedule);
  };

  const dayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
  ];

  const hourOptions = Array.from({ length: 15 }, (_, i) => ({
    value: i + 6,
    label: `${i + 6}:00 ${i + 6 < 12 ? 'AM' : 'PM'}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label>Frequency</Label>
          <Select
            value={schedule.frequency}
            onValueChange={(value) => setSchedule({ ...schedule, frequency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Day of Week</Label>
          <Select
            value={schedule.dayOfWeek.toString()}
            onValueChange={(value) => setSchedule({ ...schedule, dayOfWeek: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map(day => (
                <SelectItem key={day.value} value={day.value.toString()}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Time</Label>
          <Select
            value={schedule.hour.toString()}
            onValueChange={(value) => setSchedule({ ...schedule, hour: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hourOptions.map(hour => (
                <SelectItem key={hour.value} value={hour.value.toString()}>
                  {hour.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
