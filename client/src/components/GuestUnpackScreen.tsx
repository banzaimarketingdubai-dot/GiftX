import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, AlertTriangle, ShieldCheck, ArrowRight, MapPin, ChevronLeft, ChevronRight, RotateCw, Navigation } from 'lucide-react';
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
  const { setRole, setSelectedMapPartner } = useAppStore();
  const [deck, setDeck] = useState<ClaimedVoucher[]>(initialVouchers);
  const [savedCount, setSavedCount] = useState(0);
  const [discardedCount, setDiscardedCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [confirmDiscardVoucher, setConfirmDiscardVoucher] = useState<ClaimedVoucher | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'SAVED' | 'DISCARDED' } | null>(null);
  const [savedToast, setSavedToast] = useState<{ title: string; partnerName: string; discount?: string } | null>(null);

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

    // Подтверждающее всплывающее уведомление на экран
    setSavedToast({
      title: voucher.voucherOffer?.title || 'Подарочный ваучер',
      partnerName: voucher.voucherOffer?.partner?.name || 'Заведение сети',
      discount: voucher.voucherOffer?.discountValue || '100% FREE',
    });

    setTimeout(() => {
      setSavedToast(null);
    }, 3200);

    // Уведомление на сервер и заведению о добавлении в кошелек
    const tgUser = getTelegramUserData();
    fetch('/api/guest/claim-voucher-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voucherId: voucher.id,
        action: 'SAVED',
        telegramId: tgUser?.id
      })
    }).catch(e => console.warn('Notify save error:', e));

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

    // Уведомление на сервер и заведению об отказе от подарка
    const tgUser = getTelegramUserData();
    fetch('/api/guest/claim-voucher-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voucherId: voucher.id,
        action: 'DISCARDED',
        telegramId: tgUser?.id
      })
    }).catch(e => console.warn('Notify discard error:', e));

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
    <div className="w-full flex flex-col items-center justify-center space-y-2 my-1 relative">
      {/* Панель информации о всех выпавших карточках и их номиналах */}
      <div className="w-full space-y-1.5 text-center z-20">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>🎉 Из бокса выпало карточек: {deck.length} шт.</span>
        </div>

        {/* Интерактивные мини-бейджи с номиналами каждой выпавшей карточки */}
        <div className="flex items-center justify-center space-x-1.5 overflow-x-auto py-0.5 px-2">
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


      </div>

      {/* 3D Контейнер стопки игральных карт */}
      <div className="relative w-full h-[215px] sm:h-[235px] flex items-center justify-center perspective-[1200px] my-1">
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
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
              className="absolute w-80 h-48 rounded-3xl cursor-pointer select-none shadow-2xl touch-none"
            >
              {/* ЛИЦЕВАЯ СТОРОНА КАРТОЧКИ */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  opacity: isFlipped ? 0 : 1,
                  visibility: isFlipped ? 'hidden' : 'visible',
                  pointerEvents: isFlipped ? 'none' : 'auto',
                  transition: 'opacity 0.15s ease-in-out',
                }}
                className={`absolute inset-0 w-full h-full rounded-3xl p-4 bg-slate-950 bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 ${
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
                    <span>GiftX #{index + 1}</span>
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
                  <span className="flex items-center space-x-1 text-slate-400 truncate max-w-[130px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{partner?.address}</span>
                  </span>

                  <div className="flex items-center space-x-1">
                    {partner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('medium');
                          setSelectedMapPartner(partner);
                          setRole('MAP');
                        }}
                        title="Маршрут на карте"
                        className="py-0.5 px-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-extrabold flex items-center space-x-1 text-[9px]"
                      >
                        <Navigation className="w-2.5 h-2.5 text-blue-300" />
                        <span>Маршрут</span>
                      </button>
                    )}

                    <span className="text-amber-400 font-mono font-bold flex items-center space-x-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-500/20 text-[9px]">
                      <RotateCw className="w-2.5 h-2.5" />
                      <span>3D 🔄</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* РУБАШКА КАРТОЧКИ (Back) */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  opacity: isFlipped ? 1 : 0,
                  visibility: isFlipped ? 'visible' : 'hidden',
                  pointerEvents: isFlipped ? 'auto' : 'none',
                  transition: 'opacity 0.15s ease-in-out',
                }}
                className="absolute inset-0 w-full h-full rounded-3xl p-4 bg-slate-950 bg-gradient-to-br from-amber-950 via-slate-950 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex flex-col justify-between items-center text-center overflow-hidden"
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

                <div className="z-10 bg-slate-900 border border-amber-500/40 p-3 rounded-2xl text-[11px] text-slate-100 leading-relaxed font-medium shadow-lg">
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

      {/* Подтверждающее уведомление на экран о добавлении карточки в кошелек */}
      {savedToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          onClick={() => setSavedToast(null)}
          className="fixed top-6 left-4 right-4 z-50 max-w-sm mx-auto p-4 rounded-2xl bg-slate-900/95 border-2 border-emerald-500/80 text-slate-100 shadow-[0_10px_35px_rgba(16,185,129,0.35)] backdrop-blur-xl flex items-center space-x-3.5 cursor-pointer animate-scaleUp"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🎁
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                ✓ Сохранено в Кошелек!
              </span>
              <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {savedToast.discount}
              </span>
            </div>
            <h4 className="text-xs font-black text-slate-100 truncate mt-0.5">
              {savedToast.title}
            </h4>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {savedToast.partnerName} • Доступен в разделе «Мои Подарки»
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export const GuestUnpackScreen: React.FC<GuestUnpackScreenProps> = ({ claimToken, onFinished }) => {
  const { setRole } = useAppStore();
  const [powerLevel, setPowerLevel] = useState<number>(0);
  const [isOpening, setIsOpening] = useState<boolean>(false);
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

  // 2. Механика таймера сгорания энергии (если не тапать быстро — энергия сгорает)
  useEffect(() => {
    if (unpacked || loading || isOpening) return;

    const timer = setInterval(() => {
      setPowerLevel((prev) => {
        if (prev <= 0) return 0;
        // Энергия постепенно падает на 2.5% каждые 100 мс
        return Math.max(0, prev - 2.5);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [unpacked, loading, isOpening]);

  // 3. Быстрый тап по коробке (кликер-механика)
  const handleBoxTap = async () => {
    if (unpacked || loading || errorMsg || isOpening) return;

    triggerHaptic('light');

    setPowerLevel((prev) => {
      const next = Math.min(100, prev + 12); // Каждый тап добавляет +12% энергии
      if (next >= 100 && !isOpening) {
        setIsOpening(true);
        triggerHaptic('heavy');
        claimVouchers();
      }
      return next;
    });
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
      setIsOpening(false);
    }
  };

  if (loading && !unpacked && powerLevel < 100 && !isOpening) {
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
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 max-w-md mx-auto relative overflow-y-auto custom-scrollbar select-none pb-8">
      {/* Шапка источника */}
      <div className="text-center pt-2 sm:pt-4 z-10 shrink-0 space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-amber-400">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Подарок от {donorName}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-gradient-gold tracking-tight">
          {unpacked ? 'Ваши Подарки разблокированы!' : 'Вам вручили GiftX Box!'}
        </h1>
        <p className="text-slate-400 text-[11px] sm:text-xs">
          {unpacked ? 'Свайпайте карточки ↔️ и тапайте для 3D поворота 🔄' : '⚡ Быстро тапайте по коробке, чтобы заполнить шкалу!'}
        </p>
      </div>

      {/* Шкала энергии / Индикатор кликера */}
      {!unpacked && !loading && (
        <div className="w-full max-w-xs mx-auto space-y-1.5 z-20 my-1">
          <div className="flex justify-between items-center text-[11px] font-black tracking-wider px-1">
            <span className="text-amber-400 flex items-center space-x-1">
              <span>⚡ ТАП ЧТОБЫ ОТКРЫТЬ</span>
              {powerLevel >= 80 && <span className="animate-ping text-red-500 text-xs">🔥</span>}
            </span>
            <span className={powerLevel > 70 ? 'text-emerald-400 font-extrabold' : 'text-slate-300'}>
              {Math.round(powerLevel)}%
            </span>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-900 border border-amber-500/40 p-0.5 relative overflow-hidden shadow-xl">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                powerLevel >= 85
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                  : powerLevel >= 40
                  ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-600 to-amber-500'
              }`}
              style={{ width: `${powerLevel}%` }}
            />
          </div>

          <div className="text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {powerLevel === 0 && '👇 Тапайте очень часто для зарядки!'}
              {powerLevel > 0 && powerLevel < 40 && '⚡ БЫСТРЕЕ! Энергия сгорает!'}
              {powerLevel >= 40 && powerLevel < 80 && '🔥 ЖМИТЕ СИЛЬНЕЕ! Бокс нагревается!'}
              {powerLevel >= 80 && '💥 ПОЧТИ ОТКРЫЛСЯ! НЕ ОСТАНАВЛИВАЙТЕСЬ!'}
            </span>
          </div>
        </div>
      )}

      {/* Анимационный контур распаковки */}
      <div className="py-2 my-auto flex flex-col items-center justify-center relative w-full z-10">
        {!unpacked ? (
          <motion.div
            onClick={handleBoxTap}
            animate={{
              scale: 1 + (powerLevel / 100) * 0.18,
              rotate: powerLevel > 20 ? [-(powerLevel / 15), powerLevel / 15, 0] : 0,
            }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            whileTap={{ scale: 0.94 }}
            className="cursor-pointer relative group flex items-center justify-center"
          >
            {/* Неоновое свечение GiftX */}
            <div className={`absolute inset-0 blur-3xl rounded-full transition-all ${
              powerLevel >= 80 ? 'bg-amber-400/60 scale-125' :
              boxLevel === 'PLATINUM' ? 'bg-purple-500/30' :
              boxLevel === 'GOLD' ? 'bg-amber-500/30' :
              boxLevel === 'SILVER' ? 'bg-cyan-500/30' : 'bg-purple-500/20'
            }`}></div>

            {/* 3D Коробка GiftX UI Asset */}
            <div className={`w-60 h-60 rounded-3xl flex flex-col items-center justify-center border-2 shadow-2xl relative z-10 overflow-hidden transform transition-all ${
              powerLevel >= 80 ? 'border-amber-300 shadow-[0_0_45px_rgba(245,158,11,0.85)] scale-105' :
              boxLevel === 'PLATINUM' ? 'border-purple-500/60 bg-slate-950' :
              boxLevel === 'GOLD' ? 'border-amber-400/60 bg-slate-950' :
              boxLevel === 'SILVER' ? 'border-cyan-400/50 bg-slate-950' : 'border-purple-400/40 bg-slate-950'
            }`}>
              <img
                src={powerLevel >= 80 || isOpening ? '/giftx_open_box.png' : '/giftx_closed_box.png'}
                alt="GiftX 3D Box"
                className={`w-full h-full object-cover rounded-3xl transition-all duration-200 ${
                  powerLevel >= 80 ? 'scale-110 brightness-125' : 'scale-100'
                }`}
              />

              <div className="absolute bottom-3 inset-x-0 mx-auto w-fit z-20 px-3 py-1 bg-slate-950/85 backdrop-blur-md rounded-full border border-amber-400/60 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest flex items-center space-x-1.5 shadow-2xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <span>GiftX {boxLevel}</span>
              </div>
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
