const CACHE_NAME = 'jobsyria-v2';
const assets = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1️⃣ تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', event => {
  self.skipWaiting(); // التفعيل المباشر للنسخة الجديدة
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2️⃣ تفعيل وتحديث الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3️⃣ استجابة الطلبات (Fetch)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 4️⃣ استقبال وتمرير إشعارات الـ Push مع الصوت والاهتزاز
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : 'لديك إشعار جديد' };
  }

  const title = data.title || 'Job Syria';
  const options = {
    body: data.body || 'لديك إشعار جديد في التطبيق',
    icon: './icon-192.png',
    badge: './icon-192.png',
    image: data.image || undefined,
    vibrate: [300, 100, 300, 100, 300], // 📳 نمط اهتزاز قوي وملاحظ
    sound: 'default',                   // 🔊 تشغيل صوت التنبيه الافتراضي
    tag: data.tag || 'job-syria-notification',
    renotify: true,                      // إعادة الاهتزاز والصوت عند وصول إشعار جديد بنفس التاغ
    data: {
      url: data.url || '/'               // الرابط المراد فتحه عند النقر
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 5️⃣ فتح التطبيق عند النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close(); // إغلاق الإشعار عند النقر

  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // إذا كان التطبيق مفتوحاً بالفعل في الخلفية، اجلبه للأمام
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان مغلقاً تماماً، قم بفتحه
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
