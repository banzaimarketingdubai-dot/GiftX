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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col relative my-auto">
        {/* ============================================================== */}
        {/* 📸 ШАПКА: ФОТО ЗАВЕДЕНИЯ НА ВСЮ ШИРИНУ ЭКРАНА                 */}
        {/* ============================================================== */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden shrink-0 bg-slate-950">
          <img
            src={coverPhoto}
            alt={venueName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-black/50" />
          
          {/* Верхние кнопки управления (Шеринг и Закрыть) */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
            <button
              onClick={handleShare}
              title="Поделиться заведением"
              className="w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-amber-400 hover:text-amber-300 flex items-center justify-center backdrop-blur-md transition-all border border-slate-700/80 shadow-lg"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur-md transition-all border border-slate-700/80 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 👤 ЛОГОТИП В КРУГЕ КАК В СОЦСЕТЯХ + ПРИВЕТСТВИЕ ГОСТЯ           */}
        {/* ============================================================== */}
        <div className="px-5 pb-5 relative z-10 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Аватарка/Логотип в круге поверх обложки шапки (с автозаменой на монограмму инициалов) */}
          <div className="flex flex-col items-center text-center -mt-12 space-y-2">
            <VenueAvatar
              logoUrl={partner?.logoUrl}
              name={venueName}
              className="w-22 h-22 text-2xl rounded-full border-4 border-slate-900 shadow-2xl shrink-0 ring-2 ring-amber-500/40"
              style={{ width: '84px', height: '84px' }}
            />

            {/* Приветствие гостя */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full tracking-wider inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400 inline" />
                <span>Добро пожаловать!</span>
              </span>
              <h2 className="text-xl font-black text-slate-100 leading-tight">{venueName}</h2>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 shadow-md">
            <div className="flex items-center space-x-2 text-amber-400">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                Инструкция: Как получить ваш GiftX Box
              </h4>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  При вызове официанта <strong className="text-amber-300">сообщите, что вы гость GiftX</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Официант покажет вам <strong className="text-amber-300">QR-код соответствующего уровня бокса</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Нажмите кнопку ниже, <strong className="text-amber-300">отсканируйте QR</strong> и заберите карточки подарков!
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 📊 ИНФОРМАЦИЯ О СУММАХ ЧЕКА И СООТВЕТСТВИИ БОКСОВ И КАРТОЧЕК   */}
          {/* ============================================================== */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <span>🎁 Виды боксов и состав выпадающих карт:</span>
            </h3>

            <div className="space-y-2">
              {/* SILVER BOX */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-700/60 space-y-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center space-x-1">
                    <span>🥈 SILVER BOX</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-200 bg-slate-400/10 px-2 py-0.5 rounded-lg border border-slate-400/20">
                    от {formatVnd(partner?.silverThreshold || 300000)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-0.5">
                  <div className="font-bold text-slate-200">🎴 Содержимое бокса (всего 3 карты):</div>
                  <div className="text-[10px] text-slate-400">
                    • 2 карточки <strong className="text-slate-300">Серебряного</strong> номинала + 1 <strong className="text-amber-300">Золотая</strong>
                  </div>
                </div>
              </div>

              {/* GOLD BOX */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-1.5 shadow-md shadow-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 flex items-center space-x-1">
                    <span>🥇 GOLD BOX</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40">
                    от {formatVnd(partner?.goldThreshold || 600000)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/20 text-[11px] text-amber-200 space-y-0.5">
                  <div className="font-bold text-amber-300">🎴 Содержимое бокса (всего 4 карты):</div>
                  <div className="text-[10px] text-amber-200/90">
                    • 1 <strong className="text-slate-300">Серебряная</strong> + 2 <strong className="text-amber-400">Золотые</strong> + 1 <strong className="text-purple-300">Платиновая</strong>
                  </div>
                </div>
              </div>

              {/* PLATINUM BOX */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-950 border border-purple-500/60 space-y-1.5 shadow-md shadow-purple-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 flex items-center space-x-1">
                    <span>💎 PLATINUM BOX</span>
                  </span>
                  <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/40">
                    от {formatVnd(partner?.platinumThreshold || 1000000)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/90 border border-purple-500/30 text-[11px] text-purple-200 space-y-0.5">
                  <div className="font-bold text-purple-300">🎴 Содержимое бокса (всего 5 карт):</div>
                  <div className="text-[10px] text-purple-200/90">
                    • 1 <strong className="text-slate-300">Серебряная</strong> + 2 <strong className="text-amber-300">Золотые</strong> + 2 <strong className="text-purple-300">Платиновые VIP</strong>
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl shadow-amber-500/25 active:scale-[0.98] mt-2"
          >
            <Camera className="w-5 h-5 text-slate-950" />
            <span>Сканировать QR-код официанта</span>
            <ChevronRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
