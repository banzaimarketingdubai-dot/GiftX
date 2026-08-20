import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { initTelegramApp, triggerHaptic, getTelegramUserData } from './telegram';
import { WaiterScreen } from './components/WaiterScreen';
import { GuestUnpackScreen } from './components/GuestUnpackScreen';
import { WalletScreen } from './components/WalletScreen';
import { PartnerMapScreen } from './components/PartnerMapScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { GuestHomeScreen } from './components/GuestHomeScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { BusinessOnboardingModal } from './components/BusinessOnboardingModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { QrScannerModal } from './components/QrScannerModal';
import { GuestLandingPage } from './components/GuestLandingPage';
import { BusinessLandingPage } from './components/BusinessLandingPage';
import { PartnerRegistrationModal } from './components/PartnerRegistrationModal';
import { StaffInviteModal } from './components/StaffInviteModal';
import { DemoBoxOpeningModal } from './components/DemoBoxOpeningModal';
import { VenueGuestModal } from './components/VenueGuestModal';
import { Home, MapPin, User, HelpCircle, Building2, Sparkles, Gift, Search, QrCode, ShieldAlert } from 'lucide-react';

const getInitialVenueId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    let venueId = urlParams.get('venue');
    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (!venueId && tgStartParam && tgStartParam.startsWith('venue_')) {
      venueId = tgStartParam.replace(/^venue_/, '');
    }
    return venueId;
  } catch (e) {
    return null;
  }
};

export const App: React.FC = () => {
  const { role, setRole, setPartners } = useAppStore();
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [venueModalPartnerId, setVenueModalPartnerId] = useState<string | null>(getInitialVenueId);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBusinessOnboardingModal, setShowBusinessOnboardingModal] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [helpGuideDefaultRole, setHelpGuideDefaultRole] = useState<'GUEST' | 'WAITER' | 'ADMIN'>('GUEST');
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showDemoBoxModal, setShowDemoBoxModal] = useState(false);
  const [showPartnerRegisterModal, setShowPartnerRegisterModal] = useState(false);
  const [staffInvitePartner, setStaffInvitePartner] = useState<any | null>(null);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any | null>(null);
  const [activeLanding, setActiveLanding] = useState<'GUEST' | 'BUSINESS' | null>(null);

  const [activeVouchersCount, setActiveVouchersCount] = useState<number>(0);

  const updateVouchersBadge = () => {
    try {
      const localStr = localStorage.getItem('giftx_saved_vouchers');
      const localVouchers = localStr ? JSON.parse(localStr) : [];
      if (Array.isArray(localVouchers)) {
        const activeCount = localVouchers.filter((v: any) => v.status === 'ACTIVE' || !v.status).length;
        setActiveVouchersCount(activeCount);
      } else {
        setActiveVouchersCount(0);
      }
    } catch (e) {
      setActiveVouchersCount(0);
    }
  };

  useEffect(() => {
    updateVouchersBadge();

    const tgUser = getTelegramUserData();
    if (tgUser?.id) {
      fetch(`/api/guest/vouchers?telegramId=${tgUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.wallet)) {
            const activeVouchers = data.wallet.filter((v: any) => v.status === 'ACTIVE');
            setActiveVouchersCount(activeVouchers.length);
          }
        })
        .catch(() => {});
    }

    const handleUpdate = () => updateVouchersBadge();
    window.addEventListener('giftx_vouchers_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('giftx_vouchers_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    initTelegramApp();

    // Загрузка партнеров для B2B
    fetch('/api/staff/partners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPartners(data.partners);
        }
      })
      .catch((err) => console.error('Partners fetch error', err));

    const tgUser = getTelegramUserData();

    // Проверка привязки к бизнесу (официант / владелец)
    if (tgUser?.id) {
      fetch(`/api/staff/check-member/${tgUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.isStaff) {
            setIsBusinessUser(true);
            setStaffInfo(data.staff);
            if (data.staff) {
              useAppStore.getState().setSelectedStaff({
                id: data.staff.id,
                partnerId: data.staff.partnerId,
                name: data.staff.name,
                role: data.staff.role,
                boxesIssuedCount: data.staff.boxesIssuedCount || 0,
                partner: data.staff.partner
              });
            }
            // Приложение всегда открывается с Главного экрана (GUEST)
          }
        })
        .catch((err) => console.error('Check staff error', err));
    }

    // Проверка параметров URL или Telegram WebApp start_param
    const urlParams = new URLSearchParams(window.location.search);
    let claim = urlParams.get('claim') || urlParams.get('tgWebAppStartParam');
    let venueId = urlParams.get('venue');
    const roleParam = urlParams.get('role');
    const pageParam = urlParams.get('page');

    if (pageParam === 'landing-guest' || pageParam === 'guest') {
      setActiveLanding('GUEST');
    } else if (['landing-business', 'landing_business', 'business', 'b2b', 'partner', 'owner'].includes(pageParam || '')) {
      setActiveLanding('BUSINESS');
      setShowBusinessOnboardingModal(true);
    } else if (['demo-box', 'demo_box', 'demo', 'demobox'].includes(pageParam || '')) {
      setShowDemoBoxModal(true);
    }

    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (tgStartParam) {
      if (tgStartParam.startsWith('venue_')) {
        venueId = tgStartParam.replace(/^venue_/, '');
      } else if (tgStartParam.startsWith('claim_')) {
        claim = tgStartParam.replace(/^claim_/, '');
      } else if (['ADMIN', 'MAP', 'WALLET', 'WAITER', 'PROFILE'].includes(tgStartParam)) {
        setRole(tgStartParam as any);
      } else if (tgStartParam === 'landing_guest' || tgStartParam === 'landing-guest') {
        setActiveLanding('GUEST');
      } else if (['landing_business', 'landing-business', 'business', 'b2b', 'partner', 'owner'].includes(tgStartParam.toLowerCase())) {
        setActiveLanding('BUSINESS');
        setShowBusinessOnboardingModal(true);
      } else if (['demo-box', 'demo_box', 'demo', 'demobox'].includes(tgStartParam.toLowerCase())) {
        setShowDemoBoxModal(true);
      }
    }

    // ЛОГИКА АКТИВАЦИИ ПО ЕДИНОМУ КУАР-КОДУ ЗАВЕДЕНИЯ (VENUE QR)
    if (venueId) {
      setRole('GUEST');
      setVenueModalPartnerId(venueId);
    } else if (claim) {
      setClaimToken(claim);
      setRole('GUEST');
    } else if (roleParam && ['ADMIN', 'MAP', 'WALLET', 'WAITER', 'PROFILE', 'GUEST'].includes(roleParam)) {
      setRole(roleParam as any);
    } else {
      setRole('GUEST');
    }

    // Проверка первого захода
    const onboarded = localStorage.getItem('giftx_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseVenue = () => {
    triggerHaptic('light');

    // 1. В Telegram WebApp закрываем сам Mini App
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.close) {
      try {
        tgWebApp.close();
      } catch (e) {}
    }

    // 2. В веб-версии (браузере) возвращаемся назад по истории браузера
    if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
      window.history.back();
    }

    // 3. Пробуем закрыть вкладку браузера
    if (typeof window !== 'undefined') {
      try {
        window.close();
      } catch (e) {}
    }

    // 4. Запасной вариант: если браузер заблокировал закрытие (например, прямая ссылка в новой пустой вкладке)
    setTimeout(() => {
      setVenueModalPartnerId(null);
    }, 300);
  };

  useEffect(() => {
    if (!venueModalPartnerId) return;

    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.BackButton) {
      tgWebApp.BackButton.show();
      const onBackClick = () => {
        handleCloseVenue();
      };
      tgWebApp.BackButton.onClick(onBackClick);
      return () => {
        tgWebApp.BackButton.offClick(onBackClick);
        tgWebApp.BackButton.hide();
      };
    }
  }, [venueModalPartnerId]);

  const isMainScreen = !activeLanding && !claimToken && !venueModalPartnerId && (role === 'GUEST' || !role);

  return (
    <div className="min-h-screen bg-[#0e1621] text-slate-100 relative pb-24 font-sans selection:bg-[#2aabee]/30">
      {/* TELEGRAM HEADER & HIGHLIGHTS / STORIES BAR (Только на Главной странице, скроллится вместе с контентом) */}
      {isMainScreen && (
        <>
          <div 
            className="relative z-20 bg-[#17212b] border-b border-white/5 px-4 pb-2.5 max-w-md mx-auto shadow-md transition-all"
            style={{
              paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 0px) + 68px)'
            }}
          >
            {/* Top title line */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-sm shadow-amber-500/20">
                  GX
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-slate-100 tracking-tight">GiftX</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">@giftx2025_bot • Кросс-маркетинг</div>
                </div>
              </div>

              {isBusinessUser && ['WAITER', 'ADMIN'].includes(role) && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setActiveLanding(null);
                    setRole('GUEST');
                  }}
                  className="py-1 px-2.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold flex items-center space-x-1 shrink-0"
                >
                  <Building2 className="w-3 h-3" />
                  <span>Бизнес ➔ Клиент</span>
                </button>
              )}
            </div>

            {/* Telegram Search Bar */}
            <div className="relative mb-2.5">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Поиск заведений и подарков..."
                className="w-full bg-[#242f3d] text-slate-100 text-xs pl-8 pr-3 py-1.5 rounded-xl border border-transparent focus:border-[#2aabee]/50 outline-none placeholder-slate-400 transition-all"
              />
            </div>

            {/* TELEGRAM HIGHLIGHTS / STORIES STRIP (ЗЕЛЕНАЯ ОБВОДКА СТОРИС) */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {/* Story 1: О сервисе */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveLanding(activeLanding === 'GUEST' ? null : 'GUEST');
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className={`tg-story-ring ${activeLanding === 'GUEST' ? 'ring-2 ring-amber-400 scale-105' : ''}`}>
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-amber-400">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">О сервисе</span>
              </button>

              {/* Story 2: Инструкция Гость */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHelpGuideDefaultRole('GUEST');
                  setShowHelpGuide(true);
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="tg-story-ring">
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-emerald-400">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">Гость</span>
              </button>

              {/* Story 3: Инструкция Официант */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHelpGuideDefaultRole('WAITER');
                  setShowHelpGuide(true);
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="tg-story-ring">
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-cyan-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">Официант</span>
              </button>

              {/* Story 4: Инструкция Бизнес */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveLanding('BUSINESS');
                  setShowBusinessOnboardingModal(true);
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="tg-story-ring">
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-purple-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">Бизнес</span>
              </button>

              {/* Story 5: Инструкция Админ */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setHelpGuideDefaultRole('ADMIN');
                  setShowHelpGuide(true);
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="tg-story-ring">
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">Админ</span>
              </button>

              {/* Story 6: Мой Профиль */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setClaimToken(null);
                  setActiveLanding(null);
                  setRole('PROFILE');
                }}
                className="flex flex-col items-center space-y-1 shrink-0 group cursor-pointer"
              >
                <div className="tg-story-ring">
                  <div className="w-12 h-12 rounded-full bg-[#17212b] p-0.5 border border-[#0e1621] flex items-center justify-center text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-300 group-hover:text-white transition-colors">Профиль</span>
              </button>
            </div>
          </div>

          {/* TELEGRAM CATEGORY PILLS STRIP */}
          <div className="max-w-md mx-auto px-4 pt-3 pb-1 flex space-x-1.5 overflow-x-auto no-scrollbar">
            {['Все', '🔥 HoReCa', '💆‍♀️ Beauty & Spa', '🚗 Auto', '⚡ Спец'].map((cat, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  i === 0 
                    ? 'bg-[#2aabee] text-white shadow-sm shadow-[#2aabee]/30' 
                    : 'bg-[#242f3d] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Главный экран в зависимости от роли или активного лендинга */}
      {activeLanding === 'GUEST' ? (
        <GuestLandingPage
          onOpenWallet={() => {
            setActiveLanding(null);
            setRole('WALLET');
          }}
          onOpenMap={() => {
            setActiveLanding(null);
            setRole('MAP');
          }}
          onSwitchToBusinessLanding={() => setActiveLanding('BUSINESS')}
        />
      ) : activeLanding === 'BUSINESS' ? (
        <BusinessLandingPage
          onRegisterPartner={() => setShowBusinessOnboardingModal(true)}
          onSwitchToGuestLanding={() => setActiveLanding('GUEST')}
          onOpenAdminDemo={() => {
            setActiveLanding(null);
            setRole('ADMIN');
          }}
        />
      ) : claimToken ? (
        <GuestUnpackScreen
          claimToken={claimToken}
          onFinished={() => {
            setClaimToken(null);
            setRole('WALLET');
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      ) : role === 'WAITER' ? (
        <WaiterScreen />
      ) : role === 'MAP' ? (
        <PartnerMapScreen />
      ) : role === 'ADMIN' ? (
        <AdminDashboardScreen />
      ) : role === 'PROFILE' ? (
        <ProfileScreen onSwitchToClientMode={() => setRole('GUEST')} />
      ) : role === 'WALLET' ? (
        <WalletScreen />
      ) : (
        <GuestHomeScreen
          onOpenScanner={() => setShowScannerModal(true)}
          onOpenWallet={() => setRole('WALLET')}
          onOpenMap={() => setRole('MAP')}
          onScanTokenSuccess={(token) => {
            setClaimToken(token);
          }}
          hasVenueRole={isBusinessUser || (staffInfo && staffInfo.role !== 'GUEST')}
          onOpenWaiterQr={() => setRole('WAITER')}
        />
      )}

      {/* Модалка Сканера QR */}
      {showScannerModal && (
        <QrScannerModal
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={(token) => {
            setShowScannerModal(false);
            setClaimToken(token);
          }}
        />
      )}

      {/* Обучающий слайдер на первом входе */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Обучалка для сценария создания заведения */}
      {showBusinessOnboardingModal && (
        <BusinessOnboardingModal
          onClose={() => setShowBusinessOnboardingModal(false)}
          onProceedToRegistration={() => {
            setShowBusinessOnboardingModal(false);
            setShowPartnerRegisterModal(true);
          }}
        />
      )}

      {/* Справочник и Инструкции по ролям */}
      {showHelpGuide && (
        <HelpGuideModal
          defaultRole={helpGuideDefaultRole}
          onClose={() => setShowHelpGuide(false)}
        />
      )}

      {/* Демо-открытие бокса */}
      {showDemoBoxModal && (
        <DemoBoxOpeningModal onClose={() => setShowDemoBoxModal(false)} />
      )}

      {/* Модалка регистрации заведения */}
      {showPartnerRegisterModal && (
        <PartnerRegistrationModal
          onClose={() => setShowPartnerRegisterModal(false)}
          onSuccess={(partner) => {
            setShowPartnerRegisterModal(false);
            if (partner) {
              setStaffInvitePartner(partner);
            }
          }}
        />
      )}

      {/* Модалка сгенерированных QR-кодов и ссылок для сотрудников */}
      {staffInvitePartner && (
        <StaffInviteModal
          partnerId={staffInvitePartner.id}
          partnerName={staffInvitePartner.name}
          onClose={() => setStaffInvitePartner(null)}
        />
      )}

      {/* Модалка экрана заведения для гостя (Боксы, пороги чеков и инструкция) */}
      {venueModalPartnerId && (
        <VenueGuestModal
          partnerId={venueModalPartnerId}
          onClose={handleCloseVenue}
          onOpenScanner={() => {
            setVenueModalPartnerId(null);
            setShowScannerModal(true);
          }}
        />
      )}

      {/* TELEGRAM FLOATING GLASSMORPHIC NAVIGATION BAR (Скрыто на экране заведения) */}
      {!venueModalPartnerId && (
        <div 
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md telegram-nav-glass rounded-full px-2 py-1.5 flex items-center justify-around"
        >
          <button
            onClick={() => {
              triggerHaptic('light');
              setClaimToken(null);
              setActiveLanding(null);
              setRole('GUEST');
            }}
            className={`flex-1 py-1.5 px-2 rounded-full flex flex-col items-center justify-center space-y-0.5 text-[10px] font-bold transition-all relative cursor-pointer ${
              (role === 'GUEST' || !role) && !claimToken && !activeLanding
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Главная</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setClaimToken(null);
              setActiveLanding(null);
              setRole('WALLET');
            }}
            className={`flex-1 py-1.5 px-2 rounded-full flex flex-col items-center justify-center space-y-0.5 text-[10px] font-bold transition-all relative cursor-pointer ${
              role === 'WALLET' && !claimToken && !activeLanding
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Gift className="w-4 h-4" />
              {activeVouchersCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white font-black text-[9px] px-1 min-w-[15px] h-3.5 flex items-center justify-center rounded-full border border-[#17212b] shadow-sm animate-pulse">
                  {activeVouchersCount}
                </span>
              )}
            </div>
            <span>Подарки</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setClaimToken(null);
              setActiveLanding(null);
              setRole('MAP');
            }}
            className={`flex-1 py-1.5 px-2 rounded-full flex flex-col items-center justify-center space-y-0.5 text-[10px] font-bold transition-all relative cursor-pointer ${
              role === 'MAP' && !claimToken && !activeLanding
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Карта</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setClaimToken(null);
              setActiveLanding(null);
              setRole('PROFILE');
            }}
            className={`flex-1 py-1.5 px-2 rounded-full flex flex-col items-center justify-center space-y-0.5 text-[10px] font-bold transition-all relative cursor-pointer ${
              role === 'PROFILE' && !claimToken && !activeLanding
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Профиль</span>
          </button>
        </div>
      )}
    </div>
  );
};

