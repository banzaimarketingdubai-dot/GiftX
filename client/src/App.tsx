import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { initTelegramApp, triggerHaptic } from './telegram';
import { WaiterScreen } from './components/WaiterScreen';
import { GuestUnpackScreen } from './components/GuestUnpackScreen';
import { WalletScreen } from './components/WalletScreen';
import { PartnerMapScreen } from './components/PartnerMapScreen';
import { QrCode, Wallet, MapPin, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { role, setRole, setPartners } = useAppStore();
  const [claimToken, setClaimToken] = useState<string | null>(null);

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

    // Если приложение открыто напрямую через Telegram t.me/bot/app?startapp=TOKEN
    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (!claim && tgStartParam) {
      claim = tgStartParam.replace(/^claim_/, '');
    }

    if (claim) {
      setClaimToken(claim);
      setRole('GUEST');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
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
      ) : role === 'WALLET' ? (
        <WalletScreen />
      ) : (
        <GuestUnpackScreen
          claimToken="demo-token"
          onFinished={() => setRole('WALLET')}
        />
      )}

      {/* Нижняя навигация */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2.5 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex justify-center space-x-1.5 max-w-md mx-auto">
        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('WAITER');
          }}
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1 text-[11px] font-bold transition-all ${
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
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1 text-[11px] font-bold transition-all ${
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
          className={`flex-1 py-2 px-2 rounded-2xl flex items-center justify-center space-x-1 text-[11px] font-bold transition-all ${
            role === 'WALLET' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Подарки</span>
        </button>
      </div>
    </div>
  );
};
