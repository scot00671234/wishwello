import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, X, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface SurveyDeadlineManagerProps {
  teamId: string;
  currentDeadline?: {
    id: string;
    title: string;
    description?: string;
    deadline?: string;
    isActive: boolean;
  };
}

export function SurveyDeadlineManager({ teamId, currentDeadline }: SurveyDeadlineManagerProps) {
  const [hasDeadline, setHasDeadline] = useState(!!currentDeadline?.deadline);
  const [title, setTitle] = useState(currentDeadline?.title || 'Team Wellbeing Survey');
  const [description, setDescription] = useState(currentDeadline?.description || '');
  const [deadlineDate, setDeadlineDate] = useState(
    currentDeadline?.deadline ? format(new Date(currentDeadline.deadline), 'yyyy-MM-dd') : ''
  );
  const [deadlineTime, setDeadlineTime] = useState(
    currentDeadline?.deadline ? format(new Date(currentDeadline.deadline), 'HH:mm') : '17:00'
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const deadline = hasDeadline && deadlineDate 
        ? new Date(`${deadlineDate}T${deadlineTime}`).toISOString()
        : null;

      if (currentDeadline?.id) {
        return apiRequest('PATCH', `/api/teams/${teamId}/survey-deadline`, {
          id: currentDeadline.id,
          title,
          description,
          deadline,
        });
      } else {
        return apiRequest('POST', `/api/teams/${teamId}/survey-deadline`, {
          title,
          description,
          deadline,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Survey Settings Saved",
        description: hasDeadline 
          ? `Survey deadline set for ${format(new Date(`${deadlineDate}T${deadlineTime}`), 'PPP p')}`
          : "Survey deadline removed - you can manually close when ready",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const closeSurveyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/teams/${teamId}/close-survey`, {
        surveyId: currentDeadline?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Survey Closed",
        description: "No new responses will be accepted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
  });

  const deadlineDateTime = hasDeadline && deadlineDate 
    ? new Date(`${deadlineDate}T${deadlineTime}`)
    : null;

  const isExpired = deadlineDateTime && deadlineDateTime < new Date();
  const isActive = currentDeadline?.isActive ?? true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Survey Deadline Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Survey Title */}
        <div className="space-y-2">
          <Label htmlFor="survey-title">Survey Title</Label>
          <Input
            id="survey-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Team Wellbeing Survey"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context for team members..."
            rows={2}
          />
        </div>

        {/* Deadline Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Set Deadline</Label>
            <p className="text-sm text-muted-foreground">
              When should this survey close?
            </p>
          </div>
          <Switch
            checked={hasDeadline}
            onCheckedChange={setHasDeadline}
          />
        </div>

        {/* Deadline DateTime */}
        {hasDeadline && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline-date">Deadline Date</Label>
              <Input
                id="deadline-date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline-time">Deadline Time</Label>
              <Input
                id="deadline-time"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Status Display */}
        {currentDeadline && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Status:</span>
              <div className="flex items-center gap-2">
                {!isActive ? (
                  <Badge variant="secondary">
                    <X className="h-3 w-3 mr-1" />
                    Closed
                  </Badge>
                ) : isExpired ? (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                ) : currentDeadline.deadline ? (
                  <Badge variant="default">
                    <Clock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    No Deadline
                  </Badge>
                )}
              </div>
            </div>
            
            {currentDeadline.deadline && (
              <p className="text-sm text-muted-foreground">
                Deadline: {format(new Date(currentDeadline.deadline), 'PPP p')}
              </p>
            )}
          </div>
        )}

        {/* No Deadline Info */}
        {!hasDeadline && (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>No deadline:</strong> Survey will remain open until you manually close it.
              You can close it anytime from the team management page.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => saveMutation.mutate({})}
            disabled={saveMutation.isPending || !title.trim()}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>

          {currentDeadline?.isActive && (
            <Button
              variant="destructive"
              onClick={() => closeSurveyMutation.mutate()}
              disabled={closeSurveyMutation.isPending}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {closeSurveyMutation.isPending ? 'Closing...' : 'Close Survey'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}