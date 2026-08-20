import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2, AlertCircle, Lock, Building2, MapPin, Navigation } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { getVoucherTier, getTierTheme } from '../utils/tierThemes';

interface VoucherRedeemModalProps {
  voucher: ClaimedVoucher;
  onClose: () => void;
  onRedeemedSuccess: () => void;
}

export const VoucherRedeemModal: React.FC<VoucherRedeemModalProps> = ({
  voucher,
  onClose,
  onRedeemedSuccess
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(voucher.status === 'REDEEMED');

  const offer = voucher.voucherOffer;
  const partner = offer?.partner;
  const tier = getVoucherTier(voucher);
  const theme = getTierTheme(tier);

  // Polling проверки статуса гашения в реальном времени (каждые 2 секунды)
  React.useEffect(() => {
    if (redeemed || !voucher.qrCodeSecret) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/guest/voucher-status/${voucher.qrCodeSecret}`);
        const data = await res.json();
        if (data.success && data.status === 'REDEEMED') {
          triggerNotificationHaptic('success');
          setRedeemed(true);
          onRedeemedSuccess();
        }
      } catch (e) {
        console.warn('Voucher status poll error:', e);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [voucher.qrCodeSecret, redeemed]);

  const handleRedeem = async () => {
    if (!pin || pin.length < 4) {
      setErrorMsg('Введите 4-значный PIN-код');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    triggerHaptic('medium');

    // Если введен демо-PIN 1234
    if (pin === '1234') {
      setTimeout(() => {
        setRedeemed(true);
        triggerNotificationHaptic('success');
        onRedeemedSuccess();
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('/api/guest/redeem-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeSecret: voucher.qrCodeSecret,
          pinCode: pin
        })
      });

      const data = await res.json();
      if (data.success) {
        setRedeemed(true);
        triggerNotificationHaptic('success');
        onRedeemedSuccess();
      } else {
        setErrorMsg(data.error || 'Неверный PIN-код (попробуйте 1234)');
        triggerNotificationHaptic('error');
      }
    } catch (e: any) {
      if (pin === '1234') {
        setRedeemed(true);
        triggerNotificationHaptic('success');
        onRedeemedSuccess();
      } else {
        setErrorMsg('Ошибка гашения: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoRedeem = () => {
    triggerHaptic('medium');
    setPin('1234');
    setTimeout(() => {
      setRedeemed(true);
      triggerNotificationHaptic('success');
      onRedeemedSuccess();
    }, 400);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0e1621]/90 backdrop-blur-md animate-fadeIn font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#17212b] border border-white/10 rounded-2xl shadow-2xl relative text-center text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Кнопка и Шапка Закрытия */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-white/10 bg-[#1e2c3a]/60 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-[#2aabee] font-extrabold uppercase tracking-wider min-w-0 pr-2">
            <Building2 className="w-4 h-4 text-[#2aabee] shrink-0" />
            <span className="truncate">{partner?.name || 'Заведение'}</span>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer shrink-0 active:scale-95 shadow-md"
            title="Закрыть модальное окно"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Скроллируемая область контента */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3.5">
          {redeemed ? (
            <div className="py-4 space-y-3.5">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40 shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-extrabold text-emerald-400">🎉 Подарок Погашен!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Администратор заведения «{partner?.name || 'Sunset Beach Club'}» подтвердил списание. Подарок перенесен в Архив.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-[#2aabee] text-white font-extrabold rounded-xl shadow-md shadow-[#2aabee]/30 cursor-pointer hover:bg-[#229ed9] transition-all"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Локация заведения и кнопка прокладки маршрута */}
              <div className="flex items-center justify-center space-x-2">
                <a
                  href={partner?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent((partner?.name || '') + ' ' + (partner?.address || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-[11px] text-[#2aabee] font-bold bg-[#242f3d] border border-white/5 py-1.5 px-3 rounded-xl hover:bg-[#2b394a] transition-all truncate max-w-[65%]"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#2aabee]" />
                  <span className="truncate">{partner?.address}</span>
                </a>

                <a
                  href={partner?.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${partner?.lat || 10.1982},${partner?.lng || 103.9634}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Маршрут в навигаторе устройства"
                  className="inline-flex items-center space-x-1 text-xs text-white font-extrabold bg-[#2aabee] hover:bg-[#229ed9] py-1.5 px-3 rounded-xl shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-white" />
                  <span>Маршрут</span>
                </a>
              </div>

              {/* ВЫДЕЛЕННАЯ КАРТОЧКА ПОДАРКА (В СТИЛЕ КЛАССА SILVER / GOLD / PLATINUM) */}
              <div className={`${theme.cardBg} p-3 rounded-xl border-2 ${theme.border} text-left space-y-2 shadow-lg relative overflow-hidden`}>
                <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.topBar}`} />
                <div className="flex items-center justify-between z-10 pt-1">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${theme.badgeBg}`}>
                    {theme.badgeLabel}
                  </span>
                  <span className={`font-extrabold text-sm ${theme.accentText}`}>{offer?.discountValue}</span>
                </div>
                {offer?.imageUrl && (
                  <img
                    src={offer.imageUrl}
                    alt={offer?.title}
                    className="w-full h-28 object-cover rounded-lg border border-white/10 shadow-md"
                  />
                )}

                <div>
                  <h3 className="font-extrabold text-slate-100 text-sm">{offer?.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{offer?.description}</p>
                </div>
              </div>

              {/* Уникальный QR secret код для показа администратору */}
              <div className="p-2.5 bg-white rounded-xl inline-block shadow-md">
                <QRCodeSVG value={voucher.qrCodeSecret || 'demo-qr-secret'} size={135} />
              </div>
              <p className="text-[11px] text-slate-400">Покажите QR сотруднику или введите PIN заведения</p>

              {/* Форма ввода PIN-кода администратора (демо PIN: 1234) */}
              <div className="pt-1 space-y-2">
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="PIN администратора (1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#242f3d] border border-white/10 rounded-xl text-center font-mono text-base text-white focus:outline-none focus:border-[#2aabee] tracking-widest placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                {errorMsg && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-red-400 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  disabled={loading}
                  onClick={handleRedeem}
                  className="w-full py-3 bg-[#2aabee] hover:bg-[#229ed9] font-extrabold text-white rounded-xl transition-all shadow-md shadow-[#2aabee]/30 text-xs cursor-pointer active:scale-95"
                >
                  {loading ? 'Проверка...' : 'Подтвердить списание (PIN 1234)'}
                </button>

                {/* Тестовая кнопка гашения в 1 клик */}
                <button
                  onClick={handleQuickDemoRedeem}
                  className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <span>🧪 Тестовое гашение в 1 клик (PIN 1234)</span>
                </button>

                {/* Кнопка закрытия внизу формы */}
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Закрыть окно
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
