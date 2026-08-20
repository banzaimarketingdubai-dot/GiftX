import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  Camera, 
  Sparkles, 
  Zap, 
  ChevronRight,
  Clock,
  Share2
} from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { Partner } from '../types';
import { getVenueCoverImage } from '../utils/stockImages';
import { VenueAvatar } from './VenueAvatar';

interface VenueGuestModalProps {
  partnerId?: string;
  partner?: Partner | null;
  onClose: () => void;
  onOpenScanner: () => void;
}

const getCachedPartner = (partnerId?: string, initialPartner?: Partner | null): Partner | null => {
  if (initialPartner) return initialPartner;
  if (!partnerId) return null;
  try {
    const cachedStr = localStorage.getItem('giftx_cached_partners');
    if (cachedStr) {
      const cachedList: Partner[] = JSON.parse(cachedStr);
      if (Array.isArray(cachedList)) {
        const found = cachedList.find((p) => p.id === partnerId);
        if (found) return found;
      }
    }
  } catch (e) {}
  return null;
};

export const VenueGuestModal: React.FC<VenueGuestModalProps> = ({
  partnerId,
  partner: initialPartner,
  onClose,
  onOpenScanner,
}) => {
  const initialCached = getCachedPartner(partnerId, initialPartner);
  const [partner, setPartner] = useState<Partner | null>(initialCached);
  const [loading, setLoading] = useState(!initialCached && !!partnerId);
  const [activeInstructionSlide, setActiveInstructionSlide] = useState<number>(0);
  const instructionSliderRef = useRef<HTMLDivElement>(null);

  const scrollToInstructionSlide = (idx: number) => {
    setActiveInstructionSlide(idx);
    if (instructionSliderRef.current) {
      const width = instructionSliderRef.current.clientWidth;
      instructionSliderRef.current.scrollTo({
        left: width * idx,
        behavior: 'smooth',
      });
    }
  };

  // 🔒 Блокировка скролла заднего фона при открытии экрана заведения
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 🔄 Автоматический свайп слайдов инструкции каждые 4 секунды (4000 мс)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInstructionSlide((prev) => {
        const nextIdx = (prev + 1) % 3;
        if (instructionSliderRef.current) {
          const width = instructionSliderRef.current.clientWidth;
          instructionSliderRef.current.scrollTo({
            left: width * nextIdx,
            behavior: 'smooth',
          });
        }
        return nextIdx;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!initialPartner && partnerId) {
      fetch(`/api/guest/partner/${partnerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.partner) {
            setPartner(data.partner);
            try {
              const cachedStr = localStorage.getItem('giftx_cached_partners');
              let cachedList: Partner[] = cachedStr ? JSON.parse(cachedStr) : [];
              if (!Array.isArray(cachedList)) cachedList = [];
              const existsIdx = cachedList.findIndex((p) => p.id === partnerId);
              if (existsIdx >= 0) cachedList[existsIdx] = data.partner;
              else cachedList.push(data.partner);
              localStorage.setItem('giftx_cached_partners', JSON.stringify(cachedList));
            } catch (e) {}
          } else {
            return fetch('/api/staff/partners')
              .then((res) => res.json())
              .then((pData) => {
                if (pData.success && pData.partners) {
                  const found = pData.partners.find((p: any) => p.id === partnerId);
                  if (found) setPartner(found);
                }
              });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [partnerId, initialPartner]);

  const venueName = partner?.name || 'Заведение-партнер';
  const address = partner?.address || 'Вьетнам';
  const rating = partner?.googleRating || 4.8;
  const reviewsCount = partner?.googleReviewsCount || 150;
  const workingHours = partner?.workingHours || '10:00 - 23:00';
  const coverPhoto = getVenueCoverImage(partner?.coverUrl, partner?.category);

  const effectivePartnerId = partner?.id || partnerId || 'demo-partner-1';
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gift-x.vercel.app';
  const webAppUrl = `${origin}/?venue=${effectivePartnerId}`;

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `GiftX — ${venueName}`,
          text: `Посетите заведение «${venueName}» и получите подарки GiftX!`,
          url: webAppUrl,
        });
        return;
      } catch (err) {}
    }
    const shareText = `Карточка заведения «${venueName}» в GiftX:`;
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(webAppUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgShareUrl, '_blank');
  };

  const formatVnd = (num?: number) => {
    if (num === undefined || num === 0) return 'Любая сумма';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M ₫`;
    return `${(num / 1000).toFixed(0)}k ₫`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-[#0e1621] animate-fadeIn font-sans overflow-hidden">
      <div className="w-full max-w-4xl bg-[#17212b] h-full flex flex-col relative overflow-hidden shadow-2xl">
        {/* ============================================================== */}
        {/* 📸 ШАПКА: ФОТО ЗАВЕДЕНИЯ НА ВСЮ ШИРИНУ                         */}
        {/* ============================================================== */}
        <div className="relative h-36 sm:h-48 md:h-56 w-full shrink-0 bg-[#0e1621]">
          <div className="w-full h-full overflow-hidden">
            <img
              src={coverPhoto}
              alt={venueName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/30 to-black/50" />
          </div>
          
          {/* Верхние кнопки управления (Шеринг и Закрыть) */}
          <div className="absolute top-3.5 right-3.5 flex items-center space-x-2 z-20">
            <button
              onClick={handleShare}
              title="Поделиться заведением"
              className="w-9 h-9 rounded-full bg-[#17212b]/80 hover:bg-[#17212b] text-[#2aabee] flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-md cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-[#17212b]/80 hover:bg-[#17212b] text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-md cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* 👤 ЛОГОТИП В ЦЕНТРЕ НА ГРАНИЦЕ */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-20">
            <VenueAvatar
              logoUrl={partner?.logoUrl}
              name={venueName}
              className="w-20 h-20 text-2xl rounded-full border-4 border-[#17212b] shadow-2xl shrink-0 ring-4 ring-[#2aabee]/40"
              style={{ width: '80px', height: '80px' }}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 👤 ПРИВЕТСТВИЕ ГОСТЯ + КОМПАКТНАЯ ИНСТРУКЦИЯ                    */}
        {/* ============================================================== */}
        <div className="px-4 sm:px-8 pt-12 pb-6 relative z-10 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Приветствие гостя */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="space-y-1 max-w-lg">
              <span className="text-[10px] font-bold uppercase text-[#2aabee] bg-[#2aabee]/15 border border-[#2aabee]/30 px-3 py-0.5 rounded-full tracking-wider inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#2aabee] inline" />
                <span>Добро пожаловать!</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 leading-tight">{venueName}</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2aabee] shrink-0" />
                  <span>{address}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{workingHours}</span>
                </span>
              </div>

              <a
                href={partner?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(venueName + ' ' + address)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('light')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm mt-1"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
                <span className="text-slate-300 font-medium text-[11px]">({reviewsCount} отзывов на Google Maps ↗)</span>
              </a>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ⚡ ИНТЕРАКТИВНЫЙ ГОРИЗОНТАЛЬНЫЙ СЛАЙДЕР ИНСТРУКЦИИ (КОМПАКТНЫЙ) */}
          {/* ============================================================== */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1e2c3a] via-[#17212b] to-[#121922] border-2 border-[#2aabee]/50 space-y-2.5 shadow-xl shadow-[#2aabee]/10 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-[#2aabee]/20 rounded-full blur-xl pointer-events-none" />

            {/* Шапка блока слайдера */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#2aabee]/20 border border-[#2aabee]/40 flex items-center justify-center text-[#2aabee] shrink-0">
                  <Zap className="w-3.5 h-3.5 text-[#2aabee] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Как получить подарок
                  </h4>
                </div>
              </div>

              {/* Индикатор текущего шага */}
              <span className="text-[10px] font-black uppercase text-[#2aabee] bg-[#2aabee]/15 border border-[#2aabee]/30 px-2.5 py-0.5 rounded-full">
                Шаг {activeInstructionSlide + 1} из 3
              </span>
            </div>

            {/* Контейнер слайдов с уменьшенной высотой */}
            <div
              ref={instructionSliderRef}
              onScroll={(e) => {
                const width = e.currentTarget.clientWidth;
                if (width > 0) {
                  const idx = Math.round(e.currentTarget.scrollLeft / width);
                  if (idx !== activeInstructionSlide) setActiveInstructionSlide(idx);
                }
              }}
              className="flex space-x-3 overflow-x-auto snap-x snap-mandatory no-scrollbar relative z-10"
            >
              {/* SLIDE 1 */}
              <div className="w-full shrink-0 snap-center">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2aabee] to-[#229ed9] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-[#2aabee]/30">
                        1
                      </div>
                      <span className="text-xs font-bold text-slate-200">Скажите официанту при заказе/оплате:</span>
                    </div>
                    <div className="flex space-x-1.5 text-sm select-none">
                      <span className="p-1 rounded-md bg-[#242f3d] border border-white/5 shadow-xs">🍹</span>
                      <span className="p-1 rounded-md bg-[#242f3d] border border-white/5 shadow-xs">💬</span>
                      <span className="p-1 rounded-md bg-[#242f3d] border border-white/5 shadow-xs">💆‍♀️</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center font-extrabold text-xs sm:text-sm shadow-inner">
                    «Я гость GiftX!»
                  </div>
                </div>
              </div>

              {/* SLIDE 2 */}
              <div className="w-full shrink-0 snap-center">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2aabee] to-[#229ed9] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-[#2aabee]/30">
                        2
                      </div>
                      <span className="text-xs font-bold text-slate-200">Отсканируйте QR у официанта:</span>
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Camera className="w-3.5 h-3.5 text-[#2aabee]" />
                      <span>Сканер</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#2aabee]/15 border border-[#2aabee]/40 text-[#2aabee] text-center font-extrabold text-xs sm:text-sm shadow-inner">
                    QR-код уровня бокса (Silver / Gold / VIP)
                  </div>
                </div>
              </div>

              {/* SLIDE 3 */}
              <div className="w-full shrink-0 snap-center">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                        3
                      </div>
                      <span className="text-xs font-bold text-slate-200">Откройте 3D-бокс и заберите:</span>
                    </div>
                    <div className="flex space-x-1 text-xs select-none">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">🍹 Напиток</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">🎁 СПА</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center font-extrabold text-xs sm:text-sm shadow-inner">
                    Веер из 5 подарочных карт в ваш Кошелек! 🎁
                  </div>
                </div>
              </div>
            </div>

            {/* Точечная пагинация и стрелки управления */}
            <div className="flex items-center justify-between pt-1 relative z-10 border-t border-white/5">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  const newIdx = Math.max(0, activeInstructionSlide - 1);
                  scrollToInstructionSlide(newIdx);
                }}
                disabled={activeInstructionSlide === 0}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
                  activeInstructionSlide === 0
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-[#2aabee] hover:bg-[#2aabee]/10 cursor-pointer'
                }`}
              >
                ← Назад
              </button>

              {/* Точки слайдов */}
              <div className="flex space-x-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      triggerHaptic('light');
                      scrollToInstructionSlide(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeInstructionSlide === idx
                        ? 'w-6 bg-[#2aabee] shadow-sm shadow-[#2aabee]/50'
                        : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  const newIdx = Math.min(2, activeInstructionSlide + 1);
                  scrollToInstructionSlide(newIdx);
                }}
                disabled={activeInstructionSlide === 2}
                className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${
                  activeInstructionSlide === 2
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-[#2aabee] hover:bg-[#2aabee]/10 cursor-pointer'
                }`}
              >
                Вперед →
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 📊 ИНФОРМАЦИЯ О СУММАХ ЧЕКА И СООТВЕТСТВИИ БОКСОВ И КАРТОЧЕК   */}
          {/* ============================================================== */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🎁 Виды боксов и состав выпадающих карт:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* SILVER BOX */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-[#192634] to-[#0c1926] border border-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.15)] space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-cyan-300 bg-cyan-500/20 px-2.5 py-0.5 rounded-full border border-cyan-400/40 shadow-xs">
                    от {formatVnd(partner?.silverThreshold || 300000)}
                  </span>
                  <span className="text-xs font-black text-cyan-200 flex items-center space-x-1 tracking-wider">
                    <span>🥈 SILVER BOX</span>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0a111a]/85 border border-cyan-500/20 text-[11px] text-cyan-100/90 space-y-0.5 backdrop-blur-xs">
                  <div className="font-extrabold text-cyan-300 flex items-center space-x-1">
                    <span>🎴 Содержимое (3 карты):</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    • 2 <strong className="text-cyan-300">Серебряные</strong> + 1 <strong className="text-amber-400">Золотая</strong>
                  </div>
                </div>
              </div>

              {/* GOLD BOX */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#261c0a] via-[#1c1406] to-[#120c02] border border-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.18)] space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-300 bg-amber-500/25 px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-xs">
                    от {formatVnd(partner?.goldThreshold || 600000)}
                  </span>
                  <span className="text-xs font-black text-amber-400 flex items-center space-x-1 tracking-wider">
                    <span>🥇 GOLD BOX</span>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#120a02]/85 border border-amber-500/25 text-[11px] text-amber-100/90 space-y-0.5 backdrop-blur-xs">
                  <div className="font-extrabold text-amber-300 flex items-center space-x-1">
                    <span>🎴 Содержимое (4 карты):</span>
                  </div>
                  <div className="text-[10px] text-amber-200/90">
                    • 1 <strong className="text-cyan-300">Серебряная</strong> + 2 <strong className="text-amber-400">Золотые</strong> + 1 <strong className="text-purple-400">Платиновая</strong>
                  </div>
                </div>
              </div>

              {/* PLATINUM BOX */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1c0c30] via-[#140824] to-[#0d041a] border border-purple-400/60 shadow-[0_0_18px_rgba(192,132,252,0.2)] space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-purple-300 bg-purple-500/25 px-2.5 py-0.5 rounded-full border border-purple-400/50 shadow-xs">
                    от {formatVnd(partner?.platinumThreshold || 1000000)}
                  </span>
                  <span className="text-xs font-black text-purple-300 flex items-center space-x-1 tracking-wider">
                    <span>💎 PLATINUM BOX</span>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0b0314]/85 border border-purple-500/25 text-[11px] text-purple-100/90 space-y-0.5 backdrop-blur-xs">
                  <div className="font-extrabold text-purple-300 flex items-center space-x-1">
                    <span>🎴 Содержимое (5 карт):</span>
                  </div>
                  <div className="text-[10px] text-purple-200/90">
                    • 1 <strong className="text-cyan-300">Серебряная</strong> + 2 <strong className="text-amber-400">Золотые</strong> + 2 <strong className="text-purple-400">Платиновые VIP</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 📷 КНОПКА СКАНЕРА СНИЗУ                                        */}
          {/* ============================================================== */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onClose();
              onOpenScanner();
            }}
            className="w-full py-3.5 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#2aabee]/30 active:scale-[0.98] mt-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Сканировать QR-код официанта</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
