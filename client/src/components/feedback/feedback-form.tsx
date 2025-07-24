import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  id: string;
  title: string;
  type: 'metric' | 'yesno' | 'comment';
  isRequired: boolean;
}

interface FeedbackFormProps {
  questions: Question[];
  onSubmit: (responses: Array<{ questionId: string; value: string }>) => void;
  isLoading: boolean;
}

export default function FeedbackForm({ questions, onSubmit, isLoading }: FeedbackFormProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateResponse = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user provides a response
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      if (question.isRequired && !responses[question.id]) {
        newErrors[question.id] = 'This question is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formattedResponses = Object.entries(responses)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([questionId, value]) => ({ questionId, value }));

    onSubmit(formattedResponses);
  };

  const MetricQuestion = ({ question }: { question: Question }) => {
    const selectedValue = responses[question.id];
    
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Very Poor</span>
          <div className="flex space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => updateResponse(question.id, num.toString())}
                className={`w-10 h-10 rounded-lg border-2 transition-colors flex items-center justify-center text-sm font-medium ${
                  selectedValue === num.toString()
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-600 hover:bg-blue-50 text-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">Excellent</span>
        </div>
      </div>
    );
  };

  const YesNoQuestion = ({ question }: { question: Question }) => {
    const selectedValue = responses[question.id];
    
    return (
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => updateResponse(question.id, 'yes')}
          className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
            selectedValue === 'yes'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-700'
          }`}
        >
          ✓ Yes
        </button>
        <button
          type="button"
          onClick={() => updateResponse(question.id, 'no')}
          className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
            selectedValue === 'no'
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-700'
          }`}
        >
          ✗ No
        </button>
      </div>
    );
  };

  const CommentQuestion = ({ question }: { question: Question }) => {
    return (
      <Textarea
        value={responses[question.id] || ''}
        onChange={(e) => updateResponse(question.id, e.target.value)}
        placeholder="Share your thoughts..."
        className="resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        rows={4}
      />
    );
  };

  return (
    <Card>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <Label className="block text-sm font-medium text-gray-700">
                {question.title}
                {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {question.type === 'metric' && <MetricQuestion question={question} />}
              {question.type === 'yesno' && <YesNoQuestion question={question} />}
              {question.type === 'comment' && <CommentQuestion question={question} />}
              
              {errors[question.id] && (
                <p className="text-sm text-red-600 mt-1">{errors[question.id]}</p>
              )}
            </div>
          ))}

          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg font-semibold"
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
