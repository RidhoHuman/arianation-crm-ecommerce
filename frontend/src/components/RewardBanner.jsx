import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import api from '../services/api';

export default function RewardBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const language = useUIStore((s) => s.language) || 'ID';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [welcomeBonus, setWelcomeBonus] = useState(10); // Default

  useEffect(() => {
    if (isAuthenticated) return;
    const dismissed = sessionStorage.getItem('arianation-reward-banner-dismissed');
    if (dismissed) return;
    
    // Fetch settings
    api.get('/settings')
      .then(res => {
        const data = res.data;
        if (data.success && data.data && data.data.welcome_bonus_points) {
          setWelcomeBonus(Number(data.data.welcome_bonus_points));
        }
      })
      .catch(err => console.error('Failed to fetch settings for banner:', err));

    // Show immediately with a tiny delay for the mount animation
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('arianation-reward-banner-dismissed', 'true');
  };

  const text = language === 'EN'
    ? { msg: `🎁 Register now & get ${welcomeBonus} Aria Points (Value Rp ${(welcomeBonus * 1000).toLocaleString('id-ID')}) for free!`, cta: 'Register →' }
    : { msg: `🎁 Daftar akun & dapatkan ${welcomeBonus} Aria Points (Senilai Rp ${(welcomeBonus * 1000).toLocaleString('id-ID')}) gratis!`, cta: 'Daftar →' };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full overflow-hidden z-30 relative"
        >
          <div className="w-full bg-gradient-to-r from-aria-maroon via-amber-600 to-aria-maroon py-2.5 px-4">
            <div className="max-w-[1440px] mx-auto flex items-center justify-center gap-3 flex-wrap">
              <span className="text-white text-xs sm:text-sm font-medium tracking-wide">
                {text.msg}
              </span>
              <Link
                to="/register"
                onClick={handleDismiss}
                className="inline-block bg-white text-aria-maroon px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-amber-50 transition-colors shadow-sm"
              >
                {text.cta}
              </Link>
              <button
                onClick={handleDismiss}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
