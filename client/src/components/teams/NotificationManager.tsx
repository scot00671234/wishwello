import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Send, Users, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NotificationManagerProps {
  teamId: string;
  teamName: string;
}

export function NotificationManager({ teamId, teamName }: NotificationManagerProps) {
  const [surveyTitle, setSurveyTitle] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send survey notifications
  const sendNotificationsMutation = useMutation({
    mutationFn: async (data: { teamId: string; title?: string }) => {
      return apiRequest('/api/push/send-team-survey', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Notifications Sent!",
        description: `Survey sent to ${data.sent} devices. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
      });
      setSurveyTitle('');
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Send Failed",
        description: "Failed to send notifications. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendSurvey = () => {
    if (!teamId) return;
    
    sendNotificationsMutation.mutate({
      teamId,
      title: surveyTitle || 'Wellbeing Check-in'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send Survey Notifications
        </CardTitle>
        <CardDescription>
          Instantly send wellbeing check-ins to all team members who have notifications enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Survey Title Input */}
        <div className="space-y-2">
          <Label htmlFor="survey-title">Survey Title (Optional)</Label>
          <Input
            id="survey-title"
            placeholder="e.g., Weekly Team Check-in"
            value={surveyTitle}
            onChange={(e) => setSurveyTitle(e.target.value)}
            disabled={sendNotificationsMutation.isPending}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendSurvey}
          disabled={sendNotificationsMutation.isPending}
          className="w-full flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sendNotificationsMutation.isPending ? 'Sending...' : 'Send Survey to Team'}
        </Button>

        {/* Info Box */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong><br />
            • Notifications appear instantly on employees' devices<br />
            • No email setup required<br />
            • Employees click notification → survey opens<br />
            • Responses are anonymous and secure
          </AlertDescription>
        </Alert>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              98% Open Rate
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Zap className="h-3 w-3 mr-1" />
              Instant Delivery
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Users className="h-3 w-3 mr-1" />
              No Setup Required
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Bell className="h-3 w-3 mr-1" />
              Free to Send
            </Badge>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
          <strong>First time?</strong> Share this survey link with your team: 
          <code className="ml-2 bg-background px-2 py-1 rounded">
            {window.location.origin}/survey/{teamId}
          </code>
          <br />
          When they visit once and enable notifications, all future surveys will be delivered instantly!
        </div>
      </CardContent>
    </Card>
  );
}