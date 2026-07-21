import React, { useState, useEffect } from 'react';
import { Wallet, Clock, MapPin, Gift, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { VoucherRedeemModal } from './VoucherRedeemModal';
import { triggerHaptic, getTelegramUserData } from '../telegram';

export const WalletScreen: React.FC = () => {
  const [wallet, setWallet] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
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

  const formatRemainingTime = (expiresAtStr: string) => {
    const diffMs = new Date(expiresAtStr).getTime() - new Date().getTime();
    if (diffMs <= 0) return 'Сгорел';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${mins}м`;
  };

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24">
      {/* Шапка кошелька */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
            <Wallet className="w-4 h-4" />
            <span>Мои подарки</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">Кошелек HappyBox</h1>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-extrabold text-amber-400 text-base">
          {wallet.filter(v => v.status === 'ACTIVE').length}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Загрузка ваших подарков...</div>
      ) : wallet.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl text-center border border-slate-800 my-8">
          <Gift className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">У вас пока нет активных подарков</h3>
          <p className="text-xs text-slate-500 mt-1">Отсканируйте QR-код в заведении-партнере, чтобы получить первый HappyBox!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {wallet.map((v) => {
            const offer = v.voucherOffer;
            const partner = offer?.partner;
            const isExpired = v.status === 'EXPIRED' || new Date() > new Date(v.expiresAt);
            const isRedeemed = v.status === 'REDEEMED';

            return (
              <div
                key={v.id}
                onClick={() => {
                  if (!isExpired && !isRedeemed) {
                    triggerHaptic('light');
                    setSelectedVoucher(v);
                  }
                }}
                className={`glass-card p-4 rounded-2xl border transition-all ${
                  isRedeemed
                    ? 'border-emerald-500/20 opacity-60'
                    : isExpired
                    ? 'border-slate-800 opacity-40'
                    : 'border-slate-800 hover:border-amber-500/40 cursor-pointer shadow-lg'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <img
                    src={offer?.imageUrl}
                    alt={offer?.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 truncate">
                        {partner?.name}
                      </span>
                      
                      <div className="text-[11px] font-semibold">
                        {isRedeemed ? (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Погашен</span>
                          </span>
                        ) : isExpired ? (
                          <span className="text-slate-500">Сгорел</span>
                        ) : (
                          <span className="text-amber-400 flex items-center space-x-1 font-mono">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>{formatRemainingTime(v.expiresAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-100 text-sm mt-1 truncate">{offer?.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{offer?.description}</p>
                    
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="font-extrabold text-emerald-400 text-xs">{offer?.discountValue}</span>
                      <span className="text-[10px] text-slate-500 flex items-center space-x-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{partner?.address}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
