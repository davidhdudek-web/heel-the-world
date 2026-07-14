const CACHE = 'htw-v4';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./kalender.html'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

// Network-first: always prefer the live version when online.
// Only fall back to cache if the network request fails (offline).
// Never intercept range requests or video files — caching partial
// (206) responses is invalid and breaks video streaming/autoplay.
self.addEventListener('fetch', e => {
  if (e.request.headers.has('range') || e.request.url.match(/\.(mp4|mov|webm)(\?|$)/)) {
    return; // let the browser handle this natively, untouched
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
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

// build-trigger 1784014881
