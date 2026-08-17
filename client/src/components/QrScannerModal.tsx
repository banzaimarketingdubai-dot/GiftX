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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1621]/85 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#17212b] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px] cursor-default font-sans"
      >
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all z-10 active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Шапка сканера */}
        <div className="text-center space-y-1.5 pt-2 z-10">
          <div className="inline-flex p-3 bg-[#2aabee]/15 border border-[#2aabee]/30 rounded-full mb-1">
            <Camera className="w-7 h-7 text-[#2aabee] animate-pulse" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-100">Сканер QR-кода Официанта</h3>
          <p className="text-xs text-slate-400">Наведите камеру смартфона на QR-код заведения</p>
        </div>

        {/* Инструкция для гостя — как попросить QR у официанта */}
        <div className="p-3 rounded-xl bg-[#242f3d] border border-white/5 text-slate-200 text-xs space-y-1 my-2 z-10 shadow-sm text-left">
          <div className="flex items-center space-x-1.5 font-bold text-[11px] uppercase tracking-wider text-[#2aabee]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Как получить подарки:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            💡 Находясь в заведении, скажите официанту при оплате счета: <br/>
            <span className="font-extrabold text-[#2aabee] bg-[#2aabee]/10 px-2 py-0.5 rounded-full border border-[#2aabee]/20 inline-block mt-1">
              «Покажите QR-код GiftX для подарка»
            </span>
          </p>
        </div>

        {/* Анимированный элемент видоискателя с встроенным контейнером html5-qrcode */}
        <div className="my-auto relative flex items-center justify-center py-2 z-10">
          <div className="w-60 h-60 rounded-2xl border-2 border-dashed border-[#2aabee]/60 relative overflow-hidden bg-[#0e1621] shadow-inner flex items-center justify-center">
            {/* Контейнер HTML5 видеопотока */}
            <div id="html5-qr-reader" className="w-full h-full object-cover overflow-hidden rounded-xl" />

            {/* Заглушка сканирования если видео еще грузится или не запущено */}
            {!isCameraActive && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e1621]/90 space-y-2 p-4 text-center">
                <QrCode className="w-12 h-12 text-[#2aabee]/60 animate-pulse" />
                <span className="text-[10px] font-bold text-[#2aabee] uppercase tracking-widest block">
                  Запуск веб-камеры...
                </span>
              </div>
            )}

            {/* Ошибка доступа к камере */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e1621]/95 space-y-2 p-4 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400" />
                <span className="text-[11px] text-amber-200 font-semibold">{cameraError}</span>
              </div>
            )}

            {/* Анимированный лазерный луч сканирования при активной камере */}
            {isCameraActive && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#2aabee] to-transparent shadow-[0_0_15px_#2aabee] animate-scan-line pointer-events-none" />
            )}

            {/* Уголки рамки */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#2aabee] rounded-tl pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#2aabee] rounded-tr pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#2aabee] rounded-bl pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#2aabee] rounded-br pointer-events-none" />
          </div>
        </div>

        {/* Ошибка если код не совпал */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium text-center mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Ручной ввод токена или симуляция для веб-тестов */}
        <div className="space-y-2 z-10 pt-2 border-t border-white/10">
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Вставьте ссылку или токен..."
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#242f3d] border border-white/5 text-slate-100 text-xs focus:border-[#2aabee]/50 outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              className="py-2.5 px-4 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] font-bold text-white text-xs shadow-md shadow-[#2aabee]/30 active:scale-95 cursor-pointer"
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
            className="w-full py-2 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] border border-white/5 text-[#2aabee] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Тестовый бокс (Симуляция)</span>
          </button>

          {/* Явная кнопка закрытия модалки */}
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 text-xs font-bold transition-all border border-white/5 active:scale-95 cursor-pointer"
          >
            Закрыть сканер
          </button>
        </div>
      </div>
    </div>
  );
};
