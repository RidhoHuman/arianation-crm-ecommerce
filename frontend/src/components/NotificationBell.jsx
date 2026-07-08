import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/customer?limit=5');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.meta.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Polling every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/customer/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/customer/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  if (!isAuthenticated || user?.role === 'ADMIN' || user?.role === 'OWNER') {
    return null; // Admins use admin dashboard for notifications
  }

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 text-gray-500 hover:text-aria-maroon dark:text-gray-300 dark:hover:text-white transition-colors"
      >
        <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-aria-maroon text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-80 bg-white dark:bg-black border border-aria-lightgray dark:border-gray-800 shadow-xl rounded-md z-50 overflow-hidden">
          <div className="p-4 border-b border-aria-lightgray dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-xs font-bold ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <button onClick={(e) => handleMarkAsRead(notif.id, e)} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline ml-2 flex-shrink-0">
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed mb-2">
                    {notif.message}
                  </p>
                  <span className="text-[9px] text-gray-400">
                    {new Date(notif.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 bg-gray-50 dark:bg-gray-900 border-t border-aria-lightgray dark:border-gray-800 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-aria-charcoal dark:text-gray-300 hover:text-aria-maroon dark:hover:text-white tracking-widest uppercase transition-colors"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
