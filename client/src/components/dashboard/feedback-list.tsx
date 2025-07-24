import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackListProps {
  comments: Array<{
    text: string;
    submittedAt: string | Date;
  }>;
}

export default function FeedbackList({ comments }: FeedbackListProps) {
  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">💬</div>
        <p className="font-medium">No feedback yet</p>
        <p className="text-sm">Comments will appear here after your team submits feedback</p>
      </div>
    );
  }

  const formatTimeAgo = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-4">
      {comments.slice(0, 5).map((comment, index) => (
        <div 
          key={index} 
          className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-200"
        >
          <p className="text-gray-700 text-sm mb-2 leading-relaxed">
            "{comment.text}"
          </p>
          <div className="text-xs text-gray-500">
            {formatTimeAgo(comment.submittedAt)}
          </div>
        </div>
      ))}
      
      {comments.length > 5 && (
        <Button 
          variant="link" 
          className="w-full mt-4 p-0 text-blue-600 hover:text-blue-700"
        >
          View all {comments.length} comments →
        </Button>
      )}
      
      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">💭</div>
          <p>No comments yet</p>
          <p className="text-sm">Feedback will appear here after check-ins</p>
        </div>
      )}
    </div>
  );
}
