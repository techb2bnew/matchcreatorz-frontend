// Firebase background message handler (service worker)
// Runs when app is in background or closed

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// NOTE: These values are safe to be public — they identify your Firebase project.
// They match NEXT_PUBLIC_FIREBASE_* values in .env.local
firebase.initializeApp({
  apiKey:            'AIzaSyD4aJ-FTqmjYKWZxbKrVPxbM4nPCZa3oqA',
  authDomain:        'matchcreatorz-rahul.firebaseapp.com',
  projectId:         'matchcreatorz-rahul',
  messagingSenderId: '559577074349',
  appId:             '1:559577074349:web:33683bffb682d830e0d424',
});

const messaging = firebase.messaging();

// Handle background push notification
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;

  self.registration.showNotification(title, {
    body:  body  || '',
    icon:  '/logo.svg',
    badge: '/logo.svg',
    data:  payload.data || {},
  });
});

// Notification click → open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) return existing.focus();
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
