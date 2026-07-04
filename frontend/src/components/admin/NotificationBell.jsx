import React, { useEffect, useState, useRef } from 'react';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import useNotificationStore from '../../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification
  } = useNotificationStore();

  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Polling every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-gray-500 hover:text-aria-maroon hover:bg-gray-100 rounded-full transition-colors"
      >
        <FiBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiBell className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Belum ada notifikasi.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors group relative ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <FiCheck /> Tandai dibaca
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[10px] flex items-center gap-1 text-red-500 hover:text-red-700 font-medium ml-auto"
                        >
                          <FiTrash2 /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
