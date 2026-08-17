import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Building2, 
  PlusCircle, 
  ShieldCheck, 
  QrCode, 
  Sliders, 
  Sparkles, 
  ChevronRight, 
  RefreshCw,
  Gift,
  MapPin,
  CheckCircle2,
  Award,
  LogOut,
  Search,
  Check,
  XCircle,
  FileText,
  Trophy,
  Send,
  Flame,
  TrendingUp,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import { getTelegramUserData, triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { BusinessOnboardingModal } from './BusinessOnboardingModal';
import { ManageUserRoleModal } from './ManageUserRoleModal';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { WaiterScreen } from './WaiterScreen';
import { PlatformAnalyticsScreen } from './PlatformAnalyticsScreen';
import { useAppStore } from '../store/useAppStore';
import { VenueAvatar } from './VenueAvatar';

interface ProfileScreenProps {
  onSwitchToClientMode: () => void;
}

const DEMO_MANAGER_STAFF = {
  id: 'demo-staff-2',
  partnerId: 'demo-partner-1',
  name: 'Анна (Менеджер)',
  role: 'MANAGER',
  boxesIssuedCount: 42,
  partner: {
    id: 'demo-partner-1',
    name: 'Sunset Beach Club',
    category: 'HORECA',
    logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    address: 'Phu Quoc, Long Beach, St 4',
  }
};

const DEMO_WAITER_STAFF = {
  id: 'demo-staff-1',
  partnerId: 'demo-partner-1',
  name: 'Алекс (Sunset Bar)',
  role: 'WAITER',
  boxesIssuedCount: 14,
  partner: {
    id: 'demo-partner-1',
    name: 'Sunset Beach Club',
    category: 'HORECA',
    logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    address: 'Phu Quoc, Long Beach, St 4',
  }
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSwitchToClientMode }) => {
  const { role, setRole } = useAppStore();
  const tgUser = getTelegramUserData();

  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBusinessOnboardingModal, setShowBusinessOnboardingModal] = useState(false);
  const [showManageRoleModal, setShowManageRoleModal] = useState(false);
  const [viewMode, setViewMode] = useState<'PROFILE' | 'ADMIN' | 'WAITER' | 'ANALYTICS'>('PROFILE');

  // Состояние копирования Revoo-ссылок
  const [revooLinkCopied, setRevooLinkCopied] = useState(false);
  const [revooTmaCopied, setRevooTmaCopied] = useState(false);

  // Состояние заявок для заведения владельца/управляющего
  const [partnerApps, setPartnerApps] = useState<any[]>([]);
  const [partnerAppSearch, setPartnerAppSearch] = useState('');

  // Состояние Турнирной таблицы (Leaderboard)
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'today' | 'week'>('today');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [topLeader, setTopLeader] = useState<any | null>(null);
  const [totalIssuedPeriod, setTotalIssuedPeriod] = useState(0);

  const checkStaffRole = async () => {
    try {
      setLoading(true);
      if (tgUser?.id) {
        const res = await fetch(`/api/staff/check-member/${tgUser.id}`);
        const data = await res.json();
        if (data.success && data.isStaff) {
          setIsStaff(true);
          setStaffInfo(data.staff);
          return;
        }
      }

      // Проверяем сохраненный демо-профиль в localStorage
      const savedDemoStaff = localStorage.getItem('giftx_demo_staff');
      if (savedDemoStaff) {
        const parsed = JSON.parse(savedDemoStaff);
        setIsStaff(true);
        setStaffInfo(parsed);
      } else {
        setIsStaff(false);
        setStaffInfo(null);
      }
    } catch (e) {
      console.error('Check staff role error', e);
      setIsStaff(false);
      setStaffInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerApps = async () => {
    if (!staffInfo?.partner?.id) return;
    try {
      const q = partnerAppSearch ? `&search=${encodeURIComponent(partnerAppSearch)}` : '';
      const res = await fetch(`/api/admin/applications?partnerId=${staffInfo.partner.id}${q}`);
      const data = await res.json();
      if (data.success) {
        setPartnerApps(data.applications);
      }
    } catch (e) {
      console.error('Fetch partner apps error', e);
    }
  };

  const fetchLeaderboard = async () => {
    const partnerId = staffInfo?.partner?.id || 'demo-partner-1';
    try {
      const res = await fetch(`/api/staff/leaderboard/${partnerId}?period=${leaderboardPeriod}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboardData(data.leaderboard);
        setTopLeader(data.topLeader);
        setTotalIssuedPeriod(data.totalIssuedPeriod);
      }
    } catch (e) {
      console.error('Fetch leaderboard error', e);
    }
  };

  useEffect(() => {
    checkStaffRole();
  }, []);

  useEffect(() => {
    if (isStaff && staffInfo?.partner?.id) {
      fetchPartnerApps();
    }
    fetchLeaderboard();
  }, [isStaff, staffInfo?.partner?.id, partnerAppSearch, leaderboardPeriod]);

  const handleCongratulateWinner = async (winnerName: string, boxesCount: number) => {
    try {
      triggerNotificationHaptic('success');
      const partnerId = staffInfo?.partner?.id || 'demo-partner-1';
      const res = await fetch('/api/staff/leaderboard/congratulate-winner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, winnerName, boxesCount })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Поздравление победителю [${winnerName}] успешно отправлено в Telegram Бот!\n\nТекст сообщения:\n${data.botMessage}`);
      }
    } catch (e: any) {
      alert('Ошибка отправки: ' + e.message);
    }
  };

  const handleSendDailyReport = async () => {
    try {
      triggerNotificationHaptic('success');
      const partnerId = staffInfo?.partner?.id || 'demo-partner-1';
      const res = await fetch('/api/staff/leaderboard/send-daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Дневной отчет заведения «${data.partnerName}» отправлен Владельцу в Telegram Бот!\n\nТекст отчета:\n${data.reportMessage}`);
      }
    } catch (e: any) {
      alert('Ошибка отправки отчета: ' + e.message);
    }
  };

  const handleApprovePartnerApp = async (id: string) => {
    try {
      triggerNotificationHaptic('success');
      const res = await fetch(`/api/admin/applications/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchPartnerApps();
      }
    } catch (e) {
      console.error('Approve partner app error', e);
    }
  };

  const handleRejectPartnerApp = async (id: string) => {
    try {
      triggerNotificationHaptic('warning');
      const res = await fetch(`/api/admin/applications/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchPartnerApps();
      }
    } catch (e) {
      console.error('Reject partner app error', e);
    }
  };

  const handleActivateDemoManager = () => {
    triggerHaptic('medium');
    localStorage.setItem('giftx_demo_staff', JSON.stringify(DEMO_MANAGER_STAFF));
    setIsStaff(true);
    setStaffInfo(DEMO_MANAGER_STAFF);
    setViewMode('ADMIN');
    setRole('ADMIN');
  };

  const handleActivateDemoWaiter = () => {
    triggerHaptic('medium');
    localStorage.setItem('giftx_demo_staff', JSON.stringify(DEMO_WAITER_STAFF));
    setIsStaff(true);
    setStaffInfo(DEMO_WAITER_STAFF);
    setViewMode('WAITER');
    setRole('WAITER');
  };

  const handleClearDemoStaff = () => {
    triggerHaptic('light');
    localStorage.removeItem('giftx_demo_staff');
    setIsStaff(false);
    setStaffInfo(null);
    setViewMode('PROFILE');
    setRole('PROFILE');
  };

  // Экран Детальной Аналитики и Монетизации
  if (viewMode === 'ANALYTICS') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div 
          className="bg-slate-900/95 border-b border-slate-800 px-3 pb-3 max-w-md mx-auto flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 52px)'
          }}
        >
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('PROFILE');
            }}
            className="text-xs font-bold text-amber-400 flex items-center space-x-1 hover:underline"
          >
            <span>← Назад в Мой Профиль</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            Аналитика & Биллинг
          </span>
        </div>
        <PlatformAnalyticsScreen onClose={() => setViewMode('PROFILE')} />
      </div>
    );
  }

  // Если пользователь внутри профиля переключил вид на встроенный Admin или Waiter экран
  if (viewMode === 'ADMIN') {
    return (
      <div className="relative">
        <div 
          className="bg-slate-900/95 border-b border-slate-800 px-3 pb-3 max-w-md mx-auto flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 52px)'
          }}
        >
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('PROFILE');
              setRole('PROFILE');
            }}
            className="text-xs font-bold text-amber-400 flex items-center space-x-1 hover:underline"
          >
            <span>← Назад в Мой Профиль</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            Режим Управляющего
          </span>
        </div>
        <AdminDashboardScreen />
      </div>
    );
  }

  if (viewMode === 'WAITER') {
    return (
      <div className="relative">
        <div 
          className="bg-slate-900/95 border-b border-slate-800 px-3 pb-3 max-w-md mx-auto flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 52px)'
          }}
        >
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('PROFILE');
              setRole('PROFILE');
            }}
            className="text-xs font-bold text-amber-400 flex items-center space-x-1 hover:underline"
          >
            <span>← Назад в Мой Профиль</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            Режим Официанта
          </span>
        </div>
        <WaiterScreen />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-4 font-sans">
      {/* Шапка карточки профиля пользователя (Кликабельный блок данных для смены ролей - ТЕЛЕГРАМ СТИЛЬ) */}
      <div 
        onClick={() => {
          triggerHaptic('medium');
          setShowManageRoleModal(true);
        }}
        className="bg-[#17212b] hover:bg-[#1f2c3a] p-4.5 rounded-2xl border border-white/5 shadow-md relative overflow-hidden cursor-pointer transition-all active:scale-[0.99] group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            {/* Фото из Telegram или аватар */}
            {tgUser?.photo_url ? (
              <img
                src={tgUser.photo_url}
                alt={tgUser.first_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#2aabee] shadow-md shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#2aabee] to-[#229ed9] p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#17212b] rounded-full flex items-center justify-center font-bold text-xl text-[#2aabee]">
                  {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : <UserIcon className="w-6 h-6 text-[#2aabee]" />}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold text-slate-100 group-hover:text-[#2aabee] transition-colors">
                  {tgUser?.first_name || 'Пользователь'} {tgUser?.last_name || ''}
                </h1>
                {isStaff && (
                  <span className="px-2 py-0.5 rounded-full bg-[#2aabee]/20 text-[#2aabee] border border-[#2aabee]/30 text-[9px] font-bold uppercase">
                    {staffInfo?.role || 'БИЗНЕС'}
                  </span>
                )}
              </div>

              {tgUser?.username && (
                <p className="text-xs text-[#2aabee] font-medium">@{tgUser.username}</p>
              )}

              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                ID: {tgUser?.id || 'Demo-Guest-101'}
              </p>
            </div>
          </div>

          <div className="py-1.5 px-2.5 rounded-full bg-[#242f3d] border border-white/5 text-[#2aabee] text-[10px] font-bold flex items-center space-x-1 shadow-sm shrink-0">
            <Sliders className="w-3.5 h-3.5" />
            <span>Смена роли</span>
          </div>
        </div>
      </div>

      {/* Блок привязанного бизнеса (если пользователь является сотрудником/владельцем/менеджером) */}
      {isStaff && staffInfo?.partner && (() => {
        // --- Revoo venue deep link ---
        const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'giftx2025_bot';
        const partnerId = staffInfo.partner.id;

        // Прямая Web App ссылка (для открытия напрямую в любом браузере)
        const revooWebAppLink = `${window.location.origin}/?venue=${partnerId}`;
        // Telegram Mini App ссылка (для открытия через Telegram Бот)
        const revooTmaLink = `https://t.me/${botUsername}?start=venue_${partnerId}`;

        const handleCopyRevooLink = (linkToCopy: string, type: 'webapp' | 'tma') => {
          triggerHaptic('light');
          navigator.clipboard.writeText(linkToCopy).then(() => {
            if (type === 'webapp') {
              setRevooLinkCopied(true);
              setTimeout(() => setRevooLinkCopied(false), 2500);
            } else {
              setRevooTmaCopied(true);
              setTimeout(() => setRevooTmaCopied(false), 2500);
            }
          });
        };

        return (
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-amber-950/20 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <VenueAvatar
                logoUrl={staffInfo.partner.logoUrl}
                name={staffInfo.partner.name}
                className="w-12 h-12 rounded-2xl border border-amber-500/30 shrink-0 shadow-md"
              />
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-amber-400 block">
                  Ваше Заведение
                </span>
                <h3 className="font-extrabold text-slate-100 text-sm">{staffInfo.partner.name}</h3>
                <p className="text-[11px] text-slate-400">{staffInfo.partner.address}</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs">
              {staffInfo.role}
            </span>
          </div>

          {/* ── Revoo Direct WebApp Link Block ── */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/70 via-slate-900 to-slate-950 border border-violet-500/40 space-y-2.5 shadow-inner">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                <Link className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-violet-400 block">Revoo — WebApp Ссылка Заведения</span>
                <span className="text-[10px] text-slate-400">Прямой URL для открытия в браузере (аналог QR)</span>
              </div>
            </div>

            {/* Direct WebApp Link preview */}
            <div className="flex items-center space-x-2 bg-slate-950/90 rounded-xl px-3 py-2 border border-slate-800">
              <span className="text-[10px] text-violet-300 font-mono truncate flex-1 select-all">{revooWebAppLink}</span>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                id="revoo-copy-webapp-btn"
                onClick={() => handleCopyRevooLink(revooWebAppLink, 'webapp')}
                className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all active:scale-95 ${
                  revooLinkCopied
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
                }`}
              >
                {revooLinkCopied ? (
                  <><Check className="w-3.5 h-3.5" /><span>Скопировано!</span></>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /><span>Скопировать WebApp URL</span></>
                )}
              </button>

              <a
                id="revoo-open-webapp-btn"
                href={revooWebAppLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('light')}
                className="py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md shadow-violet-500/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Открыть</span>
              </a>
            </div>

            {/* Вторичный вариант: Telegram Mini App URL */}
            <div className="pt-2 border-t border-violet-500/20 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">Вариант для Telegram (TMA):</span>
              <button
                onClick={() => handleCopyRevooLink(revooTmaLink, 'tma')}
                className="text-violet-400 hover:text-violet-300 font-bold flex items-center space-x-1 underline"
              >
                <Copy className="w-3 h-3" />
                <span>{revooTmaCopied ? 'Скопировано!' : 'Скопировать TMA-ссылку'}</span>
              </button>
            </div>
          </div>

          {/* Панель переключения рабочих режимов для владельца/персонала */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Рабочие панели заведения:
            </p>

            {(staffInfo.role === 'OWNER' || staffInfo.role === 'MANAGER') && (
              <>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setViewMode('ADMIN');
                    setRole('ADMIN');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-between transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-2.5">
                    <Sliders className="w-4 h-4" />
                    <span>
                      {staffInfo.role === 'MANAGER'
                        ? 'Открыть Панель Управляющего'
                        : 'Открыть Панель Владельца'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setViewMode('ANALYTICS');
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center justify-between transition-all shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Статистика & Биллинг Монетизации</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </button>
              </>
            )}

            <button
              onClick={() => {
                triggerHaptic('medium');
                setViewMode('WAITER');
                setRole('WAITER');
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-extrabold text-xs flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Выдача боксов клиентам (Экран Официанта)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {staffInfo?.id?.startsWith('demo-') && (
              <button
                onClick={handleClearDemoStaff}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти из демо-режима персонала</span>
              </button>
            )}
          </div>

          {/* Блок заявок персонала в данное заведение (для Владельца и Управляющего) */}
          {(staffInfo.role === 'OWNER' || staffInfo.role === 'MANAGER') && (
            <div className="pt-3 border-t border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 flex items-center space-x-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Заявки персонала ({partnerApps.filter(a => a.status === 'PENDING').length} ож.)</span>
                </span>
                <span className="text-[10px] text-slate-400">Поиск & Управление</span>
              </div>

              {/* Поиск среди заявок заведения */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={partnerAppSearch}
                  onChange={(e) => setPartnerAppSearch(e.target.value)}
                  placeholder="Поиск по имени соискателя..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
                />
              </div>

              {/* Список заявок в заведение */}
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {partnerApps.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-[11px] bg-slate-950/40 rounded-xl border border-slate-800/60">
                    Заявок в ваше заведение пока нет
                  </div>
                ) : (
                  partnerApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-slate-100">{app.applicantName}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap shrink-0 ${
                                app.applicantRole === 'MANAGER'
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}
                            >
                              {app.applicantRole}
                            </span>
                          </div>
                          {app.comment && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">{app.comment}</span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap shrink-0 ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : app.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {app.status === 'APPROVED' ? 'Одобрен' : app.status === 'REJECTED' ? 'Отклонен' : 'Ожидает'}
                        </span>
                      </div>

                        {app.status === 'PENDING' && (
                          <div className="flex space-x-2 pt-1 border-t border-slate-800/60">
                            <button
                              onClick={() => handleRejectPartnerApp(app.id)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold whitespace-nowrap flex items-center justify-center"
                            >
                              Отклонить
                            </button>
                            <button
                              onClick={() => handleApprovePartnerApp(app.id)}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] shadow-sm shadow-emerald-500/20 hover:bg-emerald-400 whitespace-nowrap flex items-center justify-center"
                            >
                              Одобрить
                            </button>
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Турнирная таблица персонала заведения (Leaderboard & Gamification) */}
          <div className="pt-3 border-t border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                    Турнирная таблица персонала
                  </h4>
                  <p className="text-[10px] text-slate-400">Рейтинг выдачи боксов заведением</p>
                </div>
              </div>

              {/* Переключатель периода: Сегодня / За неделю */}
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLeaderboardPeriod('today')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                    leaderboardPeriod === 'today'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Сегодня
                </button>
                <button
                  onClick={() => setLeaderboardPeriod('week')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                    leaderboardPeriod === 'week'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  За неделю
                </button>
              </div>
            </div>

            {/* Карточка текущего лидера смены */}
            {topLeader && (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-400/40 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-md animate-pulse">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-black text-amber-400 tracking-widest block">
                      Лидер {leaderboardPeriod === 'today' ? 'дня' : 'недели'}
                    </span>
                    <h5 className="font-extrabold text-slate-100 text-xs">{topLeader.name}</h5>
                    <span className="text-[10px] font-bold text-emerald-400">
                      +{topLeader.count} боксов выданных гостям
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleCongratulateWinner(topLeader.name, topLeader.count)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black shadow-md shadow-amber-500/20 active:scale-95 flex items-center space-x-1 shrink-0"
                >
                  <Trophy className="w-3 h-3 text-slate-950" />
                  <span>Поздравить в Bot</span>
                </button>
              </div>
            )}

            {/* Рейтинг сотрудников */}
            <div className="space-y-1.5">
              {leaderboardData.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    staff.isLeader
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-black text-xs w-6 text-center text-amber-400">
                      {staff.badge}
                    </span>
                    <div>
                      <span className="font-bold block text-slate-100">{staff.name}</span>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">{staff.role}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-amber-400 text-xs block">{staff.count} боксов</span>
                    <span className="text-[9px] text-emerald-400 font-mono">
                      ~{Math.round(staff.count * 0.4)} гостей вернутся
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка отправки отчета Владельцу в Telegram */}
            {(staffInfo.role === 'OWNER' || staffInfo.role === 'MANAGER') && (
              <button
                onClick={handleSendDailyReport}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 hover:border-amber-500/40 text-amber-400 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.99] mt-2"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Отправить дневной отчет Владельцу в Telegram</span>
              </button>
            )}
          </div>
        </div>
        );
      })()}

      {/* Баннер регистрации бизнеса и быстрый переход в Панель Управляющего (если пользователь еще не привязан к бизнесу) */}
      {!isStaff && (
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                GiftX B2B Сеть
              </span>
              <h3 className="text-base font-extrabold text-slate-100 mt-1">Подключите ваше заведение</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Привлекайте новых гостей из других ресторанов, СПА и сервисов города бесплатно без бюджета на рекламу!
          </p>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                setShowBusinessOnboardingModal(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Зарегистрировать заведение</span>
            </button>

            {/* Быстрая демо-кнопка входа в Панель Управляющего */}
            <button
              onClick={handleActivateDemoManager}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Войти как Управляющий (Панель заведения)</span>
            </button>

            {/* Быстрая демо-кнопка входа в Экран Официанта */}
            <button
              onClick={handleActivateDemoWaiter}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Войти как Официант (Выдача QR-боксов)</span>
            </button>
          </div>
        </div>
      )}

      {/* Дополнительные опции пользователя */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">
          Настройки и сессии
        </h4>

        <button
          onClick={() => {
            triggerHaptic('medium');
            setViewMode('ANALYTICS');
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-between hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Статистика посещаемости и Монетизации</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onSwitchToClientMode();
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-between hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Перейти в Кошелек «Мои Подарки»</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            checkStaffRole();
          }}
          className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1.5 hover:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Обновить статус роли</span>
        </button>
      </div>

      {/* Модалка обучения перед регистрацией заведения */}
      {showBusinessOnboardingModal && (
        <BusinessOnboardingModal
          onClose={() => setShowBusinessOnboardingModal(false)}
          onProceedToRegistration={() => {
            setShowBusinessOnboardingModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* Модалка регистрации заведения */}
      {showRegisterModal && (
        <PartnerRegistrationModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            checkStaffRole();
          }}
        />
      )}

      {/* Модалка управления ролями при клике по блоку с именем и фото */}
      {showManageRoleModal && (
        <ManageUserRoleModal
          onClose={() => setShowManageRoleModal(false)}
          currentStaff={staffInfo}
          isStaff={isStaff}
          onRoleChanged={(newRole, newStaff) => {
            if (newStaff) {
              setIsStaff(true);
              setStaffInfo(newStaff);
              if (newRole === 'WAITER') setViewMode('WAITER');
              else if (['ADMIN', 'MANAGER', 'OWNER'].includes(newRole)) setViewMode('ADMIN');
              else setViewMode('PROFILE');
            } else {
              setIsStaff(false);
              setStaffInfo(null);
              setViewMode('PROFILE');
              setRole('PROFILE');
            }
          }}
          onOpenVenueSearch={() => {
            setViewMode('WAITER');
          }}
          onOpenPartnerRegister={() => {
            setShowRegisterModal(true);
          }}
          onClearStaffRole={() => {
            localStorage.removeItem('giftx_demo_staff');
            setIsStaff(false);
            setStaffInfo(null);
            setViewMode('PROFILE');
            setRole('PROFILE');
          }}
        />
      )}
    </div>
  );
};
