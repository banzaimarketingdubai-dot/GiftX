import React, { useState, useEffect } from 'react';
import { 
  X, 
  Gift, 
  Crown, 
  MapPin, 
  Star, 
  Check, 
  Camera, 
  Sparkles, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Info,
  Building2,
  Clock
} from 'lucide-react';
import { triggerHaptic } from '../telegram';
import { Partner } from '../types';

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
              // Fallback demo partner
              setPartner({
                id: partnerId,
                name: 'Sunset Beach Club',
                category: 'HORECA',
                address: 'Long Beach, Phu Quoc',
                logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
                googleRating: 4.8,
                googleReviewsCount: 342,
                basicThreshold: 0,
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
  const category = partner?.category || 'HORECA';
  const address = partner?.address || 'Вьетнам';
  const rating = partner?.googleRating || 4.8;
  const reviewsCount = partner?.googleReviewsCount || 150;
  const workingHours = partner?.workingHours || '10:00 - 23:00';

  const formatVnd = (num?: number) => {
    if (num === undefined || num === 0) return 'Любая сумма';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}M ₫`;
    return `${(num / 1000).toFixed(0)}k ₫`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative my-auto">
        {/* Верхняя визуальная плашка */}
        <div className="relative h-32 bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-slate-900 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center backdrop-blur-md transition-all z-20 border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Профиль заведения */}
        <div className="px-5 pb-4 -mt-12 relative z-10 space-y-4 overflow-y-auto flex-1">
          <div className="flex items-end space-x-3.5">
            <img
              src={partner?.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80'}
              alt={venueName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl bg-slate-950 shrink-0"
            />
            <div className="space-y-1 pb-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full tracking-wider">
                  📍 Вы в заведении
                </span>
                <span className="text-[10px] font-bold text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{workingHours}</span>
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-100 leading-tight">{venueName}</h2>
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate max-w-[220px]">{address}</span>
              </p>
            </div>
          </div>

          {/* Рейтинг Google */}
          <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center space-x-1 text-amber-400 font-extrabold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({reviewsCount} отзывов на Google Maps)</span>
            <span className="ml-auto text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ✓ Партнер GiftX
            </span>
          </div>

          {/* ============================================================== */}
          {/* 🌟 СЕКЦИЯ 1: ВИДЫ ПОДАРОЧНЫХ БОКСОВ И ИХ СТОИМОСТЬ (ПЕРВОЙ!) */}
          {/* ============================================================== */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  🎁
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                    1. Виды боксов и условия чека
                  </h3>
                  <p className="text-[11px] text-slate-400">Стоимость чека для получения каждого уровня бокса</p>
                </div>
              </div>
            </div>

            {/* Сетка 4 видов боксов */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* BASIC BOX */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-900/40 space-y-1.5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-500 flex items-center space-x-1">
                    <span>🥉 BASIC</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {formatVnd(partner?.basicThreshold || 0)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-semibold leading-tight">
                  Стартовый бокс с 5 ваучерами на подарки
                </p>
                <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                  Чек: любая сумма
                </div>
              </div>

              {/* SILVER BOX */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-700/60 space-y-1.5 relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center space-x-1">
                    <span>🥈 SILVER</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-200 bg-slate-400/10 px-1.5 py-0.5 rounded border border-slate-400/20">
                    от {formatVnd(partner?.silverThreshold || 300000)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-semibold leading-tight">
                  Повышенная ценность подарков и напитков
                </p>
                <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                  Средний чек заведения
                </div>
              </div>

              {/* GOLD BOX */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-1.5 relative overflow-hidden shadow-md shadow-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400 flex items-center space-x-1">
                    <span>🥇 GOLD</span>
                  </span>
                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                    от {formatVnd(partner?.goldThreshold || 600000)}
                  </span>
                </div>
                <p className="text-[10px] text-amber-200 font-semibold leading-tight">
                  Премиум подарки: авторский десерт / сет
                </p>
                <div className="text-[9px] text-amber-400/80 pt-1 border-t border-amber-500/20">
                  Повышенный VIP чек
                </div>
              </div>

              {/* PLATINUM BOX */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-950 to-slate-950 border border-purple-500/50 space-y-1.5 relative overflow-hidden shadow-md shadow-purple-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-300 flex items-center space-x-1">
                    <span>💎 PLATINUM</span>
                  </span>
                  <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/40">
                    от {formatVnd(partner?.platinumThreshold || 1000000)}
                  </span>
                </div>
                <p className="text-[10px] text-purple-200 font-semibold leading-tight">
                  Максимальный VIP элитный бокс подарков
                </p>
                <div className="text-[9px] text-purple-400/80 pt-1 border-t border-purple-500/20">
                  Премиальный VIP чек
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 🌟 СЕКЦИЯ 2: КРАТКАЯ ИНСТРУКЦИЯ СКАНИРОВАТЬ QR У СОТРУДНИКА */}
          {/* ============================================================== */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 shadow-lg">
            <div className="flex items-center space-x-2 text-amber-400">
              <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                2. Инструкция: Сканируйте QR до оплаты
              </h4>
            </div>

            <div className="space-y-2 text-xs text-slate-200">
              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="leading-snug">
                  Перед расчетом <strong className="text-amber-300">сообщите официанту</strong>, что хотите получить подарочный бокс GiftX.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="leading-snug">
                  Сотрудник покажет вам <strong className="text-amber-300">QR-код соответствующего уровня бокса</strong> на своем экране.
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="leading-snug">
                  Нажмите кнопку ниже, <strong className="text-amber-300">отсканируйте QR сотрудника</strong> и сразу заберите 5 подарков!
                </p>
              </div>
            </div>
          </div>

          {/* Главная CTA кнопка для отсканирования QR официанта */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onClose();
              onOpenScanner();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl shadow-amber-500/25 active:scale-[0.98]"
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
