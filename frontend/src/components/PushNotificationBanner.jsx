import React, { useState, useEffect } from 'react';
import { usePushNotification } from '../hooks/usePushNotification';
import { Bell, X } from 'lucide-react';

const PushNotificationBanner = ({ context = 'umum' }) => {
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushNotification();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if supported, not subscribed, and hasn't been permanently dismissed/denied
    if (isSupported && !isSubscribed && permission !== 'denied') {
      const dismissed = localStorage.getItem('push_banner_dismissed');
      if (!dismissed) {
        // Add a slight delay so it doesn't appear immediately on mount
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('push_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-red-100 dark:border-gray-700 p-4 z-50 flex items-start space-x-3 transform transition-all duration-500 translate-y-0">
      <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
        <Bell className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          Nyalakan Notifikasi?
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 mb-3">
          {context === 'checkout' 
            ? 'Dapatkan update real-time tentang status pesanan dan pengiriman Anda.'
            : context === 'design'
            ? 'Dapatkan pemberitahuan langsung saat tim kami mereview atau menyetujui desain Anda.'
            : 'Dapatkan update status pesanan dan promo terbaru langsung di layar Anda.'}
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Ya, Nyalakan'}
          </button>
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PushNotificationBanner;
