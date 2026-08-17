import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0e1621]/85 backdrop-blur-md animate-fadeIn overflow-y-auto font-sans">
      <div className="w-full max-w-md bg-[#17212b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col relative my-auto">
        {/* ============================================================== */}
        {/* 📸 ШАПКА: ФОТО ЗАВЕДЕНИЯ НА ВСЮ ШИРИНУ ЭКРАНА                 */}
        {/* ============================================================== */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden shrink-0 bg-[#0e1621]">
          <img
            src={coverPhoto}
            alt={venueName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/30 to-black/50" />
          
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
        </div>

        {/* ============================================================== */}
        {/* 👤 ЛОГОТИП В КРУГЕ КАК В СОЦСЕТЯХ + ПРИВЕТСТВИЕ ГОСТЯ           */}
        {/* ============================================================== */}
        <div className="px-5 pb-5 relative z-10 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Аватарка/Логотип в круге поверх обложки шапки */}
          <div className="flex flex-col items-center text-center -mt-12 space-y-2">
            <VenueAvatar
              logoUrl={partner?.logoUrl}
              name={venueName}
              className="w-20 h-20 text-2xl rounded-full border-4 border-[#17212b] shadow-2xl shrink-0 ring-2 ring-[#2aabee]/40"
              style={{ width: '80px', height: '80px' }}
            />

            {/* Приветствие гостя */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#2aabee] bg-[#2aabee]/15 border border-[#2aabee]/30 px-2.5 py-0.5 rounded-full tracking-wider inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#2aabee] inline" />
                <span>Добро пожаловать!</span>
              </span>
              <h2 className="text-lg font-extrabold text-slate-100 leading-tight">{venueName}</h2>
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
            </div>
          </div>

          {/* ============================================================== */}
          {/* ⚡ ИНСТРУКЦИЯ КАК ПОЛУЧИТЬ ПОДАРОК (БОКС)                     */}
          {/* ============================================================== */}
          <div className="p-3.5 rounded-xl bg-[#242f3d] border border-white/5 space-y-2.5 shadow-sm">
            <div className="flex items-center space-x-2 text-[#2aabee]">
              <Zap className="w-4 h-4 text-[#2aabee] animate-pulse" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-100">
                Инструкция: Как получить ваш GiftX Box
              </h4>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-md bg-[#2aabee]/20 text-[#2aabee] font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  При вызове официанта <strong className="text-[#2aabee]">сообщите, что вы гость GiftX</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-md bg-[#2aabee]/20 text-[#2aabee] font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Официант покажет вам <strong className="text-[#2aabee]">QR-код соответствующего уровня бокса</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-md bg-[#2aabee]/20 text-[#2aabee] font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Нажмите кнопку ниже, <strong className="text-[#2aabee]">отсканируйте QR</strong> и заберите карточки подарков!
                </p>
              </div>
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
