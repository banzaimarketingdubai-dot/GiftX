import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, MapPin, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';
import { ClaimedVoucher } from '../types';
import { useAppStore } from '../store/useAppStore';

interface GuestUnpackScreenProps {
  claimToken: string;
  onFinished: () => void;
}

interface PlayingCardsDeckProps {
  vouchers: ClaimedVoucher[];
  onFinished: () => void;
}

const PlayingCardsDeck: React.FC<PlayingCardsDeckProps> = ({ vouchers: initialVouchers, onFinished }) => {
  const [deck, setDeck] = useState<ClaimedVoucher[]>(initialVouchers);
  const [savedCount, setSavedCount] = useState(0);
  const [discardedCount, setDiscardedCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [confirmDiscardVoucher, setConfirmDiscardVoucher] = useState<ClaimedVoucher | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'SAVED' | 'DISCARDED' } | null>(null);

  useEffect(() => {
    setDeck(initialVouchers);
  }, [initialVouchers]);

  const currentVoucher = deck[activeIndex] || null;

  const handleNext = () => {
    if (activeIndex < deck.length - 1) {
      triggerHaptic('light');
      setActiveIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      triggerHaptic('light');
      setActiveIndex((prev) => prev - 1);
    }
  };

  const toggleFlip = (id: string) => {
    triggerHaptic('medium');
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveToWallet = (voucher: ClaimedVoucher) => {
    triggerNotificationHaptic('success');
    setActionFeedback({ id: voucher.id, type: 'SAVED' });
    setSavedCount((prev) => prev + 1);

    setTimeout(() => {
      setDeck((prev) => prev.filter((item) => item.id !== voucher.id));
      setActionFeedback(null);
      if (activeIndex >= deck.length - 1 && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    }, 280);
  };

  const handleConfirmDiscard = (voucher: ClaimedVoucher) => {
    triggerNotificationHaptic('warning');
    setActionFeedback({ id: voucher.id, type: 'DISCARDED' });
    setDiscardedCount((prev) => prev + 1);

    setTimeout(() => {
      setDeck((prev) => prev.filter((item) => item.id !== voucher.id));
      setActionFeedback(null);
      if (activeIndex >= deck.length - 1 && activeIndex > 0) {
        setActiveIndex((prev) => prev - 1);
      }
    }, 280);
  };

  const handleDragEnd = (_: any, info: any) => {
    if (!currentVoucher) return;

    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absY > absX && absY > 45) {
      // Свайп по вертикали
      if (info.offset.y > 45) {
        // Свайп ВНИЗ ⬇️ -> Добавить в кошелек
        handleSaveToWallet(currentVoucher);
      } else if (info.offset.y < -45) {
        // Свайп ВВЕРХ ⬆️ -> Запрос подтверждения удаления
        setConfirmDiscardVoucher(currentVoucher);
      }
    } else if (absX > 40) {
      // Свайп по горизонтали
      if (info.offset.x < -40 && activeIndex < deck.length - 1) {
        handleNext();
      } else if (info.offset.x > 40 && activeIndex > 0) {
        handlePrev();
      }
    }
  };

  if (deck.length === 0) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 text-center space-y-4 shadow-2xl my-4 animate-scaleUp">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 text-2xl">
          🎉
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-100">Все карточки разложены!</h3>
          <p className="text-xs text-slate-300 mt-1">
            Сохранено в кошелек: <span className="text-emerald-400 font-bold">{savedCount}</span> | Скинуто: <span className="text-red-400 font-bold">{discardedCount}</span>
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic('medium');
            onFinished();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-sm"
        >
          <span>Перейти в Кошелек «Мои Подарки»</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-3 my-2 relative">
      {/* Панель информации о всех выпавших карточках и их номиналах */}
      <div className="w-full space-y-2 text-center z-20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>🎉 Из бокса выпало карточек: {deck.length} шт.</span>
        </div>

        {/* Интерактивные мини-бейджи с номиналами каждой выпавшей карточки */}
        <div className="flex items-center justify-center space-x-1.5 overflow-x-auto py-1 px-2">
          {deck.map((v, i) => {
            const offer = v.voucherOffer;
            const isSelected = i === activeIndex;
            const categoryLabel = offer?.discountValue || (offer?.category === 'TRAFFIC_MAGNET' ? 'FREE' : 'GIFT');
            
            return (
              <button
                key={v.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveIndex(i);
                }}
                className={`py-1 px-2.5 rounded-xl text-[10px] font-extrabold flex items-center space-x-1 transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="opacity-80">Карточка #{i + 1}:</span>
                <span className={isSelected ? 'text-slate-950 font-black' : 'text-emerald-400 font-black'}>
                  {categoryLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Подсказка свайпа */}
        <div className="flex items-center justify-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/60 px-3 py-0.5 rounded-full border border-slate-800 max-w-xs mx-auto">
          <span className="text-red-400">⬆️ Вверх = Скинуть</span>
          <span>•</span>
          <span className="text-emerald-400">⬇️ Вниз = В кошелек</span>
        </div>
      </div>

      {/* 3D Контейнер стопки игральных карт */}
      <div className="relative w-full h-[250px] flex items-center justify-center perspective-[1200px]">
        {deck.map((v, index) => {
          const offer = v.voucherOffer;
          const partner = offer?.partner;
          const offset = index - activeIndex;
          const isSelected = index === activeIndex;
          const isFlipped = !!flippedCards[v.id];
          const isAnimatingFeedback = actionFeedback?.id === v.id;

          // Расчет 3D-позиционирования карточек в колоде
          const rotateZ = offset * 6;
          const rotateY = isSelected ? (isFlipped ? 180 : 0) : offset * -16;
          const translateX = offset * 36;
          const translateY = isAnimatingFeedback 
            ? (actionFeedback?.type === 'SAVED' ? 180 : -180) 
            : Math.abs(offset) * 12;
          const scale = isSelected ? 1 : Math.max(0.78, 1 - Math.abs(offset) * 0.1);
          const zIndex = 50 - Math.abs(offset) * 10;
          const opacity = isAnimatingFeedback ? 0 : Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.2;

          return (
            <motion.div
              key={v.id}
              drag={isSelected ? true : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.3}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (!isSelected) {
                  triggerHaptic('light');
                  setActiveIndex(index);
                } else {
                  toggleFlip(v.id);
                }
              }}
              initial={{ scale: 0, y: 120, opacity: 0 }}
              animate={{
                x: translateX,
                y: translateY,
                scale: scale,
                rotateZ: rotateZ,
                rotateY: rotateY,
                zIndex: zIndex,
                opacity: opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 24,
                delay: isSelected ? 0 : index * 0.04,
              }}
              style={{
                perspective: 1200,
                transformStyle: 'preserve-3d',
              }}
              className="absolute w-80 h-48 rounded-3xl cursor-pointer select-none shadow-2xl"
            >
              {/* ЛИЦЕВАЯ СТОРОНА КАРТОЧКИ */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
                className={`absolute inset-0 w-full h-full rounded-3xl p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 ${
                  isSelected ? 'border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]' : 'border-amber-500/30'
                } flex flex-col justify-between overflow-hidden`}
              >
                {/* Золотой неоновый акцент */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />

                {/* Шапка карточки */}
                <div className="flex justify-between items-center z-10">
                  <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>GiftX Pass #{index + 1}</span>
                  </div>

                  <span className="text-base font-black text-emerald-400 drop-shadow-md">
                    {offer?.discountValue}
                  </span>
                </div>

                {/* Основной контент */}
                <div className="flex items-center space-x-3.5 my-auto z-10">
                  <img
                    src={offer?.imageUrl}
                    alt={offer?.title}
                    className="w-14 h-14 rounded-2xl object-cover border border-amber-500/30 shadow-lg shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-extrabold text-amber-400 block truncate">
                      {partner?.name}
                    </span>
                    <h4 className="text-xs font-black text-slate-100 leading-tight truncate mt-0.5">
                      {offer?.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {offer?.description}
                    </p>
                  </div>
                </div>

                {/* Нижняя панель карточки */}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] z-10">
                  <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[170px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{partner?.address}</span>
                  </span>

                  <span className="text-amber-400 font-mono font-bold flex items-center space-x-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    <RotateCw className="w-3 h-3" />
                    <span>Тап = Рубашка 🔄</span>
                  </span>
                </div>
              </div>

              {/* РУБАШКА КАРТОЧКИ (Back) */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl p-4 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex flex-col justify-between items-center text-center overflow-hidden"
              >
                {/* Геометрический паттерн рубашки игральной карты */}
                <div className="absolute inset-2 border border-amber-500/30 rounded-2xl pointer-events-none flex items-center justify-center bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />

                <div className="z-10 space-y-1 pt-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-lg mx-auto shadow-lg">
                    X
                  </div>
                  <h5 className="text-xs font-black text-amber-300 uppercase tracking-widest">
                    Условия активации
                  </h5>
                </div>

                <div className="z-10 bg-slate-900/90 p-3 rounded-2xl border border-amber-500/30 text-[11px] text-slate-200 leading-relaxed font-medium">
                  Предъявите этот бокс в заведении <span className="text-amber-400 font-bold">{partner?.name}</span> при оплате счета.
                </div>

                <div className="z-10 text-[10px] font-bold text-amber-400/90 flex items-center space-x-1">
                  <span>🔄 Нажмите, чтобы вернуть лицевую сторону</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Быстрые кнопки действия для активной карты */}
      {currentVoucher && (
        <div className="flex space-x-2 w-full max-w-xs mx-auto pt-1 z-30">
          <button
            onClick={() => setConfirmDiscardVoucher(currentVoucher)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-extrabold flex items-center justify-center space-x-1 transition-all active:scale-95"
          >
            <span>⬆️ Скинуть</span>
          </button>

          <button
            onClick={() => handleSaveToWallet(currentVoucher)}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center space-x-1 shadow-md shadow-emerald-500/10 transition-all active:scale-95"
          >
            <span>⬇️ В кошелек</span>
          </button>
        </div>
      )}

      {/* Панель навигации под картами */}
      <div className="flex items-center justify-between w-full max-w-xs mx-auto pt-1 z-30">
        <button
          disabled={activeIndex === 0}
          onClick={handlePrev}
          className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
            activeIndex === 0
              ? 'bg-slate-900/40 text-slate-600 border-slate-800/40'
              : 'bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-slate-800 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-xs font-black text-slate-200">
            Карточка <span className="text-amber-400">{activeIndex + 1}</span> из <span className="text-amber-400">{deck.length}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
            Свайп ↔️ / ↕️ или кнопки
          </div>
        </div>

        <button
          disabled={activeIndex === deck.length - 1}
          onClick={handleNext}
          className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center ${
            activeIndex === deck.length - 1
              ? 'bg-slate-900/40 text-slate-600 border-slate-800/40'
              : 'bg-slate-900 text-amber-400 border-amber-500/30 hover:bg-slate-800 active:scale-95'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Модальное окно подтверждения удаления карточки (Свайп ВВЕРХ) */}
      {confirmDiscardVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto text-xl">
              🗑️
            </div>
            <div>
              <h4 className="font-extrabold text-slate-100 text-sm">Скинуть этот подарок?</h4>
              <p className="text-xs text-slate-400 mt-1">
                «{confirmDiscardVoucher.voucherOffer?.title}» будет удален из колоды.
              </p>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={() => setConfirmDiscardVoucher(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  handleConfirmDiscard(confirmDiscardVoucher);
                  setConfirmDiscardVoucher(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 text-xs font-black shadow-lg shadow-red-500/20"
              >
                Скинуть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
          {unpacked ? 'Свайпайте карточки ↔️ и тапайте для 3D поворота 🔄' : `Тапните по коробке 3 раза (${tapCount}/3)`}
        </p>
      </div>

      {/* Анимационный контур распаковки */}
      <div className="my-auto flex flex-col items-center justify-center relative min-h-[340px] z-10">
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
          /* Интерактивная 3D колода игральных карт GiftX Pass */
          <PlayingCardsDeck vouchers={vouchers} onFinished={onFinished} />
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
