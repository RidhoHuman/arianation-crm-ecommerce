import { useState, useEffect } from 'react';
import api from '../services/api';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const usePushNotification = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from backend
      const { data } = await api.get('/notifications/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send to backend
      await api.post('/notifications/subscribe', subscription);
      
      setIsSubscribed(true);
      setPermission(Notification.permission);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await api.delete('/notifications/unsubscribe', {
          data: { endpoint: subscription.endpoint }
        });
        setIsSubscribed(false);
      }
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setIsLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe
  };
};
