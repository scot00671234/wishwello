import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  MessageSquare, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Eye,
  EyeOff,
  Info,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuestionAnalytics {
  questionId: string;
  title: string;
  type: 'metric' | 'yesno' | 'comment';
  totalResponses: number;
  insights: string[];
  
  // Metric question properties
  average?: number;
  distribution?: Record<string, number>;
  
  // Yes/No question properties
  yesCount?: number;
  noCount?: number;
  yesPercentage?: number;
  noPercentage?: number;
  
  // Comment question properties
  comments?: string[];
  totalComments?: number;
  themes?: string[];
  sentimentCounts?: {
    positive: number;
    negative: number;
    stress: number;
    communication: number;
  };
}

interface SurveyAnalyticsData {
  team: {
    name: string;
    companyName?: string;
  };
  questionAnalytics: QuestionAnalytics[];
  overallInsights: string[];
  responseStats: {
    totalResponses: number;
    approximateRespondents: number;
    responsesPer30Days: number;
  };
}

interface SurveyAnalyticsProps {
  teamId: string;
}

export function SurveyAnalytics({ teamId }: SurveyAnalyticsProps) {
  const [showDetails, setShowDetails] = useState(false);

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/feedback', teamId, 'analytics'],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/${teamId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json() as SurveyAnalyticsData;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p>Analyzing survey responses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Analytics are not available at the moment. Thank you for your response!
        </AlertDescription>
      </Alert>
    );
  }

  const renderMetricAnalytics = (question: QuestionAnalytics) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-3xl font-bold text-primary">{question.average}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Responses</p>
          <p className="text-lg font-semibold">{question.totalResponses}</p>
        </div>
      </div>
      
      {question.distribution && Object.keys(question.distribution).length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Score Distribution</p>
          {Object.entries(question.distribution)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([score, count]) => (
              <div key={score} className="flex items-center gap-2">
                <span className="text-sm w-8">{score}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(count / question.totalResponses) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{count}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const renderYesNoAnalytics = (question: QuestionAnalytics) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium">Yes</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{question.yesPercentage}%</p>
          <p className="text-sm text-muted-foreground">{question.yesCount} responses</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-medium">No</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">{question.noPercentage}%</p>
          <p className="text-sm text-muted-foreground">{question.noCount} responses</p>
        </div>
      </div>
      
      <div className="bg-muted rounded-full h-3">
        <div 
          className="bg-green-600 rounded-full h-3 transition-all"
          style={{ width: `${question.yesPercentage || 0}%` }}
        />
      </div>
    </div>
  );

  const renderCommentAnalytics = (question: QuestionAnalytics) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">{question.totalComments} Comments</p>
        {question.sentimentCounts && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-green-600" />
              <span>{question.sentimentCounts.positive}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-red-600" />
              <span>{question.sentimentCounts.negative}</span>
            </div>
            {question.sentimentCounts.stress > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span>{question.sentimentCounts.stress}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {question.themes && question.themes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Key Themes</p>
          <div className="flex flex-wrap gap-2">
            {question.themes.map((theme, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showDetails && question.comments && question.comments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Comments</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {question.comments.map((comment, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                "{comment}"
              </div>
            ))}
          </div>
          {question.totalComments! > question.comments.length && (
            <p className="text-xs text-muted-foreground">
              Showing {question.comments.length} of {question.totalComments} comments
            </p>
          )}
        </div>
      )}
    </div>
  );

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'metric': return <BarChart3 className="h-5 w-5" />;
      case 'yesno': return <CheckCircle className="h-5 w-5" />;
      case 'comment': return <MessageSquare className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall insights */}
      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            {analytics.overallInsights.map((insight, index) => (
              <p key={index}>{insight}</p>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      {/* Response stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-lg font-semibold">~{analytics.responseStats.approximateRespondents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-lg font-semibold">{analytics.responseStats.totalResponses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-lg font-semibold">{analytics.questionAnalytics.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question analytics */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Question Analysis</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {analytics.questionAnalytics.map((question) => (
          <Card key={question.questionId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {getQuestionIcon(question.type)}
                {question.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {question.type === 'metric' && renderMetricAnalytics(question)}
              {question.type === 'yesno' && renderYesNoAnalytics(question)}
              {question.type === 'comment' && renderCommentAnalytics(question)}
              
              {question.insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Insights</p>
                  <div className="space-y-1">
                    {question.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}