import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2, AlertCircle, Lock, Building2, MapPin, Navigation } from 'lucide-react';
import { ClaimedVoucher } from '../types';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

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
        setErrorMsg(data.error || 'Неверный PIN-код');
        triggerNotificationHaptic('error');
      }
    } catch (e: any) {
      setErrorMsg('Ошибка гашения: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1621]/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-sm bg-[#17212b] border border-white/10 rounded-2xl p-5 shadow-2xl relative text-center text-slate-100 space-y-4">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {redeemed ? (
          <div className="py-4 space-y-3.5">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/40 shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-extrabold text-emerald-400">Подарок Погашен!</h3>
            <p className="text-xs text-slate-300">
              Администратор {partner?.name} подтвердил списание. Пользуйтесь с удовольствием!
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#2aabee] text-white font-extrabold rounded-xl shadow-md shadow-[#2aabee]/30 cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Заголовок заведения */}
            <div className="flex items-center justify-center space-x-2 text-xs text-[#2aabee] font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{partner?.name}</span>
            </div>

            {/* Локация заведения и кнопка прокладки маршрута */}
            <div className="flex items-center justify-center space-x-2">
              <a
                href={partner?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(partner?.name + ' ' + partner?.address)}`}
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

            {/* ПЛОТНАЯ ВЫДЕЛЕННАЯ КАРТОЧКА ПОДАРКА (С ПЛОТНЫМ ФОНОМ #242f3d) */}
            <div className="bg-[#242f3d] p-3.5 rounded-xl border border-white/10 text-left space-y-2.5 shadow-lg">
              <img
                src={offer?.imageUrl}
                alt={offer?.title}
                className="w-full h-32 object-cover rounded-lg border border-white/10"
              />

              <div>
                <h3 className="font-extrabold text-slate-100 text-sm">{offer?.title}</h3>
                <p className="text-xs text-slate-300 mt-1">{offer?.description}</p>
                <div className="mt-2 text-emerald-400 font-extrabold text-sm">{offer?.discountValue}</div>
              </div>
            </div>

            {/* Уникальный QR secret код для показа администратору */}
            <div className="p-3 bg-white rounded-xl inline-block shadow-md">
              <QRCodeSVG value={voucher.qrCodeSecret} size={140} />
            </div>
            <p className="text-[11px] text-slate-400">Покажите QR администратору или введите PIN заведения</p>

            {/* Форма ввода PIN-кода администратора (демо PIN: 1234) */}
            <div className="pt-1">
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
                <div className="flex items-center justify-center space-x-1 text-xs text-red-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                disabled={loading}
                onClick={handleRedeem}
                className="mt-3 w-full py-3 bg-[#2aabee] hover:bg-[#229ed9] font-extrabold text-white rounded-xl transition-all shadow-md shadow-[#2aabee]/30 text-xs cursor-pointer active:scale-95"
              >
                {loading ? 'Проверка...' : 'Подтвердить списание'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
