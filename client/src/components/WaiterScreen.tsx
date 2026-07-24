import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, QrCode, CheckCircle2, Clock, UserCheck, RefreshCw, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic } from '../telegram';

export const WaiterScreen: React.FC = () => {
  const { 
    partners, 
    selectedStaff, 
    setSelectedStaff, 
    activeQrToken, 
    tokenExpiresAt, 
    activeBoxLevel, 
    setActiveQrToken,
    claimedByGuestName,
    setClaimedByGuestName
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);

  // Обратный отсчет 3 минуты (180с)
  useEffect(() => {
    if (!tokenExpiresAt || !activeQrToken) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(tokenExpiresAt).getTime() - new Date().getTime()) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiresAt, activeQrToken]);

  // Polling статуса токена (каждые 2 секунды)
  useEffect(() => {
    if (!activeQrToken || claimedByGuestName || timeLeft <= 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/staff/token-status/${activeQrToken}`);
        const data = await res.json();
        if (data.success && data.isUsed) {
          triggerHaptic('heavy');
          setClaimedByGuestName('Гость');
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [activeQrToken, claimedByGuestName, timeLeft]);

  // Вызов API генерации токена
  const handleIssueBox = async (boxLevel: 'BASIC' | 'SILVER' | 'GOLD') => {
    if (!selectedStaff) return;
    triggerHaptic('medium');
    setLoading(true);

    try {
      const res = await fetch('/api/staff/issue-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          partnerId: selectedStaff.partnerId,
          boxLevel
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveQrToken(data.token, data.expiresAt, boxLevel);
      } else {
        alert('Ошибка генерации: ' + data.error);
      }
    } catch (e: any) {
      alert('Ошибка соединения с сервером: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'GiftXAppBot';
  const telegramAppUrl = `https://t.me/${botUsername}/app?startapp=claim_${activeQrToken}`;
  const appUrl = `${window.location.origin}/?claim=${activeQrToken}`;
  const qrCodeValue = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? appUrl : telegramAppUrl;

  // Выбор персонала, если не выбран
  if (!selectedStaff) {
    return (
      <div className="p-5 max-w-md mx-auto min-h-screen flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4">
            <UserCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">B2B Режим Официанта</h1>
          <p className="text-slate-400 text-sm mt-1">Выберите заведение и профиль сотрудника</p>
        </div>

        <div className="space-y-3">
          {partners.map((partner) => (
            <div key={partner.id} className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center space-x-3 mb-3">
                <img src={partner.logoUrl} alt={partner.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-slate-100">{partner.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {partner.category}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                {/* @ts-ignore */}
                {partner.staffMembers?.map((staff: any) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedStaff({ ...staff, partner });
                    }}
                    className="w-full text-left flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-800 transition-all text-sm font-medium"
                  >
                    <span>👤 {staff.name} ({staff.role})</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen flex flex-col justify-between pb-8">
      {/* Шапка персонала */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={selectedStaff.partner?.logoUrl} alt="Logo" className="w-11 h-11 rounded-xl object-cover border border-slate-700" />
          <div>
            <h2 className="font-bold text-slate-100 text-sm">{selectedStaff.partner?.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{selectedStaff.name}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setSelectedStaff(null)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:text-white"
        >
          Сменить
        </button>
      </div>

      {/* Экран показа QR-кода при нажатии */}
      {activeQrToken && (
        <div className="my-6">
          {claimedByGuestName ? (
            <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 text-center animate-bounce-short">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-emerald-300">🎉 Бокс успешно вручен!</h3>
              <p className="text-slate-300 text-sm mt-1">Гость отсканировал QR и получил подарки.</p>
              
              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Готово (Выдать еще)
              </button>
            </div>
          ) : timeLeft <= 0 ? (
            <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-950/20 text-center">
              <Clock className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-400">QR-код Истёк</h3>
              <p className="text-xs text-slate-400 mt-1">Время жизни токена (3 мин) прошло.</p>
              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-4 w-full py-3 bg-slate-800 text-white font-bold rounded-2xl"
              >
                Сгенерировать новый
              </button>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 text-center shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                  Уровень: {activeBoxLevel}
                </span>
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-4">
                <QRCodeSVG value={qrCodeValue} size={210} level="H" includeMargin={false} />
              </div>

              <p className="text-slate-300 text-xs font-medium">
                Попросите гостя навести камеру смартфона или отсканировать в Telegram
              </p>

              {/* Быстрая кнопка симуляции сканирования для тестирования */}
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Открыть как гость (Симуляция сканирования QR)</span>
              </a>

              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-5 text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}

      {/* Кнопки выдачи боксов для официанта */}
      {!activeQrToken && (
        <div className="space-y-3.5 my-auto py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
            Выберите бокс по сумме чека гостя:
          </p>

          <button
            disabled={loading}
            onClick={() => handleIssueBox('BASIC')}
            className="w-full p-4 rounded-2xl glass-basic border border-purple-500/40 hover:border-purple-400 flex items-center justify-between group transition-all transform active:scale-95 shadow-lg shadow-purple-500/10"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📦
              </div>
              <div className="text-left">
                <div className="font-bold text-purple-200 text-base">БАЗОВЫЙ БОКС</div>
                <div className="text-xs text-purple-300/70 font-medium">Чек до 299,000 VND</div>
              </div>
            </div>
            <QrCode className="w-6 h-6 text-purple-400" />
          </button>

          <button
            disabled={loading}
            onClick={() => handleIssueBox('SILVER')}
            className="w-full p-4 rounded-2xl glass-silver border border-cyan-500/40 hover:border-cyan-400 flex items-center justify-between group transition-all transform active:scale-95 shadow-lg shadow-cyan-500/10"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🥈
              </div>
              <div className="text-left">
                <div className="font-bold text-cyan-100 text-base">СЕРЕБРЯНЫЙ БОКС</div>
                <div className="text-xs text-cyan-300/70 font-medium">Чек: 300k - 599k VND</div>
              </div>
            </div>
            <QrCode className="w-6 h-6 text-cyan-400" />
          </button>

          <button
            disabled={loading}
            onClick={() => handleIssueBox('GOLD')}
            className="w-full p-4 rounded-2xl glass-gold border border-amber-500/50 hover:border-amber-400 flex items-center justify-between group transition-all transform active:scale-95 shadow-xl shadow-amber-500/20"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                🥇
              </div>
              <div className="text-left">
                <div className="font-bold text-gradient-gold text-base">ЗОЛОТОЙ БОКС</div>
                <div className="text-xs text-amber-300/80 font-medium">Чек от 600,000 VND</div>
              </div>
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 animate-spin-slow" />
          </button>
        </div>
      )}

      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-900">
        Выдано за смену: <span className="text-slate-300 font-bold">{selectedStaff.boxesIssuedCount} боксов</span>
      </div>
    </div>
  );
};
