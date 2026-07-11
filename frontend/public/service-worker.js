self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'AriaNation Notification';
      const options = {
        body: data.body || 'You have a new notification.',
        icon: data.icon || '/images/arianation-logo.png',
        badge: '/favicon.png',
        data: {
          url: data.url || '/'
        }
      };

      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
      // Fallback
      event.waitUntil(
        self.registration.showNotification('AriaNation Notification', {
          body: event.data.text(),
          icon: '/images/arianation-logo.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
