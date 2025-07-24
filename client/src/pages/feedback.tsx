import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, CheckCircle } from 'lucide-react';
import FeedbackForm from '@/components/feedback/feedback-form';

export default function Feedback() {
  const [, params] = useRoute('/feedback/:teamId');
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const teamId = params?.teamId;

  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['/api/feedback', teamId],
    enabled: !!teamId,
    retry: false,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (responses: any[]) => {
      await apiRequest('POST', `/api/feedback/${teamId}`, { responses });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (error || !feedbackData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-600 text-2xl">❌</div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Feedback Form Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              This feedback link may have expired or is invalid.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your manager for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              Your responses are completely anonymous and help us create a better workplace.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { team, questions } = feedbackData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="gradient-brand p-8 text-center text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Weekly Team Check-in</h1>
            <p className="text-blue-100">
              {team.name} • 2 minutes to complete
            </p>
          </div>
          
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                How are you feeling this week?
              </h2>
              <p className="text-gray-600">
                Your responses are completely anonymous and help us improve our workplace.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <FeedbackForm
          questions={questions}
          onSubmit={(responses) => submitFeedbackMutation.mutate(responses)}
          isLoading={submitFeedbackMutation.isPending}
        />

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            This feedback is completely anonymous and helps improve our workplace.
          </p>
        </div>
      </div>
    </div>
  );
}
