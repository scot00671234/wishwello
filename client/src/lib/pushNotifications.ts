// Push Notifications Service
import { apiRequest } from '@/lib/queryClient';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationData {
  title: string;
  body: string;
  url?: string;
  teamId?: string;
  surveyId?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    
    return permission;
  }

  async subscribe(teamId: string, employeeEmail?: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription();
      if (existingSubscription) {
        // Update subscription on server
        await this.saveSubscription(existingSubscription, teamId, employeeEmail);
        return this.serializeSubscription(existingSubscription);
      }

      // Create new subscription
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLKRQT9Zez-wNS3j_4sU1a6Lr5jvf0nxrPV8_pCSI8JiVPnb-4GKQS0'
        )
      });

      console.log('Push subscription created:', subscription);

      // Save subscription to server
      await this.saveSubscription(subscription, teamId, employeeEmail);

      return this.serializeSubscription(subscription);
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return true;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify server about unsubscription
        await apiRequest('/api/push/unsubscribe', {
          method: 'POST',
          body: { endpoint: subscription.endpoint }
        });
      }
      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
  }> {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    const permission = supported ? Notification.permission : 'denied';
    
    let subscribed = false;
    if (supported && this.registration) {
      try {
        const subscription = await this.registration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    }

    return { supported, permission, subscribed };
  }

  private async saveSubscription(
    subscription: globalThis.PushSubscription, 
    teamId: string, 
    employeeEmail?: string
  ): Promise<void> {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      },
      teamId,
      employeeEmail
    };

    await apiRequest('/api/push/subscribe', {
      method: 'POST',
      body: subscriptionData
    });
  }

  private serializeSubscription(subscription: globalThis.PushSubscription): PushSubscription {
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Test notification (for development)
  async testNotification(title: string = 'Test Notification', body: string = 'This is a test'): Promise<void> {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      });
    }
  }
}

export const pushNotificationService = new PushNotificationService();