import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import { useAuth } from '../hooks/useAuth';
import SEOHead from '../components/SEOHead';
import { useTranslation } from 'react-i18next';

/* ─── Icons ─── */
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const MapPinIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const PackageIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const PaletteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5" fill="none"/><circle cx="8.5" cy="7.5" r="2.5" fill="none"/><circle cx="6.5" cy="12.5" r="2.5" fill="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const StarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.4 7.6a2 2 0 0 0 2 1.4h7.6l-6 4.6a2 2 0 0 0-.7 2.2L19.6 24l-6.1-4.4a2 2 0 0 0-2.3 0L5 24l2.3-6.2a2 2 0 0 0-.7-2.2l-6-4.6H8a2 2 0 0 0 2-1.4L12 2z"/></svg>;
const ChevronIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const HeartIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const DownloadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;


/* ─── Status Badges ─── */
const STATUS_COLORS = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PROCESSING: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SHIPPED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELIVERED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  SUBMITTED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const StatusBadge = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.PENDING;
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
      {status?.replace(/_/g, ' ') || 'UNKNOWN'}
    </span>
  );
};

/* ─── Tab Components ─── */

function ProfileTab({ t, profile, onSave, i18n }) {
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Loyalty calculations
  const metrics = {
    currentTier: profile?.currentTier || 'BRONZE',
    totalSpent: profile?.totalSpent || 0,
    loyaltyPoints: profile?.rewardPoints || 0
  };
  
  const TIER_THRESHOLDS = { BRONZE: 0, SILVER: 500000, GOLD: 2000000, PLATINUM: 5000000 };
  const TIER_BENEFITS = {
    BRONZE: "Dapatkan poin (Aria Points) di setiap transaksi.",
    SILVER: "Bonus Poin 1.2x lipat & Akses promo eksklusif.",
    GOLD: "Diskon 5% untuk semua produk & Prioritas antrean sablon.",
    PLATINUM: "Diskon 10% all items, Bebas Ongkir, & Prioritas utama."
  };
  const TIER_COLORS = {
    BRONZE: "bg-gradient-to-br from-amber-600 to-amber-900 text-amber-50",
    SILVER: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900",
    GOLD: "bg-gradient-to-br from-yellow-300 to-amber-500 text-yellow-900",
    PLATINUM: "bg-gradient-to-br from-gray-800 to-black text-gray-100"
  };

  let nextTier = null;
  let spendNeeded = 0;
  let progressPercent = 100;
  let tierLabel = metrics.currentTier;
  
  if (tierLabel === 'BRONZE') {
    nextTier = 'SILVER';
    spendNeeded = TIER_THRESHOLDS.SILVER - metrics.totalSpent;
    progressPercent = (metrics.totalSpent / TIER_THRESHOLDS.SILVER) * 100;
  } else if (tierLabel === 'SILVER') {
    nextTier = 'GOLD';
    spendNeeded = TIER_THRESHOLDS.GOLD - metrics.totalSpent;
    progressPercent = ((metrics.totalSpent - TIER_THRESHOLDS.SILVER) / (TIER_THRESHOLDS.GOLD - TIER_THRESHOLDS.SILVER)) * 100;
  } else if (tierLabel === 'GOLD') {
    nextTier = 'PLATINUM';
    spendNeeded = TIER_THRESHOLDS.PLATINUM - metrics.totalSpent;
    progressPercent = ((metrics.totalSpent - TIER_THRESHOLDS.GOLD) / (TIER_THRESHOLDS.PLATINUM - TIER_THRESHOLDS.GOLD)) * 100;
  }

  if (spendNeeded < 0) spendNeeded = 0;
  if (progressPercent > 100) progressPercent = 100;
  if (progressPercent < 0) progressPercent = 0;

  useEffect(() => {
    if (profile) {
      setForm({ fullName: profile.fullName || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.profile.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />

      {/* VIP Loyalty Card */}
      <div className={`mb-8 p-6 md:p-8 rounded-3xl shadow-xl overflow-hidden relative ${TIER_COLORS[metrics.currentTier] || TIER_COLORS.BRONZE}`}>
        {/* Glassmorphism overlays */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay pointer-events-none blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-black opacity-10 mix-blend-overlay pointer-events-none blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          {/* Tier Info */}
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Customer Tier</p>
            <h3 className="text-4xl md:text-5xl font-display font-black tracking-tight mb-2 drop-shadow-sm">{metrics.currentTier}</h3>
            <p className="text-sm opacity-90 font-medium max-w-sm mt-3 bg-black/10 inline-block px-4 py-2 rounded-xl backdrop-blur-sm">
              ✨ {TIER_BENEFITS[metrics.currentTier]}
            </p>
          </div>

          {/* Points Balance */}
          <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner w-full md:w-auto">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shadow-lg border border-white/30">
              <StarIcon />
              <span className="font-bold text-xs ml-0.5 opacity-90">AP</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">{t.profile.ariaPoints}</p>
              <p className="text-3xl font-display font-bold">
                {metrics.loyaltyPoints?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
            <div className="flex justify-between items-end mb-2">
              <p className="text-sm font-semibold opacity-90">Progress menuju <span className="font-bold text-white uppercase">{nextTier}</span></p>
              <p className="text-xs font-bold opacity-80 uppercase tracking-wider text-right">
                Rp {spendNeeded.toLocaleString()} lagi
              </p>
            </div>
            
            <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden shadow-inner backdrop-blur-sm border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-white/90 rounded-full relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-50"></div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.profile.name}</label>
          <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.profile.email}</label>
          <input type="email" value={profile?.email || ''} disabled
            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 rounded-xl text-sm cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.profile.phone}</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        {profile?.createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t.profile.memberSince} {new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'long' }).format(new Date(profile.createdAt))}
          </p>
        )}
        <button type="submit" disabled={saving}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${saved ? 'bg-emerald-500 text-white' : 'bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal hover:bg-aria-maroon dark:hover:bg-amber-400'} disabled:opacity-50`}>
          {saved ? <span className="flex items-center justify-center gap-2"><CheckIcon /> {t.profile.saved}</span> : saving ? t.profile.saving : t.profile.saveBtn}
        </button>
      </form>
    </div>
  );
}

function AddressTab({ t, profile, onSave }) {
  const [form, setForm] = useState({ address: '', city: '', postalCode: '', province: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.postalCode || '',
        province: profile.province || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.address.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.address.address}</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm resize-none" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.address.city}</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.address.postalCode}</label>
            <input type="text" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.address.province}</label>
          <input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        <button type="submit" disabled={saving}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${saved ? 'bg-emerald-500 text-white' : 'bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal hover:bg-aria-maroon dark:hover:bg-amber-400'} disabled:opacity-50`}>
          {saved ? <span className="flex items-center justify-center gap-2"><CheckIcon /> {t.address.saved}</span> : saving ? t.address.saving : t.address.saveBtn}
        </button>
      </form>
    </div>
  );
}

function OrdersTab({ t, i18n }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.orders.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <PackageIcon />
          <p className="text-gray-400 dark:text-gray-500 mt-4 mb-6">{t.orders.empty}</p>
          <Link to="/products" className="inline-block px-6 py-3 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-aria-maroon dark:hover:bg-amber-400 transition-colors">
            {t.orders.shopNow}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-semibold dark:text-white">{t.orders.orderNumber}: {order.orderNumber || order.id?.slice(0, 12)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex gap-6 text-xs text-gray-400">
                    <span>{t.orders.date}: {new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'medium' }).format(new Date(order.createdAt))}</span>
                    <span>{t.orders.total}: Rp {Number(order.totalAmount || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Link to={`/order-tracking/${order.id}`} className="text-xs font-semibold uppercase tracking-wider text-aria-maroon dark:text-amber-400 hover:underline flex items-center gap-1">
                    {t.orders.detail} <ChevronIcon />
                  </Link>
                  {order.status === 'DELIVERED' && (
                    <Link to={`/order-tracking/${order.id}`} className="text-[10px] font-semibold uppercase tracking-wider bg-aria-maroon text-white hover:bg-black dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-1 mt-2 transition-colors shadow-sm">
                      <StarIcon /> Beri Ulasan
                    </Link>
                  )}
                  <a href={`/invoice/${order.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mt-2">
                    <DownloadIcon /> Download Invoice
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SablonTab({ t, i18n }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/design-requests');
        setRequests(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load design requests:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getProgressIndex = (status) => {
    const states = ['SUBMITTED', 'REVIEWED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED'];
    const idx = states.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const steps = [
    { label: 'Diterima', desc: 'Menunggu review' },
    { label: 'Direview', desc: 'Quotation dikirim' },
    { label: 'Approval', desc: 'Mockup disetujui' },
    { label: 'Produksi', desc: 'Sedang disablon' },
    { label: 'Selesai', desc: 'Siap dikirim' }
  ];

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.sablon.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      {requests.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="mx-auto w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <PaletteIcon />
          </div>
          <p className="text-gray-400 dark:text-gray-500 mb-6">{t.sablon.empty}</p>
          <Link to="/custom-design" className="inline-block px-8 py-3 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors">
            {t.sablon.createNew}
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {requests.map((req) => {
            const currentStep = getProgressIndex(req.status);
            return (
              <div key={req.id} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold dark:text-white uppercase tracking-widest">{req.designTitle || 'Custom Sablon'}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                      ID: {req.id.slice(0,8)} • Diajukan: {new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'short' }).format(new Date(req.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">Target Selesai</p>
                    <p className="text-sm font-bold">{req.deadline ? new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'short' }).format(new Date(req.deadline)) : 'TBA'}</p>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="relative mb-10 mt-4 overflow-hidden py-4">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 rounded"></div>
                  <div className="absolute top-1/2 left-0 h-1 bg-aria-charcoal dark:bg-white -translate-y-1/2 rounded transition-all duration-1000" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
                  <div className="relative flex justify-between">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 transition-colors z-10 ${idx <= currentStep ? 'bg-aria-charcoal border-aria-charcoal text-white dark:bg-white dark:border-white dark:text-black' : 'bg-white border-gray-300 text-gray-300 dark:bg-black dark:border-gray-700 dark:text-gray-700'}`}>
                          {idx < currentStep ? '✓' : idx + 1}
                        </div>
                        <p className={`text-[10px] uppercase tracking-widest mt-3 font-semibold hidden md:block ${idx <= currentStep ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-gray-50 dark:bg-gray-900/50 p-6 border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Produk</p>
                    <p className="text-xs font-semibold">{req.productTypeForSablon || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xs font-semibold">{req.quantity} Pcs</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Teknik</p>
                    <p className="text-xs font-semibold">{req.printTechnique || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Tujuan</p>
                    <p className="text-xs font-semibold">{req.purpose || '-'}</p>
                  </div>
                </div>

                {req.status === 'APPROVED' && (
                  <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Estimasi Harga</p>
                      <p className="text-lg font-bold text-aria-maroon dark:text-amber-400">Rp {Number(req.estimatedPrice || 0).toLocaleString()}</p>
                    </div>
                    <Link 
                      to={`/checkout-sablon/${req.id}`} 
                      className="px-6 py-3 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-xl flex items-center gap-2"
                    >
                      Lanjutkan Pembayaran
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PasswordTab({ t }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: t.password.mismatch, type: 'error' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage({ text: t.password.minLength, type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage({ text: t.password.changed, type: 'success' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to change password';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.password.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {message.text && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
            {message.text}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.password.current}</label>
          <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.password.new}</label>
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={6}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{t.password.confirm}</label>
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required minLength={6}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl focus:outline-none focus:border-aria-maroon dark:focus:border-amber-500 transition-colors text-sm" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal hover:bg-aria-maroon dark:hover:bg-amber-400 transition-all duration-300 disabled:opacity-50">
          {saving ? t.password.changing : t.password.changeBtn}
        </button>
      </form>
    </div>
  );
}

function WishlistTab({ t }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/wishlist');
      setWishlist(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      fetchWishlist();
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.wishlist.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      {wishlist.length === 0 ? (
        <div className="text-center py-16">
          <HeartIcon />
          <p className="text-gray-400 dark:text-gray-500 mt-4 mb-6">{t.wishlist.empty}</p>
          <Link to="/products" className="inline-block px-6 py-3 bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-aria-maroon dark:hover:bg-amber-400 transition-colors">
            {t.wishlist.shopNow}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlist.map((item) => (
            <div key={item.productId} className="flex gap-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="w-20 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                {item.imageUrl && <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold dark:text-white line-clamp-2">{item.productName}</h3>
                  <p className="text-xs font-semibold text-aria-maroon dark:text-amber-400 mt-1">Rp {Number(item.price).toLocaleString()}</p>
                </div>
                <button onClick={() => handleRemove(item.productId)} className="text-[10px] uppercase tracking-wider font-semibold text-red-500 hover:text-red-600 mt-2 text-left self-start">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PointHistoryTab({ t, i18n }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/users/points-history');
        setHistory(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load points history:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="py-12 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.pointHistory.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Dapatkan 1 Poin setiap pembelanjaan Rp 10.000 (status pesanan terkirim). 
        Tukarkan poin Anda saat Checkout (1 Poin = Potongan Rp 1.000).
      </p>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      
      {history.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClockIcon />
          <p className="mt-4">{t.pointHistory.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div>
                <p className="text-sm font-semibold dark:text-white">{h.description}</p>
                <p className="text-xs text-gray-400 mt-1">{new Intl.DateTimeFormat(i18n.language === 'EN' ? 'en-US' : 'id-ID', { dateStyle: 'long' }).format(new Date(h.createdAt))}</p>
              </div>
              <div className={`font-bold ${h.type === 'EARNED' ? 'text-emerald-500' : 'text-red-500'}`}>
                {h.type === 'EARNED' ? '+' : '-'}{h.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreferencesTab({ t, profile, onSave }) {
  const [form, setForm] = useState({ emailPromo: true, emailOrderUpdates: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        emailPromo: profile.emailPromo ?? true,
        emailOrderUpdates: profile.emailOrderUpdates ?? true,
      });
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    </label>
  );

  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.preferences.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <ToggleSwitch 
            label={t.preferences.emailPromo} 
            checked={form.emailPromo} 
            onChange={(e) => setForm({ ...form, emailPromo: e.target.checked })} 
          />
          <ToggleSwitch 
            label={t.preferences.emailOrderUpdates} 
            checked={form.emailOrderUpdates} 
            onChange={(e) => setForm({ ...form, emailOrderUpdates: e.target.checked })} 
          />
        </div>
        
        <button type="submit" disabled={saving}
          className={`w-full sm:w-auto mt-6 px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${saved ? 'bg-emerald-500 text-white' : 'bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal hover:bg-aria-maroon dark:hover:bg-amber-400'} disabled:opacity-50`}>
          {saved ? <span className="flex items-center justify-center gap-2"><CheckIcon /> {t.preferences.saved}</span> : saving ? t.preferences.saving : t.preferences.saveBtn}
        </button>
      </form>
    </div>
  );
}

function LogoutTab({ t, onLogout }) {
  return (
    <div>
      <h2 className="text-xl font-display font-semibold mb-2 dark:text-white">{t.logout.title}</h2>
      <div className="h-[1px] bg-gray-200 dark:bg-gray-700 mb-8" />
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
          <LogOutIcon />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t.logout.desc}</p>
        <button onClick={onLogout}
          className="px-8 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white transition-colors">
          {t.logout.btn}
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AccountPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { logout } = useAuth();
  const { t: rootT, i18n } = useTranslation('translation');
  const t = rootT('account', { returnObjects: true });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeTab = searchParams.get('tab') || 'profile';

  const tabs = useMemo(() => [
    { id: 'profile', label: t.tabs.profile, icon: <UserIcon /> },
    { id: 'address', label: t.tabs.address, icon: <MapPinIcon /> },
    { id: 'orders', label: t.tabs.orders, icon: <PackageIcon /> },
    { id: 'wishlist', label: t.tabs.wishlist, icon: <HeartIcon /> },
    { id: 'pointHistory', label: t.tabs.pointHistory, icon: <ClockIcon /> },
    { id: 'preferences', label: t.tabs.preferences, icon: <SettingsIcon /> },
    { id: 'sablon', label: t.tabs.sablon, icon: <PaletteIcon /> },
    { id: 'password', label: t.tabs.password, icon: <LockIcon /> },
    { id: 'logout', label: t.tabs.logout, icon: <LogOutIcon /> },
  ], [t]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aria-cream dark:bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-aria-maroon border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aria-cream dark:bg-black transition-colors duration-300">
      <SEOHead title={`${t.pageTitle} | Arianation`} description="Manage your Arianation account" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-display font-semibold dark:text-white">{t.pageTitle}</h1>
          {profile && (
            <div className="mt-2 max-w-md">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
                {profile.currentTier && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    profile.currentTier === 'PLATINUM' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    profile.currentTier === 'GOLD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    profile.currentTier === 'SILVER' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {profile.currentTier} TIER
                  </span>
                )}
              </div>
              {(() => {
                const fields = [profile.fullName, profile.phone, profile.address, profile.city, profile.postalCode, profile.province];
                const completed = fields.filter(f => f && f.trim() !== '').length;
                const progress = Math.round((completed / fields.length) * 100);
                return (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        Kelengkapan Profil
                      </span>
                      <span className="text-xs font-bold text-aria-maroon dark:text-amber-400">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-aria-maroon dark:bg-amber-400 h-1.5 rounded-full transition-all duration-1000" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    {progress < 100 && (
                      <p className="text-[10px] text-gray-400 mt-2">
                        Lengkapi data Anda (telepon & alamat) untuk pengalaman belanja yang lebih baik.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Navigation (Desktop) / Horizontal Tabs (Mobile) */}
          <nav className="lg:w-64 flex-shrink-0">
            {/* Mobile: horizontal scroll tabs */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Desktop: sidebar */}
            <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 sticky top-28">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1 last:mb-0 ${
                    activeTab === tab.id
                      ? 'bg-aria-charcoal dark:bg-white text-white dark:text-aria-charcoal shadow-md'
                      : tab.id === 'logout'
                        ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'profile' && <ProfileTab t={t} profile={profile} onSave={fetchProfile} i18n={i18n} />}
                  {activeTab === 'address' && <AddressTab t={t} profile={profile} onSave={fetchProfile} />}
                  {activeTab === 'orders' && <OrdersTab t={t} i18n={i18n} />}
                  {activeTab === 'wishlist' && <WishlistTab t={t} />}
                  {activeTab === 'pointHistory' && <PointHistoryTab t={t} i18n={i18n} />}
                  {activeTab === 'preferences' && <PreferencesTab t={t} profile={profile} onSave={fetchProfile} />}
                  {activeTab === 'sablon' && <SablonTab t={t} i18n={i18n} />}
                  {activeTab === 'password' && <PasswordTab t={t} />}
                  {activeTab === 'logout' && <LogoutTab t={t} onLogout={handleLogout} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
