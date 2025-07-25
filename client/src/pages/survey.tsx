import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Heart, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';
import { NotificationSetup } from '@/components/notifications/NotificationSetup';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  text: string;
  type: 'scale' | 'yesno' | 'comment';
  order: number;
}

interface Team {
  id: string;
  name: string;
  companyName?: string;
}

interface SurveyResponse {
  questionId: string;
  value: string;
}

export default function SurveyPage() {
  const [, params] = useRoute('/survey/:teamId');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const teamId = params?.teamId;

  // Fetch survey data
  const { data: surveyData, isLoading, error } = useQuery({
    queryKey: ['/api/feedback', teamId],
    enabled: !!teamId,
  });

  const team: Team = surveyData?.team;
  const questions: Question[] = surveyData?.questions || [];

  // Submit responses
  const submitMutation = useMutation({
    mutationFn: async (data: { responses: SurveyResponse[] }) => {
      return apiRequest(`/api/feedback/${teamId}`, {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your wellbeing check-in has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    const surveyResponses: SurveyResponse[] = Object.entries(responses).map(([questionId, value]) => ({
      questionId,
      value
    }));

    if (surveyResponses.length === 0) {
      toast({
        title: "No responses",
        description: "Please answer at least one question before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({ responses: surveyResponses });
  };

  const renderQuestion = (question: Question) => {
    const value = responses[question.id] || '';

    switch (question.type) {
      case 'scale':
        return (
          <div className="space-y-4">
            <Label className="text-base">{question.text}</Label>
            <div className="px-4">
              <Slider
                value={[parseInt(value) || 5]}
                onValueChange={(newValue) => handleResponseChange(question.id, newValue[0].toString())}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>1 - Very Poor</span>
                <span className="font-semibold text-primary">
                  {value || '5'}
                </span>
                <span>10 - Excellent</span>
              </div>
            </div>
          </div>
        );

      case 'yesno':
        return (
          <div className="space-y-3">
            <Label className="text-base">{question.text}</Label>
            <RadioGroup 
              value={value} 
              onValueChange={(newValue) => handleResponseChange(question.id, newValue)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`}>No</Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'comment':
        return (
          <div className="space-y-3">
            <Label htmlFor={question.id} className="text-base">{question.text}</Label>
            <Textarea
              id={question.id}
              placeholder="Share your thoughts... (optional)"
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
                <p>Loading your wellbeing check-in...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertDescription>
              This survey link appears to be invalid or expired. Please contact your manager for a new link.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h1 className="text-2xl font-bold">Thank You!</h1>
                <p className="text-muted-foreground">
                  Your wellbeing check-in has been submitted successfully. Your feedback helps create a better workplace for everyone.
                </p>
                <Badge variant="secondary" className="mt-4">
                  Response recorded anonymously
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Notification setup for future surveys */}
          <NotificationSetup 
            teamId={teamId}
            onSubscriptionChange={setNotificationEnabled}
          />

          {notificationEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Perfect! You'll now receive future wellbeing check-ins directly on your device. 
                No need to check email or remember links.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              Wellbeing Check-in
            </CardTitle>
            <CardDescription>
              <strong>{team.name}</strong>
              {team.companyName && ` • ${team.companyName}`}
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary">Anonymous</Badge>
              <Badge variant="secondary">{questions.length} questions</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        {questions.length > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ 
                  width: `${(Object.keys(responses).length / questions.length) * 100}%` 
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {Object.keys(responses).length} of {questions.length}
            </span>
          </div>
        )}

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {questions[currentStep]?.type === 'scale' && <BarChart3 className="h-5 w-5" />}
              {questions[currentStep]?.type === 'yesno' && <CheckCircle className="h-5 w-5" />}
              {questions[currentStep]?.type === 'comment' && <MessageSquare className="h-5 w-5" />}
              <CardTitle className="text-lg">
                Question {currentStep + 1} of {questions.length}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className={index === currentStep ? 'block' : 'hidden'}>
                {renderQuestion(question)}
              </div>
            ))}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              {currentStep < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Survey'}
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Notice */}
        <Alert>
          <AlertDescription className="text-center">
            Your responses are completely anonymous. Individual answers cannot be traced back to you.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}