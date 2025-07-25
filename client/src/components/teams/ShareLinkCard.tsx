import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, Link2, Share, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareLinkCardProps {
  teamId: string;
  teamName: string;
}

export function ShareLinkCard({ teamId, teamName }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const surveyUrl = `${window.location.origin}/survey/${teamId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Survey link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the link.",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = () => {
    window.open(surveyUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`${teamName} - Wellbeing Survey`);
    const body = encodeURIComponent(
      `Hi team,\n\nPlease take a moment to complete our team wellbeing survey:\n\n${surveyUrl}\n\nThis will help us understand how you're feeling and improve our team environment.\n\nNote: When you first visit the link, you'll have the option to enable push notifications for future surveys - this makes it super easy to participate!\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Share Survey Link
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

        {/* URL Display and Copy */}
        <div className="flex items-center gap-2">
          <Input
            value={surveyUrl}
            readOnly
            className="font-mono text-sm bg-muted"
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className="flex items-center gap-2 shrink-0"
          >
            {copied ? (
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={openInNewTab}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={shareViaEmail}
            className="flex items-center gap-2"
          >
            <Share className="w-4 h-4" />
            Email Team
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border">
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
  );
}