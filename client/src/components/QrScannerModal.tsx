import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Sparkles, AlertTriangle, Check, Camera, ShieldCheck, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { tg, triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface QrScannerModalProps {
  onClose: () => void;
  onScanSuccess: (token: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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

  // Вызов сканера (Telegram native или HTML5 Web Camera)
  useEffect(() => {
    let mounted = true;

    if (tg?.showScanQrPopup) {
      try {
        tg.showScanQrPopup(
          { text: 'Наведите камеру на QR-код официанта' },
          (text: string) => {
            if (text) {
              handleScanResult(text);
              try { tg.closeScanQrPopup(); } catch {}
              onClose();
              return true;
            } else {
              try { tg.closeScanQrPopup(); } catch {}
              onClose();
              return true;
            }
          }
        );
        return;
      } catch (e) {
        console.warn('Native Telegram QR popup error, fallback to HTML5 scanner', e);
      }
    }

    // Инициализация HTML5 Web-камеры для браузерной версии
    const qrRegionId = 'html5-qr-reader';
    const html5QrCode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
        },
        (decodedText) => {
          if (!mounted) return;
          handleScanResult(decodedText);
          html5QrCode.stop().catch((e) => console.warn('Scanner stop error', e));
          onClose();
        },
        () => {
          // Игнорируем ошибки каждого кадра до тех пор, пока QR не попал в видоискатель
        }
      )
      .then(() => {
        if (mounted) setIsCameraActive(true);
      })
      .catch((err) => {
        console.warn('HTML5 Camera QR initialization error:', err);
        if (mounted) {
          setCameraError('Камера недоступна. Предоставьте доступ к камере или введите код вручную.');
        }
      });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((e) => console.warn('Cleanup scanner stop error', e));
        }
      }
    };
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

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerHaptic('light');

    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch((err) => console.warn('Error stopping scanner:', err));
    }

    try {
      if (tg?.closeScanQrPopup) {
        tg.closeScanQrPopup();
      } else if (typeof (window as any).Telegram?.WebApp?.closeScanQrPopup === 'function') {
        (window as any).Telegram.WebApp.closeScanQrPopup();
      }
    } catch (err) {
      console.warn('Error closing native QR popup:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px] cursor-default"
      >
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-all z-10 hover:bg-slate-700 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Шапка сканера */}
        <div className="text-center space-y-1.5 pt-2 z-10">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-1">
            <Camera className="w-7 h-7 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-slate-100">Сканер QR-кода Официанта</h3>
          <p className="text-xs text-slate-400">Наведите камеру смартфона на QR-код заведения</p>
        </div>

        {/* Инструкция для гостя — как попросить QR у официанта */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1 my-2 z-10 shadow-md text-left">
          <div className="flex items-center space-x-1.5 font-extrabold text-[11px] uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Как получить подарки:</span>
          </div>
          <p className="text-[11px] text-slate-200 leading-relaxed">
            💡 Находясь в заведении, скажите официанту при оплате счета: <br/>
            <span className="font-extrabold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block mt-1">
              «Покажите QR-код GiftX для подарка»
            </span>
          </p>
        </div>

        {/* Анимированный элемент видоискателя с встроенным контейнером html5-qrcode */}
        <div className="my-auto relative flex items-center justify-center py-2 z-10">
          <div className="w-60 h-60 rounded-3xl border-2 border-dashed border-amber-500/60 relative overflow-hidden bg-slate-950/80 shadow-inner flex items-center justify-center">
            {/* Контейнер HTML5 видеопотока */}
            <div id="html5-qr-reader" className="w-full h-full object-cover overflow-hidden rounded-2xl" />

            {/* Заглушка сканирования если видео еще грузится или не запущено */}
            {!isCameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 space-y-2 p-4 text-center">
                <QrCode className="w-12 h-12 text-amber-400/60 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  Запуск веб-камеры...
                </span>
              </div>
            )}

            {/* Ошибка доступа к камере */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 space-y-2 p-4 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <span className="text-[11px] text-amber-200 font-semibold">{cameraError}</span>
              </div>
            )}

            {/* Анимированный лазерный луч сканирования при активной камере */}
            {isCameraActive && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-scan-line pointer-events-none" />
            )}

            {/* Уголки рамки */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-400 rounded-tl pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-400 rounded-tr pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-400 rounded-bl pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-400 rounded-br pointer-events-none" />
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
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20 active:scale-95"
            >
              ОК
            </button>
          </form>

          {/* Быстрая демо-симуляция */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('heavy');
              onScanSuccess(`demo_${Date.now()}`);
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Симуляция сканирования QR (Тестовый бокс)</span>
          </button>

          {/* Явная кнопка закрытия модалки */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            Закрыть сканер
          </button>
        </div>
      </div>
    </div>
  );
};
