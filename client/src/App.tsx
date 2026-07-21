import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { initTelegramApp, triggerHaptic } from './telegram';
import { WaiterScreen } from './components/WaiterScreen';
import { GuestUnpackScreen } from './components/GuestUnpackScreen';
import { WalletScreen } from './components/WalletScreen';
import { QrCode, Wallet, Sparkles, UserCheck } from 'lucide-react';

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

    // Проверка URL на наличие ?claim=TOKEN (сканирование QR-кода)
    const urlParams = new URLSearchParams(window.location.search);
    const claim = urlParams.get('claim');
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
      ) : role === 'WALLET' ? (
        <WalletScreen />
      ) : (
        <GuestUnpackScreen
          claimToken="demo-token"
          onFinished={() => setRole('WALLET')}
        />
      )}

      {/* Переключатель режимов / Нижняя навигация для дебага и работы */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex justify-center space-x-2 max-w-md mx-auto">
        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('WAITER');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl flex items-center justify-center space-x-1.5 text-xs font-bold transition-all ${
            role === 'WAITER' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Официант (B2B)</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setClaimToken(null);
            setRole('WALLET');
          }}
          className={`flex-1 py-2.5 px-3 rounded-2xl flex items-center justify-center space-x-1.5 text-xs font-bold transition-all ${
            role === 'WALLET' && !claimToken
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Мои Подарки</span>
        </button>
      </div>
    </div>
  );
};
