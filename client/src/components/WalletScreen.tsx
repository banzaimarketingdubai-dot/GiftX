import React, { useState, useEffect } from 'react';
import { Wallet, Clock, MapPin, Gift, CheckCircle, Sparkles, Navigation, ChevronRight, ArrowLeft, Star, ExternalLink, Building2, Link, Copy, Check } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { VoucherRedeemModal } from './VoucherRedeemModal';
import { DemoBoxOpeningModal } from './DemoBoxOpeningModal';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';
import { useAppStore } from '../store/useAppStore';
import { getVenueImage, getVoucherImage, getVenueCoverImage } from '../utils/stockImages';
import { VenueAvatar } from './VenueAvatar';
import { getVoucherTier, getTierTheme } from '../utils/tierThemes';

interface GroupedVenue {
  partnerId: string;
  partner: any;
  vouchers: ClaimedVoucher[];
}

export const WalletScreen: React.FC = () => {
  const { setRole, setSelectedMapPartner } = useAppStore();
  const [wallet, setWallet] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<ClaimedVoucher | null>(null);
  const [copiedVenueId, setCopiedVenueId] = useState<string | null>(null);

  const [showDemoBoxModal, setShowDemoBoxModal] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const tgUser = getTelegramUserData();
      const res = await fetch(`/api/guest/wallet/${tgUser.id}`);
      const data = await res.json();
      let apiWallet: ClaimedVoucher[] = data.success && Array.isArray(data.wallet) ? data.wallet : [];

      // Загрузка локально сохраненных ваучеров из распакованных боксов
      try {
        const localStr = localStorage.getItem('giftx_saved_vouchers');
        const localVouchers: ClaimedVoucher[] = localStr ? JSON.parse(localStr) : [];

        const combined = [...apiWallet];
        for (const lv of localVouchers) {
          const idx = combined.findIndex((v) => v.id === lv.id);
          if (idx === -1) {
            combined.push(lv);
          } else {
            combined[idx] = lv;
          }
        }
        setWallet(combined);
      } catch (e) {
        setWallet(apiWallet);
      }
    } catch (e) {
      console.error('Wallet fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const formatRemainingTime = (expiresAtStr: string | Date) => {
    const diffMs = new Date(expiresAtStr).getTime() - new Date().getTime();
    if (diffMs <= 0) return 'Сгорел';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${mins}м`;
  };

  // Расчёт остатка дней до 30-дневного авто-удаления из БД
  const calculateDaysUntilPurge = (redeemedAtStr?: string | Date) => {
    if (!redeemedAtStr) return '30 дн.';
    const purgeDate = new Date(new Date(redeemedAtStr).getTime() + 30 * 24 * 60 * 60 * 1000);
    const diffDays = Math.max(0, Math.ceil((purgeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    return `${diffDays} дн.`;
  };

  const activeVouchers = wallet.filter(v => v.status === 'ACTIVE' && new Date() < new Date(v.expiresAt));
  const archiveVouchers = wallet.filter(v => v.status === 'REDEEMED' || v.status === 'EXPIRED' || new Date() >= new Date(v.expiresAt));

  // Группировка активных ваучеров ПО ЗАВЕДЕНИЯМ
  const groupedActiveVenues: GroupedVenue[] = Object.values(
    activeVouchers.reduce((acc, voucher) => {
      const p = voucher.voucherOffer?.partner || {
        id: 'demo-partner-1',
        name: 'Sunset Beach Club',
        category: 'HORECA',
        address: 'Phu Quoc, Long Beach',
        logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
        googleRating: 4.8,
        googleReviewsCount: 342
      };

      const key = p.id || p.name;
      if (!acc[key]) {
        acc[key] = {
          partnerId: p.id || key,
          partner: p,
          vouchers: []
        };
      }
      acc[key].vouchers.push(voucher);
      return acc;
    }, {} as Record<string, GroupedVenue>)
  );

  // Группировка архива ПО ЗАВЕДЕНИЯМ
  const groupedArchiveVenues: GroupedVenue[] = Object.values(
    archiveVouchers.reduce((acc, voucher) => {
      const p = voucher.voucherOffer?.partner || {
        id: 'demo-partner-1',
        name: 'Sunset Beach Club',
        category: 'HORECA',
        address: 'Phu Quoc, Long Beach',
        logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
        googleRating: 4.8
      };

      const key = p.id || p.name;
      if (!acc[key]) {
        acc[key] = {
          partnerId: p.id || key,
          partner: p,
          vouchers: []
        };
      }
      acc[key].vouchers.push(voucher);
      return acc;
    }, {} as Record<string, GroupedVenue>)
  );

  // Текущее выбранное заведение
  const currentVenueGroup = groupedActiveVenues.find(g => g.partnerId === selectedVenueId) || 
                            groupedArchiveVenues.find(g => g.partnerId === selectedVenueId);

  const handleCreateDemoVoucher = () => {
    triggerHaptic('medium');
    triggerNotificationHaptic('success');
    const demoVoucher: ClaimedVoucher = {
      id: 'demo-claimed-' + Date.now(),
      userId: 'demo-user-1',
      voucherOfferId: 'demo-offer-1',
      status: 'ACTIVE',
      claimedAt: new Date(),
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      qrCodeSecret: 'demo-secret-' + Date.now(),
      voucherOffer: {
        id: 'demo-offer-1',
        partnerId: 'demo-partner-1',
        title: '🍹 Бесплатный Авторский Коктейль',
        description: 'Приветственный фирменный коктейль от шеф-бармена при посещении Sunset Beach Club',
        category: 'TRAFFIC_MAGNET',
        imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
        validityHours: 72,
        discountValue: '100% FREE',
        totalLimit: 100,
        claimedCount: 10,
        partner: {
          id: 'demo-partner-1',
          name: 'Sunset Beach Club',
          category: 'HORECA',
          address: 'Long Beach, St 4, Phu Quoc',
          logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',
          googleRating: 4.8,
          googleReviewsCount: 342,
          workingHours: '10:00 - 23:00'
        }
      }
    };
    setWallet((prev) => [demoVoucher, ...prev]);
    setSelectedVenueId('demo-partner-1');
  };

  return (
    <div 
      className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 animate-fadeIn font-sans"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 0px) + 72px)'
      }}
    >
      {/* Шапка кошелька (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 mb-4 flex items-center justify-between shadow-md relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center space-x-2 text-[10px] text-[#2aabee] font-bold uppercase tracking-wider mb-1">
            <Wallet className="w-3.5 h-3.5" />
            <span>Мои заведения & подарки</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-100">Кошелек GiftX</h1>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowDemoBoxModal(true);
          }}
          className="z-10 px-3.5 py-1.5 rounded-xl bg-[#2aabee]/15 border border-[#2aabee]/30 text-[#2aabee] font-bold text-[11px] hover:bg-[#2aabee]/25 transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#2aabee]" />
          <span>🎁 Открыть 3D-Бокс</span>
        </button>
      </div>

      {/* Кнопка возврата к списку заведений при просмотре карточки */}
      {selectedVenueId && (
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedVenueId(null);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-[#242f3d] border border-white/5 text-slate-200 hover:text-white font-bold text-xs flex items-center space-x-2 mb-4 transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2aabee]" />
          <span>← Вернуться ко всем заведениям ({groupedActiveVenues.length})</span>
        </button>
      )}

      {/* Переключатель вкладок: Активные vs Архив (ТЕЛЕГРАМ СТИЛЬ) */}
      {!selectedVenueId && (
        <div className="flex bg-[#17212b] p-1.5 rounded-2xl border border-white/5 mb-4 shadow-md">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ACTIVE');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Заведения ({groupedActiveVenues.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ARCHIVE');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'ARCHIVE'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Архив ({groupedArchiveVenues.length})</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium animate-pulse">Загрузка ваших заведений и подарков...</div>
      ) : selectedVenueId && currentVenueGroup ? (
        /* =================================================== */
        /* ДЕТАЛЬНАЯ КАРТОЧКА ВЫБРАННОГО ЗАВЕДЕНИЯ С ПОДАРКАМИ */
        /* =================================================== */
        <div className="space-y-4 animate-fadeIn">
          {/* Обложка и инфо карточка Заведения */}
          <div className="bg-[#17212b] rounded-2xl border border-white/5 overflow-hidden shadow-xl space-y-3">
            <div className="relative h-44 w-full">
              <img
                src={getVenueCoverImage(currentVenueGroup.partner.coverUrl, currentVenueGroup.partner.category)}
                alt={currentVenueGroup.partner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#17212b] via-[#17212b]/40 to-transparent" />
              
              <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#17212b]/90 backdrop-blur-md border border-white/10 text-[#2aabee] rounded-full">
                {currentVenueGroup.partner.category || 'HORECA'}
              </span>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-100 drop-shadow-md">{currentVenueGroup.partner.name}</h2>
                  <p className="text-xs text-slate-300 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2aabee] shrink-0" />
                    <span className="truncate">{currentVenueGroup.partner.address}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentVenueGroup.partner.googleRating || 4.8}</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 space-y-3">
              {/* Кнопки Маршрута и Прямой ссылки на карточку заведения */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedMapPartner(currentVenueGroup.partner);
                    setRole('MAP');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-[#2aabee]/30 transition-all active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 text-white" />
                  <span>🧭 Маршрут</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    triggerNotificationHaptic('success');
                    const origin = typeof window !== 'undefined' && window.location?.origin
                      ? window.location.origin
                      : 'https://gift-x.vercel.app';
                    const venueId = currentVenueGroup.partner.id || currentVenueGroup.partnerId;
                    const url = `${origin}/?venue=${venueId}`;
                    navigator.clipboard.writeText(url);
                    setCopiedVenueId(currentVenueGroup.partnerId);
                    setTimeout(() => setCopiedVenueId(null), 2500);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] border border-white/5 text-[#2aabee] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  {copiedVenueId === currentVenueGroup.partnerId ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 text-[#2aabee]" />
                      <span>Прямая ссылка</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Доступных подарков:</span>
                <strong className="text-[#2aabee] font-bold">{currentVenueGroup.vouchers.length} шт.</strong>
              </div>
            </div>
          </div>

          {/* Заголовок Доступные Подарки */}
          <div className="flex items-center space-x-2 pt-1 px-1">
            <Gift className="w-4 h-4 text-[#2aabee]" />
            <h3 className="font-bold text-slate-200 text-xs">Доступные подарки в этом заведении:</h3>
          </div>

          {/* Список доступных подарков заведения (ОКРАШЕННЫЕ В ЦВЕТА КЛАССОВ SILVER, GOLD, PLATINUM) */}
          <div className="space-y-3">
            {currentVenueGroup.vouchers.map((v) => {
              const offer = v.voucherOffer;
              const tier = getVoucherTier(v);
              const theme = getTierTheme(tier);

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedVoucher(v);
                  }}
                  className={`${theme.cardBg} p-4.5 rounded-2xl border-2 ${theme.border} cursor-pointer shadow-xl transition-all active:scale-[0.99] group space-y-3 relative overflow-hidden`}
                >
                  {/* Верхняя светящаяся полоса тира */}
                  <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.topBar}`} />

                  <div className="flex items-start space-x-3.5">
                    <img
                      src={getVoucherImage(offer?.imageUrl, offer?.category)}
                      alt={offer?.title}
                      className="w-18 h-18 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full ${theme.badgeBg} truncate`}>
                          {theme.badgeLabel}
                        </span>
                        
                        <span className="text-slate-300 flex items-center space-x-1 font-mono font-bold text-xs bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-white/10">
                          <Clock className="w-3 h-3 text-[#2aabee] animate-pulse" />
                          <span>{formatRemainingTime(v.expiresAt)}</span>
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-100 text-sm mt-1.5 leading-snug">{offer?.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2 mt-1">{offer?.description}</p>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                    <span className={`font-extrabold text-sm ${theme.accentText}`}>{offer?.discountValue}</span>
                    
                    <button className="py-2 px-3.5 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white text-xs font-black flex items-center space-x-1 shadow-md shadow-[#2aabee]/30 transition-all cursor-pointer">
                      <span>Забрать / Показать QR</span>
                      <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'ACTIVE' ? (
        /* ========================================= */
        /* СПИСОК ЗАВЕДЕНИЙ С ДОСТУПНЫМИ ПОДАРКАМИ */
        /* ========================================= */
        groupedActiveVenues.length === 0 ? (
          <div className="bg-[#17212b] p-6 rounded-2xl text-center border border-white/5 my-6 space-y-3 shadow-md">
            <Gift className="w-12 h-12 text-[#2aabee] mx-auto animate-bounce" />
            <h3 className="text-sm font-extrabold text-slate-100">У вас пока нет активных заведений с подарками</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Отсканируйте QR-код официанта в заведении или нажмите кнопку ниже, чтобы открыть интерактивный 3D-Бокс и получить первые подарки!
            </p>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowDemoBoxModal(true);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-extrabold text-xs shadow-md shadow-[#2aabee]/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>🎁 Открыть 3D-Бокс и получить подарки</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-1">
              Выберите заведение для получения подарка:
            </div>

            {groupedActiveVenues.map((group) => {
              const partner = group.partner;
              const giftsCount = group.vouchers.length;

              return (
                <div
                  key={group.partnerId}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedVenueId(group.partnerId);
                  }}
                  className="bg-[#17212b] hover:bg-[#1f2c3a] p-4 rounded-2xl border border-white/5 cursor-pointer shadow-md transition-all active:scale-[0.99] group relative overflow-hidden"
                >
                  <div className="flex items-center space-x-4">
                    <VenueAvatar
                      logoUrl={partner.logoUrl}
                      name={partner.name}
                      className="w-18 h-18 text-lg rounded-2xl border border-white/10 shrink-0 group-hover:scale-105 transition-transform shadow-md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-[#2aabee] px-2 py-0.5 rounded-full bg-[#2aabee]/10 border border-[#2aabee]/20 truncate">
                          {partner.category || 'HORECA'}
                        </span>
                        
                        <a
                          href={partner.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(partner.name + ' ' + (partner.address || ''))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerHaptic('light');
                          }}
                          className="flex items-center space-x-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full hover:bg-amber-500/20 transition-all cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{partner.googleRating || 4.8} ↗</span>
                        </a>
                      </div>

                      <h3 className="font-extrabold text-slate-100 text-sm mt-1 truncate">{partner.name}</h3>
                      <p className="text-xs text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{partner.address}</span>
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs font-bold text-[#2aabee] bg-[#2aabee]/10 border border-[#2aabee]/20 px-2.5 py-1 rounded-full flex items-center space-x-1">
                          <Gift className="w-3.5 h-3.5 text-[#2aabee]" />
                          <span>{giftsCount} {giftsCount === 1 ? 'подарок' : giftsCount < 5 ? 'подарка' : 'подарков'}</span>
                        </span>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerHaptic('medium');
                              setSelectedMapPartner(partner);
                              setRole('MAP');
                            }}
                            title="Посмотреть на карте"
                            className="p-2 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] border border-white/5 text-[#2aabee] transition-all shrink-0 cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>

                          <div className="p-2 rounded-xl bg-[#242f3d] text-slate-300 group-hover:bg-[#2aabee] group-hover:text-white transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ===================================== */
        /* ВКЛАДКА АРХИВА (ГРУППИРОВКА ПО ЗАВЕДЕНИЯМ) */
        /* ===================================== */
        groupedArchiveVenues.length === 0 ? (
          <div className="bg-[#17212b] p-8 rounded-2xl text-center border border-white/5 my-8 space-y-3 shadow-md">
            <CheckCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">Архив пуст</h3>
            <p className="text-xs text-slate-400">Погашенные сертификаты хранятся в архиве 30 дней перед авто-удалением из БД.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-wider mb-2">
              Погашенные сертификаты хранятся 30 дней в архиве
            </div>

            {groupedArchiveVenues.map((group) => {
              const partner = group.partner;

              return (
                <div
                  key={group.partnerId}
                  className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md opacity-90"
                >
                  <div className="flex items-center space-x-3.5 border-b border-white/5 pb-3">
                    <img
                      src={getVenueImage(partner.logoUrl, partner.category)}
                      alt={partner.name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 grayscale"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-200 text-sm truncate">{partner.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{partner.address}</p>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setSelectedMapPartner(partner);
                        setRole('MAP');
                      }}
                      className="p-2 rounded-xl bg-[#242f3d] border border-white/5 text-[#2aabee] text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Карта</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.vouchers.map((v) => {
                      const offer = v.voucherOffer;
                      const isRedeemed = v.status === 'REDEEMED';

                      return (
                        <div key={v.id} className="p-2.5 rounded-xl bg-[#242f3d] border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate mr-2">
                            <span className="font-bold text-slate-300 truncate">{offer?.title}</span>
                            <span className="text-[10px] text-emerald-400 font-bold shrink-0">{offer?.discountValue}</span>
                          </div>

                          <div className="text-[10px] font-bold shrink-0">
                            {isRedeemed ? (
                              <span className="text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                <span>Погашен ({calculateDaysUntilPurge(v.redeemedAt)})</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Сгорел</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Модальное окно гашения ваучера */}
      {selectedVoucher && (
        <VoucherRedeemModal
          voucher={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          onRedeemedSuccess={() => {
            try {
              const localStr = localStorage.getItem('giftx_saved_vouchers');
              const localVouchers: ClaimedVoucher[] = localStr ? JSON.parse(localStr) : [];
              const updatedLocal = localVouchers.map((v) =>
                v.id === selectedVoucher.id
                  ? { ...v, status: 'REDEEMED' as const, redeemedAt: new Date() }
                  : v
              );
              localStorage.setItem('giftx_saved_vouchers', JSON.stringify(updatedLocal));
            } catch (e) {}
            fetchWallet();
          }}
        />
      )}

      {/* Модальное окно открытия 3D-Бокса */}
      {showDemoBoxModal && (
        <DemoBoxOpeningModal
          onClose={() => {
            setShowDemoBoxModal(false);
            fetchWallet();
          }}
        />
      )}
    </div>
  );
};
