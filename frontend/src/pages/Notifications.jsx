import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import PageTransition from '../components/PageTransition';
import SEOHead from '../components/SEOHead';
import { useTranslation } from 'react-i18next';
import PushNotificationBanner from '../components/PushNotificationBanner';

export default function Notifications() {
  const { t: rootT, i18n } = useTranslation('translation');
  const t = rootT('notifications', { returnObjects: true });
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    
    if (notif.type) {
      if (notif.type.startsWith('DESIGN_REQUEST')) {
        navigate('/account?tab=sablon');
      } else if (notif.type === 'SHIPPED' || notif.type === 'DELIVERED' || notif.type.startsWith('ORDER')) {
        navigate('/account?tab=orders');
      }
    }
  };

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications/customer?page=${pageNum}&limit=20`);
      if (res.data.success) {
        if (pageNum === 1) {
          setNotifications(res.data.data);
        } else {
          setNotifications(prev => [...prev, ...res.data.data]);
        }
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1);
    }
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/customer/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/customer/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">{t.loginRequired}</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <SEOHead title={`${t.pageTitle} - Arianation`} description={t.pageDesc} />
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-aria-charcoal dark:text-white mb-2">
              {t.pageTitle}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.pageDesc}
            </p>
          </div>
          <button 
            onClick={handleMarkAllAsRead}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest flex items-center gap-1 mb-1"
          >
            <Check className="w-3 h-3" />
            {t.markAllRead}
          </button>
        </div>

        {loading && page === 1 ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-aria-lightgray border-t-aria-maroon rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{t.emptyTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-500">{t.emptyDesc}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                className={`p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md ${!notif.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 shadow-sm' : 'bg-white dark:bg-black border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-sm md:text-base font-bold ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {t.new}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notif.createdAt))}</span>
                    </div>
                  </div>
                  
                  {!notif.isRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                      }}
                      className="flex-shrink-0 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {meta && page < meta.totalPages && (
              <div className="pt-8 flex justify-center">
                <button 
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchNotifications(nextPage);
                  }}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-100 dark:bg-gray-900 text-aria-charcoal dark:text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loading ? t.loading : t.loadMore}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <PushNotificationBanner context="umum" />
    </PageTransition>
  );
}
