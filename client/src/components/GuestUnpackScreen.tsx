import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';
import { ClaimedVoucher } from '../types';
import { useAppStore } from '../store/useAppStore';

interface GuestUnpackScreenProps {
  claimToken: string;
  onFinished: () => void;
}

export const GuestUnpackScreen: React.FC<GuestUnpackScreenProps> = ({ claimToken, onFinished }) => {
  const { setRole } = useAppStore();
  const [tapCount, setTapCount] = useState(0);
  const [unpacked, setUnpacked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [boxLevel, setBoxLevel] = useState<string>('GOLD');
  const [donorName, setDonorName] = useState<string>('Заведение');
  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>([]);

  // 1. Валидация токена из URL
  useEffect(() => {
    async function validateToken() {
      try {
        setLoading(true);
        const res = await fetch(`/api/guest/validate-token/${claimToken}`);
        const data = await res.json();

        if (data.success) {
          setBoxLevel(data.boxLevel);
          setDonorName(data.donorPartnerName);
        } else {
          setErrorMsg(data.error || 'QR-код недействителен');
          triggerNotificationHaptic('error');
        }
      } catch (err: any) {
        setErrorMsg('Ошибка подключения к серверу');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [claimToken]);

  // 2. Обработка тапа по коробке
  const handleBoxTap = async () => {
    if (unpacked || loading || errorMsg) return;

    const newTap = tapCount + 1;
    setTapCount(newTap);

    if (newTap < 3) {
      triggerHaptic('light');
    } else {
      // 3-й тап — ВЗРЫВ и получение ваучеров
      triggerHaptic('heavy');
      await claimVouchers();
    }
  };

  const claimVouchers = async () => {
    try {
      setLoading(true);
      const tgUser = getTelegramUserData();

      const res = await fetch('/api/guest/claim-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: claimToken,
          telegramId: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          username: tgUser.username
        })
      });

      const data = await res.json();

      if (data.success) {
        setVouchers(data.vouchers);
        setUnpacked(true);
        triggerNotificationHaptic('success');

        // Салют конфетти
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        setErrorMsg(data.error || 'Не удалось забрать подарок');
        triggerNotificationHaptic('error');
      }
    } catch (e: any) {
      setErrorMsg('Ошибка получения подарка: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !unpacked && tapCount < 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Загружаем Ваш GiftX Box...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-950/20 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-red-300">QR-код недействителен</h2>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">{errorMsg}</p>
          <button
            onClick={() => {
              window.location.href = window.location.pathname;
            }}
            className="mt-6 w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
          >
            Понятно
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-5 max-w-md mx-auto relative overflow-hidden">
      {/* Шапка источника */}
      <div className="text-center pt-4 z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-amber-400 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Подарок от {donorName}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gradient-gold tracking-tight">
          {unpacked ? 'Ваши GiftX Pass разблокированы!' : 'Вам вручили GiftX Box!'}
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          {unpacked ? 'Выберите карточку для просмотра условий' : `Тапните по коробке 3 раза (${tapCount}/3)`}
        </p>
      </div>

      {/* Анимационный контур распаковки */}
      <div className="my-auto flex flex-col items-center justify-center relative min-h-[360px] z-10">
        {!unpacked ? (
          <motion.div
            onClick={handleBoxTap}
            animate={
              tapCount === 1 
                ? { scale: [1, 0.92, 1.05], rotate: [-2, 2, 0] } 
                : tapCount === 2 
                ? { scale: [1, 0.88, 1.1], rotate: [-4, 4, 0] } 
                : { y: [0, -8, 0] }
            }
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            whileTap={{ scale: 0.92, rotate: [-2, 2, 0] }}
            className="cursor-pointer relative group flex items-center justify-center"
          >
            {/* Неоновое свечение GiftX */}
            <div className={`absolute inset-0 blur-3xl rounded-full animate-pulse-slow ${
              boxLevel === 'PLATINUM' ? 'bg-purple-500/30' :
              boxLevel === 'GOLD' ? 'bg-amber-500/30' :
              boxLevel === 'SILVER' ? 'bg-cyan-500/30' : 'bg-purple-500/20'
            }`}></div>

            {/* 3D Коробка GiftX UI Asset */}
            <div className={`w-56 h-56 rounded-3xl flex flex-col items-center justify-center border-2 shadow-2xl relative z-10 overflow-hidden transform group-active:scale-95 transition-transform ${
              boxLevel === 'PLATINUM' ? 'glass-card border-purple-500/60 bg-gradient-to-br from-purple-950/80 to-slate-950' :
              boxLevel === 'GOLD' ? 'glass-gold border-amber-400/60' :
              boxLevel === 'SILVER' ? 'glass-silver border-cyan-400/50' : 'glass-basic border-purple-400/40'
            }`}>
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-400/20 blur-2xl rounded-full"></div>
              
              <div className="relative">
                <Gift className={`w-28 h-28 drop-shadow-[0_10px_15px_rgba(245,158,11,0.5)] animate-float ${
                  boxLevel === 'PLATINUM' ? 'text-purple-400' :
                  boxLevel === 'GOLD' ? 'text-amber-400' :
                  boxLevel === 'SILVER' ? 'text-cyan-400' : 'text-purple-400'
                }`} />
                {/* Фирменный логотип 'X' */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black tracking-tighter text-white opacity-80 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">X</span>
                </div>
              </div>

              <div className="mt-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/20 text-white text-[11px] font-extrabold uppercase tracking-widest flex items-center space-x-1.5 shadow-lg">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>GiftX {boxLevel}</span>
              </div>
            </div>

            {/* Индикатор 3 тапов */}
            <div className="absolute -bottom-10 flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-all ${
                    tapCount >= step 
                      ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50' 
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          /* Точный веерный разлет GiftX Pass (Раздел 3.2 Spec) */
          <div className="relative w-full h-[360px] flex items-center justify-center my-4">
            {vouchers.map((v, index) => {
              const offer = v.voucherOffer;
              const totalCards = vouchers.length;
              const middleIndex = (totalCards - 1) / 2;
              const rotationAngle = (index - middleIndex) * 10; // 10 градусов веера
              const xOffset = (index - middleIndex) * 26;      // Смещение по оси X

              return (
                <motion.div
                  key={v.id}
                  initial={{ scale: 0, y: 100, opacity: 0, rotate: 0 }}
                  animate={{
                    scale: 1,
                    y: (index % 2 === 0 ? 0 : 12),
                    x: xOffset,
                    rotate: rotationAngle,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 120,
                    damping: 12,
                    delay: index * 0.08, // Поочередный веерный вылет
                  }}
                  whileHover={{ scale: 1.1, y: -24, zIndex: 50, rotate: 0 }}
                  className="absolute w-72 h-44 rounded-2xl p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-amber-500/40 shadow-2xl backdrop-blur-xl cursor-pointer select-none overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>GiftX Pass</span>
                    </span>
                    <span className="text-base font-black text-emerald-400">{offer?.discountValue}</span>
                  </div>

                  <div className="mt-3 flex items-center space-x-3">
                    <img 
                      src={offer?.imageUrl} 
                      alt={offer?.title} 
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/20 shadow-md shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold text-amber-300 block truncate">
                        {offer?.partner?.name}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-100 leading-tight truncate mt-0.5">{offer?.title}</h4>
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{offer?.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-neutral-400">
                    <span>⏳ Срок: {offer?.validityHours}ч</span>
                    <span className="text-amber-400 font-semibold underline">Подробнее &rarr;</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Кнопка перехода в Кошелек */}
      {unpacked && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            triggerHaptic('medium');
            onFinished();
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-base z-20"
        >
          <span>Забрать в кошелек "Мои Подарки"</span>
          <ArrowRight className="w-5 h-5 text-slate-950" />
        </motion.button>
      )}
    </div>
  );
};
