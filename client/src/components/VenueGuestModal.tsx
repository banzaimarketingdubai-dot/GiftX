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

export const VenueGuestModal: React.FC<VenueGuestModalProps> = ({
  partnerId,
  partner: initialPartner,
  onClose,
  onOpenScanner,
}) => {
  const [partner, setPartner] = useState<Partner | null>(initialPartner || null);
  const [loading, setLoading] = useState(!initialPartner && !!partnerId);
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
      setLoading(true);
      fetch('/api/staff/partners')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.partners) {
            const found = data.partners.find((p: any) => p.id === partnerId);
            if (found) {
              setPartner(found);
            } else {
              setPartner({
                id: partnerId,
                name: 'Sunset Beach Club',
                category: 'HORECA',
                address: 'Long Beach, Phu Quoc',
                logoUrl: '',
                coverUrl: '',
                googleRating: 4.8,
                googleReviewsCount: 342,
                silverThreshold: 300000,
                goldThreshold: 600000,
                platinumThreshold: 1000000,
                workingHours: '10:00 - 23:00'
              } as Partner);
            }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0e1621]/95 backdrop-blur-md animate-fadeIn overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-[#17212b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col relative my-auto">
        {/* ============================================================== */}
        {/* 📸 ШАПКА: ФОТО ЗАВЕДЕНИЯ НА ВСЮ ШИРИНУ ЭКРАНА                 */}
        {/* ============================================================== */}
        <div className="relative h-44 sm:h-48 w-full shrink-0 bg-[#0e1621]">
          <div className="w-full h-full overflow-hidden">
            <img
              src={coverPhoto}
              alt={venueName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/30 to-black/50" />
          </div>
          
          {/* Верхние кнопки управления (Шеринг и Закрыть) */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
            <button
              onClick={handleShare}
              title="Поделиться заведением"
              className="w-8 h-8 rounded-full bg-[#17212b]/80 hover:bg-[#17212b] text-[#2aabee] flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-md cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#17212b]/80 hover:bg-[#17212b] text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/10 shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 👤 ЛОГОТИП В ЦЕНТРЕ НА ГРАНИЦЕ (100% ВИДИМОСТЬ БЕЗ ОБРЕЗАНИЯ) */}
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
        {/* 👤 ПРИВЕТСТВИЕ ГОСТЯ + ВЫДЕЛЕННАЯ ИНСТРУКЦИЯ                   */}
        {/* ============================================================== */}
        <div className="px-5 pt-12 pb-5 relative z-10 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Приветствие гостя */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#2aabee] bg-[#2aabee]/15 border border-[#2aabee]/30 px-2.5 py-0.5 rounded-full tracking-wider inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#2aabee] inline" />
                <span>Добро пожаловать!</span>
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 leading-tight">{venueName}</h2>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2aabee] shrink-0" />
                  <span className="truncate max-w-[180px]">{address}</span>
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
          {/* ⚡ ИНТЕРАКТИВНЫЙ ГОРИЗОНТАЛЬНЫЙ СЛАЙДЕР ИНСТРУКЦИИ (3 ШАГА)    */}
          {/* ============================================================== */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e2c3a] via-[#17212b] to-[#121922] border-2 border-[#2aabee]/50 space-y-3 shadow-xl shadow-[#2aabee]/10 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-[#2aabee]/20 rounded-full blur-xl pointer-events-none" />

            {/* Шапка блока слайдера */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-[#2aabee]/20 border border-[#2aabee]/40 flex items-center justify-center text-[#2aabee] shrink-0">
                  <Zap className="w-4 h-4 text-[#2aabee] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Как получить подарок
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">Листайте шаги вправо ➔</p>
                </div>
              </div>

              {/* Индикатор текущего шага */}
              <span className="text-[10px] font-black uppercase text-[#2aabee] bg-[#2aabee]/15 border border-[#2aabee]/30 px-2.5 py-0.5 rounded-full">
                Шаг {activeInstructionSlide + 1} из 3
              </span>
            </div>

            {/* Контейнер слайдов с горизонтальным скроллом */}
            <div
              ref={instructionSliderRef}
              onScroll={(e) => {
                const width = e.currentTarget.clientWidth;
                if (width > 0) {
                  const idx = Math.round(e.currentTarget.scrollLeft / width);
                  if (idx !== activeInstructionSlide) setActiveInstructionSlide(idx);
                }
              }}
              className="flex space-x-3 overflow-x-auto snap-x snap-mandatory no-scrollbar relative z-10 pt-1 pb-1"
            >
              {/* SLIDE 1 */}
              <div className="w-full shrink-0 snap-center space-y-3">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2aabee] to-[#229ed9] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-[#2aabee]/30">
                      1
                    </div>
                    <span className="text-xs font-bold text-slate-200">Шаг 1: Скажите официанту</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">
                    При вызове официанта или оплате чека произнесите:
                  </p>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center font-extrabold text-sm shadow-inner">
                    «Я гость GiftX!»
                  </div>
                </div>

                {/* Графика под текстом для Шага 1 */}
                <div className="p-3 rounded-xl bg-[#17212b]/60 border border-white/5 space-y-2 text-center">
                  <div className="flex justify-center space-x-3 text-2xl select-none">
                    <span className="p-2 rounded-xl bg-[#242f3d] border border-white/10 shadow-sm animate-bounce" style={{ animationDuration: '2s' }}>🍹</span>
                    <span className="p-2 rounded-xl bg-[#242f3d] border border-white/10 shadow-sm animate-bounce" style={{ animationDuration: '2.4s' }}>💬</span>
                    <span className="p-2 rounded-xl bg-[#242f3d] border border-white/10 shadow-sm animate-bounce" style={{ animationDuration: '2.8s' }}>💆‍♀️</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Официант подготовят QR-код нужного уровня бокса
                  </div>
                </div>
              </div>

              {/* SLIDE 2 */}
              <div className="w-full shrink-0 snap-center space-y-3">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#2aabee] to-[#229ed9] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-[#2aabee]/30">
                      2
                    </div>
                    <span className="text-xs font-bold text-slate-200">Шаг 2: Сканируйте QR</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">
                    Официант покажет вам на смартфоне:
                  </p>

                  <div className="p-2.5 rounded-xl bg-[#2aabee]/15 border border-[#2aabee]/40 text-[#2aabee] text-center font-extrabold text-xs shadow-inner">
                    QR-код уровня бокса (Silver / Gold / VIP)
                  </div>
                </div>

                {/* Графика под текстом для Шага 2 */}
                <div className="p-3 rounded-xl bg-[#17212b]/60 border border-white/5 space-y-2 text-center">
                  <div className="flex items-center justify-center space-x-3 text-2xl select-none">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2aabee] to-cyan-400 p-0.5 shadow-lg shadow-[#2aabee]/30 flex items-center justify-center">
                      <div className="w-full h-full bg-[#17212b] rounded-[10px] flex items-center justify-center">
                        <Camera className="w-6 h-6 text-[#2aabee] animate-pulse" />
                      </div>
                    </div>
                    <span className="text-slate-500 font-black text-base">➔</span>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs shadow-md">
                      QR 📷
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Наведите камеру сканера на экран официанта
                  </div>
                </div>
              </div>

              {/* SLIDE 3 */}
              <div className="w-full shrink-0 snap-center space-y-3">
                <div className="p-3 rounded-xl bg-[#17212b]/95 border border-white/10 space-y-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                      3
                    </div>
                    <span className="text-xs font-bold text-slate-200">Шаг 3: Заберите 5 Подарков</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">
                    После сканирования раскроется 3D-бокс:
                  </p>

                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-center font-extrabold text-xs shadow-inner">
                    Веер из 5 подарочных карт! 🎁
                  </div>
                </div>

                {/* Графика под текстом для Шага 3 */}
                <div className="p-3 rounded-xl bg-[#17212b]/60 border border-white/5 space-y-2 text-center">
                  <div className="flex justify-center space-x-2 text-xl select-none">
                    <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[10px] shadow-sm transform -rotate-6">
                      🍹 Коктейль
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-[10px] shadow-sm">
                      💆‍♀️ СПА
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] shadow-sm transform rotate-6">
                      🍕 Скидка
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    Все карточки сохранятся в ваш Кошелек
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

            <div className="space-y-2">
              {/* SILVER BOX */}
              <div className="p-3 rounded-xl bg-[#242f3d] border border-white/5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                    <span>🥈 SILVER BOX</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 bg-[#17212b] px-2 py-0.5 rounded-full border border-white/5">
                    от {formatVnd(partner?.silverThreshold || 300000)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#17212b] text-[11px] text-slate-300 space-y-0.5">
                  <div className="font-bold text-slate-200">🎴 Содержимое бокса (всего 3 карты):</div>
                  <div className="text-[10px] text-slate-400">
                    • 2 карточки <strong className="text-slate-300">Серебряного</strong> номинала + 1 <strong className="text-amber-400">Золотая</strong>
                  </div>
                </div>
              </div>

              {/* GOLD BOX */}
              <div className="p-3 rounded-xl bg-[#242f3d] border border-white/5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                    <span>🥇 GOLD BOX</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    от {formatVnd(partner?.goldThreshold || 600000)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#17212b] text-[11px] text-amber-200/90 space-y-0.5">
                  <div className="font-bold text-amber-300">🎴 Содержимое бокса (всего 4 карты):</div>
                  <div className="text-[10px] text-slate-300">
                    • 1 <strong className="text-slate-300">Серебряная</strong> + 2 <strong className="text-amber-400">Золотые</strong> + 1 <strong className="text-purple-400">Платиновая</strong>
                  </div>
                </div>
              </div>

              {/* PLATINUM BOX */}
              <div className="p-3 rounded-xl bg-[#242f3d] border border-white/5 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center space-x-1">
                    <span>💎 PLATINUM BOX</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    от {formatVnd(partner?.platinumThreshold || 1000000)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#17212b] text-[11px] text-purple-200/90 space-y-0.5">
                  <div className="font-bold text-purple-300">🎴 Содержимое бокса (всего 5 карт):</div>
                  <div className="text-[10px] text-slate-300">
                    • 1 <strong className="text-slate-300">Серебряная</strong> + 2 <strong className="text-amber-400">Золотые</strong> + 2 <strong className="text-purple-400">Платиновые VIP</strong>
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
            className="w-full py-3 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-[#2aabee]/30 active:scale-[0.98] mt-2 cursor-pointer"
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
