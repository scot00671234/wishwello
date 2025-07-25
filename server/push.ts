// Push notification service for sending notifications
import webpush from 'web-push';

interface PushSubscriptionData {
  id?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  teamId: string;
  employeeEmail?: string;
  createdAt?: Date;
}

interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  teamId?: string;
  surveyId?: string;
  icon?: string;
  badge?: string;
}

class PushNotificationService {
  private vapidKeys: {
    publicKey: string;
    privateKey: string;
  };

  constructor() {
    // Initialize VAPID keys (should be stored as environment variables)
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLKRQT9Zez-wNS3j_4sU1a6Lr5jvf0nxrPV8_pCSI8JiVPnb-4GKQS0',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'nF7vGcjHyL4K2PqZwRkSmT9vAe8Xd6Cf3Jh5Bn2Mp1Q'
    };

    // Only configure web-push if we have valid keys
    try {
      webpush.setVapidDetails(
        'mailto:support@wishwello.com',
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );
    } catch (error) {
      console.warn('VAPID keys not configured properly. Push notifications will not work:', error.message);
    }
  }

  async sendNotification(
    subscription: PushSubscriptionData,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || `/survey/${payload.teamId}`,
        teamId: payload.teamId,
        surveyId: payload.surveyId,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        timestamp: Date.now()
      });

      await webpush.sendNotification(pushSubscription, notificationPayload);
      console.log('Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      
      // Handle expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, should be removed from database
        console.log('Subscription expired, should be removed');
        return false;
      }
      
      return false;
    }
  }

  async sendBulkNotifications(
    subscriptions: PushSubscriptionData[],
    payload: NotificationPayload
  ): Promise<{ sent: number; failed: number; expired: string[] }> {
    const results = {
      sent: 0,
      failed: 0,
      expired: [] as string[]
    };

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const success = await this.sendNotification(subscription, payload);
        if (success) {
          results.sent++;
        } else {
          results.failed++;
          // Check if subscription should be marked as expired
          results.expired.push(subscription.endpoint);
        }
      } catch (error) {
        results.failed++;
        console.error(`Failed to send to ${subscription.endpoint}:`, error);
      }
    });

    await Promise.all(sendPromises);
    
    console.log(`Bulk notification results:`, results);
    return results;
  }

  async sendTeamSurvey(
    teamId: string,
    subscriptions: PushSubscriptionData[],
    surveyTitle?: string
  ): Promise<{ sent: number; failed: number }> {
    const payload: NotificationPayload = {
      title: surveyTitle || 'Wellbeing Check-in',
      body: 'Your anonymous wellbeing survey is ready. Takes 2 minutes!',
      url: `/survey/${teamId}`,
      teamId,
      surveyId: `survey-${Date.now()}`
    };

    const results = await this.sendBulkNotifications(subscriptions, payload);
    
    // Clean up expired subscriptions would happen here
    // (You'd implement this in your storage layer)
    
    return {
      sent: results.sent,
      failed: results.failed
    };
  }

  async sendReminder(
    teamId: string,
    subscriptions: PushSubscriptionData[],
    reminderText?: string
  ): Promise<{ sent: number; failed: number }> {
    const payload: NotificationPayload = {
      title: 'Gentle Reminder',
      body: reminderText || 'You have a pending wellbeing check-in. Quick 2-minute survey!',
      url: `/survey/${teamId}`,
      teamId
    };

    const results = await this.sendBulkNotifications(subscriptions, payload);
    
    return {
      sent: results.sent,
      failed: results.failed
    };
  }

  // Test notification for setup verification
  async sendTestNotification(subscription: PushSubscriptionData): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Test Notification',
      body: 'Your push notifications are working perfectly! 🎉',
      url: `/survey/${subscription.teamId}`
    };

    return await this.sendNotification(subscription, payload);
  }

  // Validate subscription format
  validateSubscription(subscription: any): boolean {
    return (
      subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string'
    );
  }

  // Generate VAPID keys (for initial setup)
  static generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }
}

export const pushService = new PushNotificationService();
export type { PushSubscriptionData, NotificationPayload };