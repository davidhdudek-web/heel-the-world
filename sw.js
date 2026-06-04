const CACHE = 'htw-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./kalender.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// Notification scheduling
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATIONS') {
    scheduleDaily();
  }
});

function scheduleDaily() {
  const now = new Date();
  const slots = [
    { h: 7,  m: 45, label: 'Detail Post', sub: '08:00 — Detail Reel bereit zum Posten' },
    { h: 12, m: 45, label: 'Editorial Post', sub: '13:00 — Editorial Reel bereit zum Posten' },
    { h: 18, m: 45, label: 'Story Post', sub: '19:00 — Story Reel bereit zum Posten' }
  ];

  slots.forEach(slot => {
    const target = new Date();
    target.setHours(slot.h, slot.m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const delay = target - now;
    setTimeout(() => {
      self.registration.showNotification('HTW — ' + slot.label, {
        body: slot.sub,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: slot.label,
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Kalender öffnen' },
          { action: 'done', title: 'Erledigt' }
        ]
      });
      // Reschedule for next day
      scheduleDaily();
    }, delay);
  });
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'open' || !e.action) {
    e.waitUntil(clients.openWindow('./kalender.html'));
  }
});
