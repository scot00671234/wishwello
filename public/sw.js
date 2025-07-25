// Service Worker for Push Notifications
const CACHE_NAME = 'wish-wello-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'New Survey', body: 'You have a new wellbeing check-in' };
  }

  const options = {
    body: data.body || 'You have a new wellbeing check-in',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.url || '/',
      teamId: data.teamId,
      surveyId: data.surveyId
    },
    actions: [
      {
        action: 'open',
        title: 'Take Survey',
        icon: '/icons/survey-icon.png'
      },
      {
        action: 'later',
        title: 'Remind Later',
        icon: '/icons/later-icon.png'
      }
    ],
    requireInteraction: true,
    tag: 'wellbeing-survey'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Wellbeing Check-in', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'later') {
    // Schedule reminder for later (could implement with setTimeout or API call)
    return;
  }
  
  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'survey-response') {
    event.waitUntil(syncSurveyResponses());
  }
});

async function syncSurveyResponses() {
  // Handle offline survey responses when connection is restored
  try {
    const cache = await caches.open('survey-responses');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // Retry sending to server
      await fetch('/api/feedback/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Remove from cache after successful sync
      await cache.delete(request);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}