import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/navigation/navbar';
import { SurveyDeadlineManager } from '@/components/teams/SurveyDeadlineManager';
import { ShareLinkCard } from '@/components/teams/ShareLinkCard';
import QuestionEditor from '@/components/forms/question-editor';
import { ArrowLeft, Users, Calendar, MessageCircle, Link2, CheckCircle, Plus } from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface Question {
  title: string;
  type: 'metric' | 'yesno' | 'comment';
  isRequired: boolean;
  order: number;
}

export default function TeamSetupNew() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [teamData, setTeamData] = useState({
    name: '',
    employees: [] as string[],
    questions: [] as Question[],
  });
  const [createdTeam, setCreatedTeam] = useState<any>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; employees: string[]; questions: Question[] }) => {
      // Create team
      const teamResponse = await apiRequest('POST', '/api/teams', { name: data.name });
      const team = await teamResponse.json();

      // Add employees
      if (data.employees.length > 0) {
        await apiRequest('POST', `/api/teams/${team.id}/employees`, { 
          employees: data.employees.map(email => ({ email, teamId: team.id }))
        });
      }

      // Add questions
      if (data.questions.length > 0) {
        await apiRequest('POST', `/api/teams/${team.id}/questions`, { 
          questions: data.questions.map((q, index) => ({
            ...q,
            teamId: team.id,
            order: index + 1
          }))
        });
      }

      return team;
    },
    onSuccess: (team) => {
      setCreatedTeam(team);
      setCurrentStep(4); // Jump to completion step
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({
        title: "Team Created Successfully!",
        description: `${team.name} is ready for surveys. Share the link with your team.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 1 && !teamData.name.trim()) {
      toast({
        title: "Team Name Required",
        description: "Please enter a team name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - create team
      const employees = teamData.employees.filter(email => email.trim() && email.includes('@'));
      createTeamMutation.mutate({
        name: teamData.name,
        employees,
        questions: teamData.questions,
      });
    }
  };

  const parseEmails = (text: string) => {
    // Extract emails from various formats
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches)); // Remove duplicates
  };

  const handleEmailsChange = (value: string) => {
    const emails = value.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);
    setTeamData(prev => ({ ...prev, employees: emails }));
  };

  const handleEmailPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const extractedEmails = parseEmails(pastedText);
    
    if (extractedEmails.length > 0) {
      const currentEmails = teamData.employees.filter(email => email.trim() && email.includes('@'));
      const allEmails = Array.from(new Set([...currentEmails, ...extractedEmails]));
      setTeamData(prev => ({ ...prev, employees: allEmails }));
      toast({
        title: `${extractedEmails.length} emails extracted`,
        description: "Email addresses have been automatically formatted",
      });
    } else {
      handleEmailsChange(teamData.employees.join('\n') + '\n' + pastedText);
    }
  };

  const steps = [
    { number: 1, title: 'Team Info', icon: Users },
    { number: 2, title: 'Add Members', icon: Users },
    { number: 3, title: 'Questions', icon: MessageCircle },
    { number: 4, title: 'Complete', icon: CheckCircle },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Team Setup</h1>
            <p className="text-muted-foreground">Configure your team for wellbeing tracking</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep || (step.number === 4 && createdTeam);
                const Icon = step.icon;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted ? 'bg-green-500 border-green-500 text-white' :
                      isActive ? 'bg-blue-500 border-blue-500 text-white' :
                      'bg-white border-gray-300 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(steps[currentStep - 1]?.icon, { className: "h-5 w-5" })}
                {steps[currentStep - 1]?.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Team Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={teamData.name}
                      onChange={(e) => setTeamData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Marketing Team, Engineering, Sales"
                      className="mt-1"
                    />
                  </div>
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Give your team a clear, recognizable name. This will help you identify it in your dashboard.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 2: Add Members */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <Alert>
                    <Plus className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Easy Setup:</strong> Copy and paste email addresses from anywhere! 
                      We'll automatically extract and format them for you. Separate with new lines, commas, or semicolons.
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <Label htmlFor="employees">Team Member Emails</Label>
                    <Textarea
                      id="employees"
                      value={teamData.employees.join('\n')}
                      onChange={(e) => handleEmailsChange(e.target.value)}
                      onPaste={handleEmailPaste}
                      placeholder="Paste or type email addresses here...
john@company.com
sarah@company.com
mike@company.com

You can also paste from spreadsheets or contact lists!"
                      rows={10}
                      className="mt-1 font-mono text-sm"
                    />
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>{teamData.employees.filter(e => e.includes('@')).length} valid email addresses</span>
                      <span>Use Enter, comma, or semicolon to separate emails</span>
                    </div>
                  </div>

                  {/* Email Preview */}
                  {teamData.employees.filter(e => e.includes('@')).length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-2">Preview:</div>
                      <div className="flex flex-wrap gap-1">
                        {teamData.employees
                          .filter(email => email && email.includes('@'))
                          .slice(0, 10)
                          .map((email, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        {teamData.employees.filter(e => e.includes('@')).length > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{teamData.employees.filter(e => e.includes('@')).length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      Add all team members who will participate in wellbeing surveys. They'll receive a link to enable notifications.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 3: Questions */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <QuestionEditor
                    questions={teamData.questions}
                    onChange={(questions) => setTeamData(prev => ({ ...prev, questions }))}
                  />
                  <Alert>
                    <MessageCircle className="h-4 w-4" />
                    <AlertDescription>
                      Create questions to understand your team's wellbeing. You can always modify these later.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && createdTeam && (
                <div className="space-y-6">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Team Setup Complete!</h3>
                    <p className="text-muted-foreground">
                      {createdTeam.name} is ready. Share the survey link with your team members.
                    </p>
                  </div>

                  {/* Share Link Card */}
                  <ShareLinkCard 
                    teamId={createdTeam.id} 
                    teamName={createdTeam.name} 
                  />

                  {/* Survey Deadline Manager */}
                  <SurveyDeadlineManager teamId={createdTeam.id} />

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <Button 
                      onClick={() => setLocation('/teams')}
                      className="flex-1"
                    >
                      Go to Team Management
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation('/')}
                      className="flex-1"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setLocation('/')}
                disabled={createTeamMutation.isPending}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                onClick={handleNext}
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? 'Creating...' : 
                 currentStep === 3 ? 'Create Team' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}