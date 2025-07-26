import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SurveyDeadlineManager } from '@/components/teams/SurveyDeadlineManager';
import QuestionEditor from '@/components/forms/question-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Users, Link2, Check, Calendar, Clock, Mail, Plus, X, MessageCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface TeamEditDialogProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamEditDialog({ team, isOpen, onClose }: TeamEditDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [emailInput, setEmailInput] = useState('');
  const [copiedSurveyLink, setCopiedSurveyLink] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'weekly',
    dayOfWeek: 1,
    hour: 9,
  });
  const [questions, setQuestions] = useState<Array<{
    id?: string;
    title: string;
    type: 'metric' | 'yesno' | 'comment';
    isRequired: boolean;
    order: number;
  }>>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        frequency: team.schedules?.[0]?.frequency || 'weekly',
        dayOfWeek: team.schedules?.[0]?.dayOfWeek || 1,
        hour: team.schedules?.[0]?.hour || 9,
      });
      setEmailInput(team.employees?.map(e => e.email).join('\n') || '');
      setQuestions(team.questions || []);
    }
  }, [team]);

  // Update team basic info
  const updateTeamMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest('PATCH', `/api/teams/${team!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Team Updated",
        description: "Team settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });

  // Update employees
  const updateEmployeesMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      return apiRequest('PUT', `/api/teams/${team!.id}/employees`, { emails });
    },
    onSuccess: () => {
      toast({
        title: "Employees Updated",
        description: "Employee list has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });



  // Update questions mutation
  const updateQuestionsMutation = useMutation({
    mutationFn: async (questionData: Array<{
      id?: string;
      title: string;
      type: 'metric' | 'yesno' | 'comment';
      isRequired: boolean;
      order: number;
    }>) => {
      return apiRequest('PATCH', `/api/teams/${team!.id}`, {
        questions: questionData.map((q, index) => ({
          ...q,
          order: index,
          teamId: team!.id
        }))
      });
    },
    onSuccess: () => {
      toast({
        title: "Survey Updated",
        description: "Survey questions have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });

  const handleSave = () => {
    if (!team) return;

    // Update team name
    if (formData.name !== team.name) {
      updateTeamMutation.mutate({ name: formData.name });
    }

    // Update employees if changed
    const newEmails = emailInput
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
    
    const currentEmails = team.employees?.map(e => e.email) || [];
    if (JSON.stringify(newEmails.sort()) !== JSON.stringify(currentEmails.sort())) {
      updateEmployeesMutation.mutate(newEmails);
    }



    // Update questions if changed
    const currentQuestions = team.questions || [];
    if (JSON.stringify(questions.map(q => ({ ...q, id: undefined }))) !== JSON.stringify(currentQuestions.map(q => ({ ...q, id: undefined })))) {
      updateQuestionsMutation.mutate(questions);
    }
  };

  const copySurveyLink = () => {
    if (!team) return;
    const surveyUrl = `${window.location.origin}/survey/${team.id}`;
    navigator.clipboard.writeText(surveyUrl);
    setCopiedSurveyLink(true);
    setTimeout(() => setCopiedSurveyLink(false), 2000);
    toast({
      title: "Link Copied!",
      description: "Survey link has been copied to your clipboard.",
    });
  };

  const parseEmails = (text: string) => {
    // Extract emails from various formats
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches)); // Remove duplicates
  };

  const handleEmailPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const extractedEmails = parseEmails(pastedText);
    
    if (extractedEmails.length > 0) {
      setEmailInput(extractedEmails.join('\n'));
      toast({
        title: `${extractedEmails.length} emails extracted`,
        description: "Email addresses have been automatically formatted",
      });
    } else {
      setEmailInput(pastedText);
    }
  };

  if (!team) return null;

  const surveyUrl = `${window.location.origin}/survey/${team.id}`;
  const emailCount = emailInput.split('\n').filter(e => e.trim() && e.includes('@')).length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'employees', label: 'Team Members', icon: Mail },
    { id: 'survey', label: 'Survey', icon: MessageCircle },
    { id: 'share', label: 'Share Link', icon: Link2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">
            Edit Team: {team.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Team Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter team name"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created</span>
                      <span>{new Date(team.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Team Members</span>
                      <Badge variant="secondary">{team.employees?.length || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Questions</span>
                      <Badge variant="secondary">{team.questions?.length || 0}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <div className="space-y-6 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members ({emailCount})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Plus className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Easy Setup:</strong> Copy and paste email addresses from anywhere! 
                      We'll automatically extract and format them for you.
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <Label htmlFor="employees">Email Addresses</Label>
                    <Textarea
                      id="employees"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onPaste={handleEmailPaste}
                      placeholder="Paste or type email addresses here...
john@company.com
sarah@company.com
mike@company.com"
                      rows={12}
                      className="mt-1 font-mono text-sm"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>One email per line • Duplicates will be removed</span>
                    </div>
                  </div>

                  {/* Email Preview */}
                  {emailCount > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium mb-2">Preview:</div>
                      <div className="flex flex-wrap gap-1">
                        {emailInput
                          .split('\n')
                          .map(email => email.trim())
                          .filter(email => email && email.includes('@'))
                          .slice(0, 10)
                          .map((email, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {email}
                            </Badge>
                          ))}
                        {emailCount > 10 && (
                          <Badge variant="outline" className="text-xs">
                            +{emailCount - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'survey' && (
            <div className="space-y-6 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Survey Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Edit your survey questions here. Changes will be immediately reflected on the shareable survey link.
                    </AlertDescription>
                  </Alert>
                  
                  <QuestionEditor
                    questions={questions}
                    onChange={setQuestions}
                    onSubmit={(data) => updateQuestionsMutation.mutate(data.questions)}
                    isLoading={updateQuestionsMutation.isPending}
                  />
                </CardContent>
              </Card>
            </div>
          )}


          {activeTab === 'share' && (
            <div className="space-y-6 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Survey Link
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Link2 className="h-4 w-4" />
                    <AlertDescription>
                      Share this link with your team members. When they visit it for the first time, 
                      they can enable push notifications to receive all future surveys instantly.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center gap-2">
                    <Input
                      value={surveyUrl}
                      readOnly
                      className="font-mono text-sm bg-muted"
                    />
                    <Button
                      onClick={copySurveyLink}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {copiedSurveyLink ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">How it works:</h4>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. Share this link with your team (email, Slack, Teams, etc.)</li>
                      <li>2. Employees click the link and enable notifications (one-time setup)</li>
                      <li>3. You can then send instant surveys via push notifications</li>
                      <li>4. 98% delivery rate, no email setup required!</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateTeamMutation.isPending || updateEmployeesMutation.isPending}
          >
            {updateTeamMutation.isPending || updateEmployeesMutation.isPending
              ? 'Saving...' 
              : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}