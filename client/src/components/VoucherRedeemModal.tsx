import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle2, AlertCircle, Lock, Building2, MapPin } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-sm rounded-3xl border border-slate-800 p-6 relative shadow-2xl text-center">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {redeemed ? (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400">Подарок Погашен!</h3>
            <p className="text-xs text-slate-300">
              Администратор {partner?.name} подтвердил списание. Пользуйтесь с удовольствием!
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-2xl mt-4"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Заголовок заведения */}
            <div className="flex items-center justify-center space-x-2 text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>{partner?.name}</span>
            </div>

            {/* Локация заведения на Google Maps */}
            <a
              href={partner?.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(partner?.name + ' ' + partner?.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 py-1.5 px-3 rounded-xl hover:bg-amber-500/20 transition-all truncate max-w-full"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{partner?.address}</span>
            </a>

            <img
              src={offer?.imageUrl}
              alt={offer?.title}
              className="w-full h-32 object-cover rounded-2xl border border-slate-800"
            />

            <div>
              <h3 className="font-bold text-slate-100 text-base">{offer?.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{offer?.description}</p>
              <div className="mt-2 text-emerald-400 font-extrabold text-sm">{offer?.discountValue}</div>
            </div>

            {/* Уникальный QR secret код для показа администратору */}
            <div className="p-3 bg-white rounded-2xl inline-block my-2">
              <QRCodeSVG value={voucher.qrCodeSecret} size={150} />
            </div>
            <p className="text-[11px] text-slate-400">Покажите QR администратору или введите PIN заведения</p>

            {/* Форма ввода PIN-кода администратора (демо PIN: 1234) */}
            <div className="pt-2">
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  placeholder="PIN администратора (1234)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-lg text-white focus:outline-none focus:border-amber-500 tracking-widest placeholder:text-xs placeholder:font-sans placeholder:tracking-normal"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
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
                className="mt-3 w-full py-3.5 bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-sm"
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
