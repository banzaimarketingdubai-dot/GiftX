import React, { useState, useEffect } from 'react';
import { Wallet, Clock, MapPin, Gift, CheckCircle, Sparkles, Navigation, ChevronRight, ArrowLeft, Star, ExternalLink, Building2, Link, Copy, Check } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { VoucherRedeemModal } from './VoucherRedeemModal';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';
import { useAppStore } from '../store/useAppStore';
import { getVenueImage, getVoucherImage } from '../utils/stockImages';

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

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const tgUser = getTelegramUserData();
      const res = await fetch(`/api/guest/wallet/${tgUser.id}`);
      const data = await res.json();
      if (data.success) {
        setWallet(data.wallet);
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

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 animate-fadeIn">
      {/* Шапка кошелька */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 mb-4 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
        <div className="z-10">
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Мои заведения & подарки</span>
          </div>
          <h1 className="text-xl font-black text-slate-100">Кошелек GiftX</h1>
        </div>
        <div className="z-10 w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center font-black text-amber-400 text-sm shadow-md">
          <span>{groupedActiveVenues.length}</span>
          <span className="text-[9px] text-amber-400/80 font-normal">зав.</span>
        </div>
      </div>

      {/* Кнопка возврата к списку заведений при просмотре карточки */}
      {selectedVenueId && (
        <button
          onClick={() => {
            triggerHaptic('light');
            setSelectedVenueId(null);
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center space-x-2 mb-4 transition-all shadow-md active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>← Вернуться ко всем заведениям ({groupedActiveVenues.length})</span>
        </button>
      )}

      {/* Переключатель вкладок: Активные vs Архив */}
      {!selectedVenueId && (
        <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-5 shadow-md">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('ACTIVE');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'ARCHIVE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
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
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-3">
            <div className="relative h-44 w-full">
              <img
                src={getVenueImage(currentVenueGroup.partner.logoUrl, currentVenueGroup.partner.category)}
                alt={currentVenueGroup.partner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <span className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-950/80 backdrop-blur-md border border-slate-700 text-amber-400 rounded-full">
                {currentVenueGroup.partner.category || 'HORECA'}
              </span>

              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-100 drop-shadow-md">{currentVenueGroup.partner.name}</h2>
                  <p className="text-xs text-slate-300 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{currentVenueGroup.partner.address}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 text-xs font-black shrink-0">
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
                  className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
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
                  className="py-2.5 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-md"
                >
                  {copiedVenueId === currentVenueGroup.partnerId ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 text-amber-400" />
                      <span>Прямая ссылка</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Доступных подарков:</span>
                <strong className="text-amber-400 font-extrabold">{currentVenueGroup.vouchers.length} шт.</strong>
              </div>
            </div>
          </div>

          {/* Заголовок Доступные Подарки */}
          <div className="flex items-center space-x-2 pt-2 px-1">
            <Gift className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-slate-200 text-sm">Доступные подарки в этом заведении:</h3>
          </div>

          {/* Список доступных подарков заведения */}
          <div className="space-y-3">
            {currentVenueGroup.vouchers.map((v) => {
              const offer = v.voucherOffer;
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedVoucher(v);
                  }}
                  className="glass-card p-4 rounded-2xl border border-amber-500/30 hover:border-amber-400 cursor-pointer shadow-xl transition-all active:scale-[0.99] group bg-slate-900/90 space-y-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={getVoucherImage(offer?.imageUrl, offer?.category)}
                      alt={offer?.title}
                      className="w-20 h-20 rounded-2xl object-cover border border-amber-500/40 shrink-0 group-hover:scale-105 transition-transform shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 truncate">
                          {offer?.category || 'GIFT'}
                        </span>
                        
                        <span className="text-amber-400 flex items-center space-x-1 font-mono font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>{formatRemainingTime(v.expiresAt)}</span>
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-100 text-sm mt-1.5 leading-snug">{offer?.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{offer?.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="font-black text-emerald-400 text-sm">{offer?.discountValue}</span>
                    
                    <button className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center space-x-1 shadow-md shadow-amber-500/20 transition-all">
                      <span>Забрать / Показать QR</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
          <div className="glass-card p-8 rounded-3xl text-center border border-slate-800 my-8 space-y-3">
            <Gift className="w-14 h-14 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">У вас пока нет активных заведений с подарками</h3>
            <p className="text-xs text-slate-500">Отсканируйте QR-код в заведении-партнере, чтобы открыть первый GiftX Box!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider px-1">
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
                  className="glass-card p-4 rounded-3xl border border-slate-800 hover:border-amber-500/50 cursor-pointer shadow-xl transition-all active:scale-[0.99] group bg-slate-900/90 relative overflow-hidden"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={getVenueImage(partner.logoUrl, partner.category)}
                      alt={partner.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform shadow-md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 truncate">
                          {partner.category || 'HORECA'}
                        </span>
                        
                        <div className="flex items-center space-x-1 text-xs font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{partner.googleRating || 4.8}</span>
                        </div>
                      </div>

                      <h3 className="font-black text-slate-100 text-base mt-1 truncate">{partner.name}</h3>
                      <p className="text-xs text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{partner.address}</span>
                      </p>

                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center space-x-1">
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
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
                            className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 transition-all shrink-0"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>

                          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
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
          <div className="glass-card p-8 rounded-3xl text-center border border-slate-800 my-8 space-y-3">
            <CheckCircle className="w-14 h-14 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Архив пуст</h3>
            <p className="text-xs text-slate-500">Погашенные сертификаты хранятся в архиве 30 дней перед авто-удалением из БД.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-wider mb-2">
              Погашенные сертификаты хранятся 30 дней в архиве
            </div>

            {groupedArchiveVenues.map((group) => {
              const partner = group.partner;

              return (
                <div
                  key={group.partnerId}
                  className="glass-card p-4 rounded-3xl border border-slate-800/80 bg-slate-950/60 space-y-3 opacity-85"
                >
                  <div className="flex items-center space-x-3.5 border-b border-slate-800/80 pb-3">
                    <img
                      src={getVenueImage(partner.logoUrl, partner.category)}
                      alt={partner.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 grayscale"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-200 text-sm truncate">{partner.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{partner.address}</p>
                    </div>

                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setSelectedMapPartner(partner);
                        setRole('MAP');
                      }}
                      className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center space-x-1 shrink-0"
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
                        <div key={v.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 truncate mr-2">
                            <span className="font-bold text-slate-300 truncate">{offer?.title}</span>
                            <span className="text-[10px] text-emerald-400 font-bold shrink-0">{offer?.discountValue}</span>
                          </div>

                          <div className="text-[10px] font-bold shrink-0">
                            {isRedeemed ? (
                              <span className="text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                <span>Погашен ({calculateDaysUntilPurge(v.redeemedAt)})</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg">Сгорел</span>
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
            fetchWallet();
          }}
        />
      )}
    </div>
  );
};
