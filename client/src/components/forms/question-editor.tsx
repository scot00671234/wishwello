import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, MessageCircle } from 'lucide-react';

interface Question {
  id?: string;
  title: string;
  type: 'metric' | 'yesno' | 'comment';
  isRequired: boolean;
  order: number;
}

interface QuestionEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  onSubmit?: (data: { questions: Question[] }) => void;
  isLoading?: boolean;
}

const templates = [
  {
    name: "General Wellbeing",
    description: "Comprehensive questions to track overall employee satisfaction and wellbeing",
    questions: [
      { title: "Overall job satisfaction", type: "metric" as const, isRequired: true, order: 0 },
      { title: "Work-life balance satisfaction", type: "metric" as const, isRequired: true, order: 1 },
      { title: "Do you feel supported by your manager?", type: "yesno" as const, isRequired: true, order: 2 },
      { title: "Any additional feedback or concerns?", type: "comment" as const, isRequired: false, order: 3 }
    ]
  },
  {
    name: "Burnout Prevention",
    description: "Early detection of stress and burnout signals to prevent employee turnover",
    questions: [
      { title: "Current stress level", type: "metric" as const, isRequired: true, order: 0 },
      { title: "Workload manageability", type: "metric" as const, isRequired: true, order: 1 },
      { title: "Do you feel overwhelmed with your current responsibilities?", type: "yesno" as const, isRequired: true, order: 2 },
      { title: "Are you considering looking for other opportunities?", type: "yesno" as const, isRequired: true, order: 3 },
      { title: "What support would help reduce your stress?", type: "comment" as const, isRequired: false, order: 4 }
    ]
  },
  {
    name: "Team Engagement",
    description: "Measure team collaboration, communication, and overall engagement levels",
    questions: [
      { title: "Team collaboration effectiveness", type: "metric" as const, isRequired: true, order: 0 },
      { title: "Communication clarity within the team", type: "metric" as const, isRequired: true, order: 1 },
      { title: "Do you feel heard in team meetings?", type: "yesno" as const, isRequired: true, order: 2 },
      { title: "How motivated do you feel about current projects?", type: "metric" as const, isRequired: true, order: 3 },
      { title: "Suggestions for improving team dynamics?", type: "comment" as const, isRequired: false, order: 4 }
    ]
  },
  {
    name: "Growth & Development",
    description: "Track employee satisfaction with learning opportunities and career progression",
    questions: [
      { title: "Satisfaction with learning opportunities", type: "metric" as const, isRequired: true, order: 0 },
      { title: "Career growth satisfaction", type: "metric" as const, isRequired: true, order: 1 },
      { title: "Do you feel challenged in your current role?", type: "yesno" as const, isRequired: true, order: 2 },
      { title: "Are your skills being utilized effectively?", type: "yesno" as const, isRequired: true, order: 3 },
      { title: "What skills would you like to develop?", type: "comment" as const, isRequired: false, order: 4 }
    ]
  },
  {
    name: "Remote Work Experience",
    description: "Specialized questions for remote and hybrid teams to track engagement and satisfaction",
    questions: [
      { title: "Remote work satisfaction", type: "metric" as const, isRequired: true, order: 0 },
      { title: "Connection with team members", type: "metric" as const, isRequired: true, order: 1 },
      { title: "Do you have the resources needed to work effectively from home?", type: "yesno" as const, isRequired: true, order: 2 },
      { title: "Do you feel isolated working remotely?", type: "yesno" as const, isRequired: true, order: 3 },
      { title: "How can we improve your remote work experience?", type: "comment" as const, isRequired: false, order: 4 }
    ]
  }
];

export default function QuestionEditor({ questions, onChange, onSubmit, isLoading = false }: QuestionEditorProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [localQuestions, setLocalQuestions] = useState<Question[]>(
    questions.length > 0 ? questions : [
      {
        title: 'Overall job satisfaction',
        type: 'metric',
        isRequired: true,
        order: 0,
      }
    ]
  );

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = localQuestions.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    );
    setLocalQuestions(updated);
    onChange(updated);
  };

  const addQuestion = () => {
    
    const newQuestion: Question = {
      title: '',
      type: 'metric',
      isRequired: false,
      order: localQuestions.length,
    };
    
    const updated = [...localQuestions, newQuestion];
    setLocalQuestions(updated);
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = localQuestions.filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, order: i }));
    setLocalQuestions(updated);
    onChange(updated);
  };

  const applyTemplate = (template: typeof templates[0]) => {
    setLocalQuestions(template.questions);
    onChange(template.questions);
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validQuestions = localQuestions.filter(q => q.title.trim().length > 0);
    if (onSubmit) {
      onSubmit({ questions: validQuestions });
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'metric': return 'Scale 1-10';
      case 'yesno': return 'Yes/No';
      case 'comment': return 'Comment';
      default: return type;
    }
  };

  const QuestionPreview = ({ question }: { question: Question }) => {
    if (question.type === 'metric') {
      return (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Very Poor</span>
            <div className="flex space-x-1">
              {Array.from({ length: 10 }, (_, i) => (
                <div 
                  key={i + 1}
                  className="w-6 h-6 border border-gray-300 rounded text-xs flex items-center justify-center text-gray-500"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">Excellent</span>
          </div>
        </div>
      );
    }
    
    if (question.type === 'yesno') {
      return (
        <div className="mt-3 flex space-x-2">
          <div className="flex-1 py-2 px-3 border border-gray-300 rounded text-center text-sm text-gray-500">
            ✓ Yes
          </div>
          <div className="flex-1 py-2 px-3 border border-gray-300 rounded text-center text-sm text-gray-500">
            ✗ No
          </div>
        </div>
      );
    }
    
    if (question.type === 'comment') {
      return (
        <div className="mt-3">
          <div className="w-full p-3 border border-gray-300 rounded bg-gray-50 text-sm text-gray-500">
            Employee can type their response here...
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Questions ({localQuestions.length})</h3>
          <p className="text-sm text-gray-600">Create questions for your team check-ins</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">Question Templates</h4>
              <p className="text-sm text-blue-700">Choose from pre-made templates designed for different aspects of employee wellbeing</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, index) => (
                <div key={index} className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="mb-3">
                    <h5 className="font-semibold text-gray-900 mb-1">{template.name}</h5>
                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                    <div className="text-xs text-gray-500">
                      {template.questions.length} questions
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {template.questions.slice(0, 2).map((q, i) => (
                      <div key={i} className="text-xs text-gray-600 truncate">
                        • {q.title}
                      </div>
                    ))}
                    {template.questions.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{template.questions.length - 2} more...
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={() => applyTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
                className="text-blue-700 hover:text-blue-800"
              >
                Close Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {localQuestions.map((question, index) => (
          <Card key={index} className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-3">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`question-${index}-title`}>Question</Label>
                      <Input
                        id={`question-${index}-title`}
                        value={question.title}
                        onChange={(e) => updateQuestion(index, { title: e.target.value })}
                        placeholder="Enter question text..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`question-${index}-type`}>Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value: 'metric' | 'yesno' | 'comment') => 
                          updateQuestion(index, { type: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metric">Scale 1-10</SelectItem>
                          <SelectItem value="yesno">Yes/No</SelectItem>
                          <SelectItem value="comment">Comment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`question-${index}-required`}
                        checked={question.isRequired}
                        onCheckedChange={(checked) => updateQuestion(index, { isRequired: checked })}
                      />
                      <Label htmlFor={`question-${index}-required`} className="text-sm">
                        Required question
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {getQuestionTypeLabel(question.type)} • {question.isRequired ? 'Required' : 'Optional'}
                      </span>
                      {localQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {question.title && <QuestionPreview question={question} />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {localQuestions.length === 0 && (
          <Card className="border-dashed border-gray-300">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">❓</div>
              <h3 className="font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-4">Add your first question to get started</p>
              <Button onClick={addQuestion} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        )}


      </form>
    </div>
  );
}
