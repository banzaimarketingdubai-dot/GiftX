import React, { useState, useEffect } from 'react';
import { Wallet, Clock, MapPin, Gift, CheckCircle, Sparkles, AlertCircle, Navigation } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { VoucherRedeemModal } from './VoucherRedeemModal';
import { triggerHaptic, getTelegramUserData } from '../telegram';
import { useAppStore } from '../store/useAppStore';

export const WalletScreen: React.FC = () => {
  const { setRole, setSelectedMapPartner } = useAppStore();
  const [wallet, setWallet] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [selectedVoucher, setSelectedVoucher] = useState<ClaimedVoucher | null>(null);

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

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100">
      {/* Шапка кошелька */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 mb-4 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Мои подарки</span>
          </div>
          <h1 className="text-xl font-black text-slate-100">Кошелек GiftX</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-amber-400 text-base">
          {activeVouchers.length}
        </div>
      </div>

      {/* Переключатель вкладок: Активные vs Архив (30 дней хранения) */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-5 shadow-md">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('ACTIVE');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'ACTIVE'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Активные ({activeVouchers.length})</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('ARCHIVE');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'ARCHIVE'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Архив (30 дн.) ({archiveVouchers.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">Загрузка ваших подарков...</div>
      ) : activeTab === 'ACTIVE' ? (
        activeVouchers.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center border border-slate-800 my-8 space-y-3">
            <Gift className="w-14 h-14 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">У вас пока нет активных подарков</h3>
            <p className="text-xs text-slate-500">Отсканируйте QR-код в заведении-партнере, чтобы получить первый GiftX Box!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeVouchers.map((v) => {
              const offer = v.voucherOffer;
              const partner = offer?.partner;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedVoucher(v);
                  }}
                  className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 cursor-pointer shadow-xl transition-all active:scale-[0.99] group"
                >
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={offer?.imageUrl}
                      alt={offer?.title}
                      className="w-16 h-16 rounded-xl object-cover border border-amber-500/30 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 truncate">
                          {partner?.name}
                        </span>
                        
                        <div className="text-[11px] font-semibold">
                          <span className="text-amber-400 flex items-center space-x-1 font-mono font-bold">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>{formatRemainingTime(v.expiresAt)}</span>
                          </span>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-slate-100 text-sm mt-1 truncate">{offer?.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{offer?.description}</p>
                      
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="font-black text-emerald-400 text-xs">{offer?.discountValue}</span>
                        
                        <div className="flex items-center space-x-1.5">
                          {partner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('medium');
                                setSelectedMapPartner(partner);
                                setRole('MAP');
                              }}
                              title="Посмотреть маршрут к заведению на карте"
                              className="py-1 px-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold flex items-center space-x-1 transition-all"
                            >
                              <Navigation className="w-3 h-3 text-blue-400" />
                              <span>Маршрут</span>
                            </button>
                          )}

                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg flex items-center space-x-1">
                            <span>Показать QR</span>
                          </span>
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
        /* Вкладка Архивированных подарков (Погашенные & Сгоревшие с авто-удалением 30 дней) */
        archiveVouchers.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center border border-slate-800 my-8 space-y-3">
            <CheckCircle className="w-14 h-14 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">Архив пуст</h3>
            <p className="text-xs text-slate-500">Погашенные сертификаты хранятся в архиве 30 дней перед авто-удалением из БД.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-wider mb-2">
              Погашенные сертификаты хранятся 30 дней в архиве
            </div>

            {archiveVouchers.map((v) => {
              const offer = v.voucherOffer;
              const partner = offer?.partner;
              const isRedeemed = v.status === 'REDEEMED';

              return (
                <div
                  key={v.id}
                  className={`glass-card p-4 rounded-2xl border transition-all ${
                    isRedeemed ? 'border-emerald-500/20 bg-slate-900/40 opacity-80' : 'border-slate-800/60 opacity-50'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <img
                      src={offer?.imageUrl}
                      alt={offer?.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0 grayscale"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 truncate">
                          {partner?.name}
                        </span>
                        
                        <div className="flex items-center space-x-1.5">
                          {partner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('medium');
                                setSelectedMapPartner(partner);
                                setRole('MAP');
                              }}
                              title="Посмотреть маршрут"
                              className="py-0.5 px-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold flex items-center space-x-1"
                            >
                              <Navigation className="w-3 h-3 text-blue-400" />
                              <span>Карта</span>
                            </button>
                          )}

                          <div className="text-[10px] font-bold">
                            {isRedeemed ? (
                              <span className="text-emerald-400 flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                <span>Погашен</span>
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded-lg">Сгорел</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <h4 className="font-extrabold text-slate-300 text-xs mt-1 truncate">{offer?.title}</h4>
                      
                      <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                        <span className="font-extrabold text-slate-400">{offer?.discountValue}</span>
                        
                        {isRedeemed && (
                          <span className="text-slate-400 font-mono">
                            Удаление через: <span className="text-amber-400 font-bold">{calculateDaysUntilPurge(v.redeemedAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>
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
