import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Smartphone, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { pushNotificationService } from '@/lib/pushNotifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSetupProps {
  teamId?: string;
  employeeEmail?: string;
  onSubscriptionChange?: (subscribed: boolean) => void;
}

export function NotificationSetup({ teamId, employeeEmail, onSubscriptionChange }: NotificationSetupProps) {
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default' as NotificationPermission,
    subscribed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      await pushNotificationService.initialize();
      const currentStatus = await pushNotificationService.getSubscriptionStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleEnableNotifications = async () => {
    if (!teamId) {
      toast({
        title: "Error",
        description: "Team ID is required to enable notifications",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Request permission first
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        await pushNotificationService.subscribe(teamId, employeeEmail);
        
        // Update status
        await checkNotificationStatus();
        
        toast({
          title: "Notifications Enabled!",
          description: "You'll now receive wellbeing check-ins directly on your device",
        });

        onSubscriptionChange?.(true);
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings to receive check-ins",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      await checkNotificationStatus();
      
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive push notifications",
      });

      onSubscriptionChange?.(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.testNotification(
        'Test Wellbeing Check-in',
        'This is how your notifications will look!'
      );
      
      toast({
        title: "Test Sent!",
        description: "Check if you received the test notification",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Make sure notifications are enabled",
        variant: "destructive",
      });
    }
  };

  if (!status.supported) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in your browser. You can still access surveys through email or by visiting this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Instant Notifications
        </CardTitle>
        <CardDescription>
          Get wellbeing check-ins delivered directly to your device. No email setup required!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {status.subscribed ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">
              <BellOff className="h-3 w-3 mr-1" />
              Inactive
            </Badge>
          )}
        </div>

        {/* Permission Status */}
        {status.permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked. Please enable them in your browser settings and refresh this page.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefits */}
        {!status.subscribed && status.permission !== 'denied' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Why enable notifications?</strong><br />
              • Instant delivery to your device<br />
              • 98% more reliable than email<br />
              • Works offline and syncs when you're back online<br />
              • Takes 2 seconds to complete surveys
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!status.subscribed ? (
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading || status.permission === 'denied'}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? 'Setting up...' : 'Enable Notifications'}
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={handleTestNotification}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Test Notification
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <BellOff className="h-4 w-4" />
                {isLoading ? 'Disabling...' : 'Disable'}
              </Button>
            </>
          )}
        </div>

        {/* Help Text */}
        {status.subscribed && (
          <div className="text-sm text-muted-foreground">
            You're all set! Check-ins will appear as notifications on this device. 
            You can manage notification settings in your browser at any time.
          </div>
        )}
      </CardContent>
    </Card>
  );
}