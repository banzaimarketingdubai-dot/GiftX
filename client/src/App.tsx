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
import { Home, Wallet, MapPin, User, HelpCircle, Building2, Sparkles, Gift } from 'lucide-react';

export const App: React.FC = () => {
  const { role, setRole, setPartners } = useAppStore();
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [venueModalPartnerId, setVenueModalPartnerId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBusinessOnboardingModal, setShowBusinessOnboardingModal] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showDemoBoxModal, setShowDemoBoxModal] = useState(false);
  const [showPartnerRegisterModal, setShowPartnerRegisterModal] = useState(false);
  const [staffInvitePartner, setStaffInvitePartner] = useState<any | null>(null);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any | null>(null);
  const [activeLanding, setActiveLanding] = useState<'GUEST' | 'BUSINESS' | null>(null);

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
            if (data.staff.role === 'WAITER') {
              setRole('WAITER');
            } else if (['OWNER', 'MANAGER'].includes(data.staff.role)) {
              setRole('ADMIN');
            }
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
      const demoStaffStr = localStorage.getItem('giftx_demo_staff');
      const savedStaff = demoStaffStr ? JSON.parse(demoStaffStr) : null;

      if (savedStaff && (savedStaff.partnerId === venueId || venueId.includes('demo'))) {
        if (savedStaff.role === 'WAITER') {
          // 2. У официанта открывается меню выбора боксов заведения
          setRole('WAITER');
        } else {
          // 3. У администратора / суперадмина открывается статистика по заведению
          setRole('ADMIN');
        }
      } else if (tgUser?.id) {
        fetch(`/api/staff/check-member/${tgUser.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.isStaff) {
              setRole(data.staff.role === 'WAITER' ? 'WAITER' : 'ADMIN');
            } else {
              // 1. У гостя открывается экран заведения с боксами и инструкцией
              setRole('GUEST');
              setVenueModalPartnerId(venueId);
            }
          })
          .catch(() => {
            setRole('GUEST');
            setVenueModalPartnerId(venueId);
          });
      } else {
        // 1. У гостя открывается экран заведения с боксами и инструкцией
        setRole('GUEST');
        setVenueModalPartnerId(venueId);
      }
    } else if (claim) {
      setClaimToken(claim);
      setRole('GUEST');
    } else if (roleParam && ['ADMIN', 'MAP', 'WALLET', 'WAITER', 'PROFILE', 'GUEST'].includes(roleParam)) {
      setRole(roleParam as any);
    } else if (!role) {
      setRole('GUEST');
    }

    // Проверка первого захода
    const onboarded = localStorage.getItem('giftx_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-16">
      {/* Верхний брендовый хэдер */}
      <div 
        className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-4 pb-2.5 flex items-center justify-between max-w-md mx-auto transition-all"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 52px)'
        }}
      >
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveLanding(activeLanding ? null : 'GUEST');
            }}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xs">
              X
            </div>
            <span className="font-extrabold text-sm text-gradient-gold tracking-tight">GiftX</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {/* Кнопка переключения Лендинг / Приложение */}
          <button
            onClick={() => {
              triggerHaptic('light');
              if (activeLanding) {
                setActiveLanding(null);
              } else {
                setActiveLanding('GUEST');
              }
            }}
            className={`py-1 px-2 rounded-xl border text-xs font-black flex items-center space-x-1 transition-all shrink-0 ${
              activeLanding
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeLanding ? 'Приложение' : 'О сервисе'}</span>
          </button>

          {/* Индикатор бизнес-аккаунта */}
          {isBusinessUser && ['WAITER', 'ADMIN'].includes(role) && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                setActiveLanding(null);
                setRole('GUEST');
              }}
              className="py-1 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold flex items-center space-x-1 animate-pulse shrink-0"
            >
              <Building2 className="w-3 h-3" />
              <span>Бизнес ➔ Клиент</span>
            </button>
          )}

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowHelpGuide(true);
            }}
            className="py-1 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center space-x-1 transition-all shadow-sm shadow-amber-500/10 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Инструкция</span>
          </button>

          {/* Пиктограмма профиля справа */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setClaimToken(null);
              setActiveLanding(null);
              setRole('PROFILE');
            }}
            title="Профиль"
            className={`p-1.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
              role === 'PROFILE' && !claimToken && !activeLanding
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10'
            }`}
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>

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
          defaultRole={role === 'WAITER' ? 'WAITER' : role === 'ADMIN' ? 'ADMIN' : 'GUEST'}
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
          onClose={() => setVenueModalPartnerId(null)}
          onOpenScanner={() => {
            setVenueModalPartnerId(null);
            setShowScannerModal(true);
          }}
        />
      )}

      {/* Нижняя навигация */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex justify-center space-x-2 max-w-md mx-auto"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px), 10px)'
        }}
      >
        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setActiveLanding(null);
            setRole('GUEST');
          }}
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1.5 text-xs font-extrabold transition-all ${
            (role === 'GUEST' || !role) && !claimToken && !activeLanding
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
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
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1.5 text-xs font-extrabold transition-all ${
            role === 'WALLET' && !claimToken && !activeLanding
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Подарки</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setActiveLanding(null);
            setRole('MAP');
          }}
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1.5 text-xs font-extrabold transition-all ${
            role === 'MAP' && !claimToken && !activeLanding
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Карта</span>
        </button>
      </div>
    </div>
  );
};
