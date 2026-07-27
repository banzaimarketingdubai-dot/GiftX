import React, { useState, useEffect } from 'react';
import { QrCode, X, Sparkles, AlertTriangle, Check, Camera, ShieldCheck } from 'lucide-react';
import { tg, triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface QrScannerModalProps {
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Извлечение токена из отсканированного текста/ссылки
  const extractToken = (text: string): string | null => {
    if (!text) return null;
    const cleanText = text.trim();

    // 1. Поиск claim_ в Telegram start/startapp ссылках
    const claimMatch = cleanText.match(/claim_([a-zA-Z0-9_-]+)/);
    if (claimMatch && claimMatch[1]) return claimMatch[1];

    // 2. Поиск ?claim=TOKEN в обычных URL
    const urlMatch = cleanText.match(/[?&]claim=([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];

    // 3. Если передан чистый UUID / токен
    if (/^[a-zA-Z0-9_-]{8,}$/.test(cleanText) && !cleanText.includes('http')) {
      return cleanText;
    }

    return null;
  };

  const handleScanResult = (scannedText: string) => {
    const token = extractToken(scannedText);
    if (token) {
      triggerNotificationHaptic('success');
      onScanSuccess(token);
    } else {
      triggerNotificationHaptic('error');
      setError('Не удалось распознать QR-код GiftX. Проверьте правильность кода.');
    }
  };

  // Вызов нативного сканера Telegram если доступен
  useEffect(() => {
    if (tg?.showScanQrPopup) {
      try {
        tg.showScanQrPopup(
          { text: 'Наведите камеру на QR-код официанта' },
          (text: string) => {
            if (text) {
              handleScanResult(text);
              tg.closeScanQrPopup();
              return true;
            }
            return false;
          }
        );
      } catch (e) {
        console.warn('Native Telegram QR popup error', e);
      }
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    const token = extractToken(manualToken);
    if (token) {
      triggerNotificationHaptic('success');
      onScanSuccess(token);
    } else {
      triggerNotificationHaptic('error');
      setError('Неверный формат токена или ссылки');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
        {/* Кнопка закрытия */}
        <button
          onClick={() => {
            triggerHaptic('light');
            if (tg?.closeScanQrPopup) tg.closeScanQrPopup();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Шапка сканера */}
        <div className="text-center space-y-1.5 pt-2 z-10">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-1">
            <Camera className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-slate-100">Сканер QR-кода Официанта</h3>
          <p className="text-xs text-slate-400">Наведите камеру на QR-код с экрана официанта</p>
        </div>

        {/* Анимированная рамка видоискателя сканера */}
        <div className="my-auto relative flex items-center justify-center py-6">
          <div className="w-56 h-56 rounded-3xl border-2 border-dashed border-amber-500/60 relative overflow-hidden flex items-center justify-center bg-slate-950/60 shadow-inner">
            {/* Анимированный лазерный луч сканирования */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-scan-line" />

            <div className="text-center space-y-2 p-4 pointer-events-none">
              <QrCode className="w-16 h-16 text-amber-400/40 mx-auto animate-pulse" />
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                Сканирование...
              </span>
            </div>

            {/* Уголки рамки */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br" />
          </div>
        </div>

        {/* Ошибка если код не совпал */}
        {error && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium text-center mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Ручной ввод токена или симуляция для веб-тестов */}
        <div className="space-y-2 z-10 pt-2 border-t border-slate-800/80">
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Вставьте ссылку или токен..."
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20"
            >
              ОК
            </button>
          </form>

          {/* Быстрая демо-симуляция */}
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onScanSuccess(`demo_${Date.now()}`);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Симуляция сканирования QR (Тестовый бокс)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
