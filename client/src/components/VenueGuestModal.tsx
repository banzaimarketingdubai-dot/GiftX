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
  Clock,
  Link,
  Copy,
  ExternalLink,
  Share2,
  ChevronDown
} from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';
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
  const [showLinkDetails, setShowLinkDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTgLink, setCopiedTgLink] = useState(false);

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

  const effectivePartnerId = partner?.id || partnerId || 'demo-partner-1';
  const origin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://gift-x.vercel.app';
  const webAppUrl = `${origin}/?venue=${effectivePartnerId}`;
  const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'giftx2025_bot';
  const tgLink = `https://t.me/${botUsername}?start=venue_${effectivePartnerId}`;

  const handleCopyLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    triggerNotificationHaptic('success');
    navigator.clipboard.writeText(webAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTgLink = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    triggerNotificationHaptic('success');
    navigator.clipboard.writeText(tgLink);
    setCopiedTgLink(true);
    setTimeout(() => setCopiedTgLink(false), 2500);
  };

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
      } catch (err) {
        // fallback to Telegram share
      }
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
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col relative my-auto">
        {/* Верхняя визуальная плашка */}
        <div className="relative h-32 bg-gradient-to-r from-amber-500/20 via-purple-500/10 to-slate-900 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 blur-3xl rounded-full pointer-events-none" />
          
          <div className="absolute top-3 right-3 flex items-center space-x-2 z-20">
            {/* Кнопка быстрого шеринга ссылки */}
            <button
              onClick={handleShare}
              title="Поделиться ссылкой на заведение"
              className="w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-amber-400 hover:text-amber-300 flex items-center justify-center backdrop-blur-md transition-all border border-slate-800"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-slate-400 hover:text-white flex items-center justify-center backdrop-blur-md transition-all border border-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
          {/* 🌟 ПРЯМАЯ ССЫЛКА НА WEB APP ЗАВЕДЕНИЯ (СПРЯТАНА ПОД КНОПКОЙ)  */}
          {/* ============================================================== */}
          <div className="space-y-2">
            <button
              id="venue-card-webapp-link-btn"
              onClick={() => {
                triggerHaptic('medium');
                setShowLinkDetails(!showLinkDetails);
              }}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-500/10 hover:from-amber-500/25 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center justify-between transition-all shadow-md shadow-amber-500/10 active:scale-[0.99] group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                  <Link className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black text-slate-100 truncate">Прямая ссылка на Web App</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold uppercase shrink-0 border border-amber-400/30">
                      URL
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">
                    Прямой доступ непосредственно на карточку
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Скопировать ссылку"
                  className="py-1 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center space-x-1 active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-black text-amber-300">Копия</span>
                    </>
                  )}
                </button>
                <ChevronDown
                  className={`w-4 h-4 text-amber-400 transition-transform duration-200 ${
                    showLinkDetails ? 'rotate-180 text-amber-300' : ''
                  }`}
                />
              </div>
            </button>

            {/* Разворачиваемый блок с подробной ссылкой URL Web App и кнопками действий */}
            {showLinkDetails && (
              <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-amber-500/30 space-y-2.5 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                    <Link className="w-3 h-3 text-amber-400" />
                    <span>Прямой URL адрес карточки:</span>
                  </span>
                  <span className="text-slate-500 font-medium">Для браузера и шеринга</span>
                </div>

                {/* Поле с URL адресом */}
                <div className="flex items-center space-x-2 bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800">
                  <span className="text-[11px] text-amber-200 font-mono truncate flex-1 select-all">
                    {webAppUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="text-amber-400 hover:text-amber-300 p-1 transition-colors shrink-0"
                    title="Копировать"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Кнопки быстрых действий */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleCopyLink}
                    className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md ${
                      copiedLink
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Скопировано!' : 'Скопировать'}</span>
                  </button>

                  <a
                    href={webAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic('light')}
                    className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                    <span>Открыть</span>
                  </a>

                  <button
                    onClick={handleShare}
                    className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-[11px] flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Поделиться</span>
                  </button>
                </div>

                {/* Вторичный вариант: Ссылка для Telegram Mini App */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">Ссылка для Telegram Bot:</span>
                  <button
                    onClick={handleCopyTgLink}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedTgLink ? 'Скопировано!' : 'Скопировать TMA'}</span>
                  </button>
                </div>
              </div>
            )}
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

          {/* СЕКЦИЯ: Подарки этого заведения в сети GiftX */}
          {partner?.voucherOffers && partner.voucherOffers.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold text-xs">
                  ✨
                </div>
                <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                  Подарки от этого заведения в сети
                </h4>
              </div>

              <div className="space-y-2">
                {partner.voucherOffers.map((offer: any) => (
                  <div
                    key={offer.id}
                    className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start space-x-2.5"
                  >
                    <img
                      src={offer.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80'}
                      alt={offer.title}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[8px] font-extrabold uppercase text-purple-400 px-1.5 py-0.2 rounded bg-purple-500/10 border border-purple-500/20">
                          {offer.category}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-100 text-xs mt-0.5">{offer.title}</h5>
                      {offer.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{offer.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
