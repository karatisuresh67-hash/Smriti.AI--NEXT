// Smriti AI - Service Worker for Web Push and Offline Notifications
const CACHE_NAME = 'smriti-ai-v1';


self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Display notifications received through Web Push.
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Smriti AI Reminder';

  const options = {
    body: data.body || 'You have an upcoming reminder.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'smriti-reminder',
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Open or focus Smriti AI when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || '/',
    self.location.origin
  );

  // Only allow navigation within this website.
  if (targetUrl.origin !== self.location.origin) return;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(async (clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          await client.focus();

          if ('navigate' in client && client.url !== targetUrl.href) {
            await client.navigate(targetUrl.href);
          }

          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl.href);
      }
    })
  );
});
