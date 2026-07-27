import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { initTelegramApp, triggerHaptic } from './telegram';
import { WaiterScreen } from './components/WaiterScreen';
import { GuestUnpackScreen } from './components/GuestUnpackScreen';
import { WalletScreen } from './components/WalletScreen';
import { PartnerMapScreen } from './components/PartnerMapScreen';
import { AdminDashboardScreen } from './components/AdminDashboardScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { QrCode, Wallet, MapPin, Sliders, HelpCircle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { role, setRole, setPartners } = useAppStore();
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

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

    // Проверка наличия токена из Telegram WebApp start_param или URL (?claim=TOKEN)
    const urlParams = new URLSearchParams(window.location.search);
    let claim = urlParams.get('claim') || urlParams.get('tgWebAppStartParam');
    const roleParam = urlParams.get('role');

    // Если приложение открыто напрямую через Telegram t.me/bot/app?startapp=TOKEN
    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (!claim && tgStartParam) {
      if (tgStartParam.startsWith('claim_')) {
        claim = tgStartParam.replace(/^claim_/, '');
      } else if (['ADMIN', 'MAP', 'WALLET', 'WAITER'].includes(tgStartParam)) {
        setRole(tgStartParam as any);
      }
    }

    if (claim) {
      setClaimToken(claim);
      setRole('GUEST');
    } else if (roleParam && ['ADMIN', 'MAP', 'WALLET', 'WAITER'].includes(roleParam)) {
      setRole(roleParam as any);
    } else {
      setRole('WALLET');
    }

    // Проверка первого захода для вызова интерактивной обучалки
    const onboarded = localStorage.getItem('giftx_onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-16">
      {/* Верхний брендовый хэдер с кнопкой Инструкции */}
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xs">
            X
          </div>
          <span className="font-extrabold text-sm text-gradient-gold tracking-tight">GiftX Pass</span>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowHelpGuide(true);
          }}
          className="py-1 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shadow-amber-500/10"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Инструкция</span>
        </button>
      </div>

      {/* Главный экран в зависимости от роли или токена */}
      {claimToken ? (
        <GuestUnpackScreen
          claimToken={claimToken}
          onFinished={() => {
            setClaimToken(null);
            setRole('WALLET');
            // Очищаем URL параметр без перезагрузки
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      ) : role === 'WAITER' ? (
        <WaiterScreen />
      ) : role === 'MAP' ? (
        <PartnerMapScreen />
      ) : role === 'ADMIN' ? (
        <AdminDashboardScreen />
      ) : (
        <WalletScreen />
      )}

      {/* Обучающий слайдер на первом входе */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Справочник и Инструкции по ролям */}
      {showHelpGuide && (
        <HelpGuideModal
          defaultRole={role === 'WAITER' ? 'WAITER' : role === 'ADMIN' ? 'ADMIN' : 'GUEST'}
          onClose={() => setShowHelpGuide(false)}
        />
      )}

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex justify-center space-x-1 max-w-md mx-auto">
        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('WAITER');
          }}
          className={`flex-1 py-1.5 px-1.5 rounded-xl flex items-center justify-center space-x-1 text-[10px] font-bold transition-all ${
            role === 'WAITER' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Официант</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('MAP');
          }}
          className={`flex-1 py-1.5 px-1.5 rounded-xl flex items-center justify-center space-x-1 text-[10px] font-bold transition-all ${
            role === 'MAP' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Карта</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('WALLET');
          }}
          className={`flex-1 py-1.5 px-1.5 rounded-xl flex items-center justify-center space-x-1 text-[10px] font-bold transition-all ${
            role === 'WALLET' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Подарки</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('ADMIN');
          }}
          className={`flex-1 py-1.5 px-1.5 rounded-xl flex items-center justify-center space-x-1 text-[10px] font-bold transition-all ${
            role === 'ADMIN' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Админ</span>
        </button>
      </div>
    </div>
  );
};

