import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  QrCode, 
  Gift, 
  MapPin, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Navigation, 
  Compass, 
  Zap, 
  ArrowRight,
  Info,
  X
} from 'lucide-react';
import L from 'leaflet';
import { getTelegramUserData, triggerHaptic } from '../telegram';
import { ClaimedVoucher, Partner } from '../types';
import { DemoBoxOpeningModal } from './DemoBoxOpeningModal';

interface GuestHomeScreenProps {
  onOpenScanner: () => void;
  onOpenWallet: () => void;
  onOpenMap: () => void;
  onScanTokenSuccess: (token: string) => void;
}

export const GuestHomeScreen: React.FC<GuestHomeScreenProps> = ({
  onOpenScanner,
  onOpenWallet,
  onOpenMap,
  onScanTokenSuccess,
}) => {
  const tgUser = getTelegramUserData();
  const [activeVouchersCount, setActiveVouchersCount] = useState<number>(0);
  const [userVouchers, setUserVouchers] = useState<ClaimedVoucher[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showDemoBoxModal, setShowDemoBoxModal] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({
    lat: 10.1982,
    lng: 103.9634,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  // 1. Определение геолокации пользователя
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.log('Geolocation not available, using default', err),
        { timeout: 8000 }
      );
    }
  }, []);

  // 2. Загрузка данных для статистики и карты
  useEffect(() => {
    if (tgUser?.id) {
      fetch(`/api/guest/wallet/${tgUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.wallet) {
            setUserVouchers(data.wallet);
            const activeCount = data.wallet.filter((v: any) => v.status === 'ACTIVE').length;
            setActiveVouchersCount(activeCount);
          }
        })
        .catch((err) => console.error('Wallet fetch error', err));
    }

    fetch('/api/staff/partners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.partners) {
          setPartners(data.partners);
        }
      })
      .catch((err) => console.error('Partners map fetch error', err));
  }, [tgUser?.id]);

  // 3. Инициализация Leaflet Map Preview с акцентным пульсирующим фоном для заведений с подарками
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([userLocation.lat, userLocation.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Маркер местоположения пользователя
    const userIcon = L.divIcon({
      className: 'custom-user-location-pin',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #2aabee;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 15px #2aabee;
          animation: pulse 2s infinite;
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

    // Маркеры заведений:
    // Доступные заведения -> неакцентный цвет (#242f3d)
    // Заведения с ожидающими подарками -> акцентный яркий цвет (#2aabee / #10b981) + светимость и пульсация!
    partners.slice(0, 7).forEach((p) => {
      if (p.lat && p.lng) {
        const hasVoucherInVenue = userVouchers.some(
          (v) => v.status === 'ACTIVE' && v.voucherOffer?.partnerId === p.id
        );

        const pinHtml = hasVoucherInVenue
          ? `
            <div style="
              width: 38px;
              height: 38px;
              background: linear-gradient(135deg, #10b981, #059669);
              border: 2px solid #ffffff;
              border-radius: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 25px rgba(16, 185, 129, 0.9), 0 0 10px rgba(52, 211, 153, 0.6);
              animation: pulse 1.5s infinite;
              font-size: 18px;
            ">
              🎁
            </div>
          `
          : `
            <div style="
              width: 32px;
              height: 32px;
              background: #242f3d;
              border: 1.5px solid #475569;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
              font-size: 14px;
              opacity: 0.85;
            ">
              📍
            </div>
          `;

        const partnerIcon = L.divIcon({
          className: 'custom-partner-pin',
          html: pinHtml,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        L.marker([p.lat, p.lng], { icon: partnerIcon }).addTo(map);
      }
    });

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, [userLocation, partners, userVouchers]);

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-4 font-sans">
      {/* 1. БЛОК ПРИВЕТСТВИЯ + ГОЛУБОЙ КРУГ С БУКВОЙ (i) СПРАВА */}
      <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#2aabee]/15 border border-[#2aabee]/30 text-[#2aabee] text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-[#2aabee]" />
            <span>GiftX Кросс-маркетинг</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-100 tracking-tight">
            Привет, {tgUser?.first_name || 'Гость'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Бесплатные подарки в ресторанах и СПА
          </p>
        </div>

        {/* Голубой круг с буквой i справа — кнопка открытия попапа инструкций */}
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowInfoModal(true);
          }}
          title="Как получать подарки"
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2aabee] to-[#229ed9] hover:from-[#229ed9] hover:to-[#0088cc] text-white flex items-center justify-center transition-all shadow-lg shadow-[#2aabee]/35 active:scale-95 shrink-0 cursor-pointer"
        >
          <Info className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* 2. БЛОК СКАНИРОВАТЬ КУАР ОФИЦИАНТА (СТАНДАРТНЫЙ РАЗМЕР И ШИРИНА КАК У ПРИВЕТСТВИЯ) */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          triggerHaptic('heavy');
          onOpenScanner();
        }}
        className="w-full cursor-pointer p-4.5 rounded-2xl bg-gradient-to-r from-[#2aabee] via-[#229ed9] to-[#0088cc] text-white shadow-lg shadow-[#2aabee]/30 relative overflow-hidden group transition-all text-left border border-white/10"
      >
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
            <Camera className="w-6 h-6 text-white animate-pulse" />
          </div>

          <div className="space-y-0.5 flex-1">
            <div className="inline-flex items-center space-x-1 text-[9px] font-bold text-white uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm">
              <Zap className="w-2.5 h-2.5 text-amber-300" />
              <span>Главное действие</span>
            </div>
            <h2 className="text-base font-black text-white leading-tight">
              СКАНИРОВАТЬ QR ОФИЦИАНТА
            </h2>
            <p className="text-[11px] text-blue-100 font-medium line-clamp-1">
              Наведите камеру при оплате счёта и заберите 5 подарков!
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs font-bold text-white">
          <span>Нажмите для открытия сканера</span>
          <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white text-[#2aabee] font-black shadow-sm group-hover:translate-x-1 transition-transform">
            <span>Открыть</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#2aabee]" />
          </div>
        </div>
      </motion.button>

      {/* 3. БЛОК МОИ ПОДАРКИ (КОШЕЛЕК - ПОДНЯТ ВЫШЕ КАРТЫ) */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenWallet();
        }}
        className="cursor-pointer bg-[#17212b] hover:bg-[#1f2c3a] p-4.5 rounded-2xl border border-white/5 transition-all flex items-center justify-between shadow-md"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
              Ваш Кошелек
            </span>
            <h3 className="font-bold text-slate-100 text-sm">Мои Подарки</h3>
            <p className="text-xs text-slate-400">
              {activeVouchersCount > 0
                ? `Вам доступно ${activeVouchersCount} активных подарков`
                : 'Пока нет активных подарков'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeVouchersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#2aabee] text-white font-extrabold text-[11px] flex items-center justify-center shadow-md">
              {activeVouchersCount}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* 4. БЛОК КАРТЫ (ВЫСОТА УМЕНЬШЕНА В 2 РАЗА ДО ПРЕЖНИХ ЗНАЧЕНИЙ) */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Заведения Рядом С Вами</h3>
              <p className="text-[10px] text-slate-400">Зеленые с подарками • Серые в программе</p>
            </div>
          </div>

          <span className="text-[10px] text-[#2aabee] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2aabee]/10 border border-[#2aabee]/20 flex items-center space-x-1">
            <Navigation className="w-3 h-3 text-[#2aabee] inline" />
            <span>GPS</span>
          </span>
        </div>

        {/* Контейнер интерактивного превью карты (высота в 2 раза меньше) */}
        <div className="relative rounded-2xl overflow-hidden border border-white/5 shadow-inner h-44 w-full">
          <div ref={mapRef} className="w-full h-full z-0" />
          <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-full bg-[#17212b]/90 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-200 flex items-center space-x-1.5 shadow-md">
            <Navigation className="w-3 h-3 text-[#2aabee]" />
            <span>Локация определена</span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenMap();
          }}
          className="w-full py-3 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-100 font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-white/5 cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-[#2aabee]" />
          <span>Открыть полноэкранную карту ({partners.length} мест)</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* ПОПАП "КАК ПОЛУЧАТЬ ПОДАРКИ В 3 ШАГА" (ФУЛЛ-СКРИН С КРУПНЫМИ ПИКТОГРАММАМИ ШАГОВ В СТИЛЕ ТГ) */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 bg-[#0e1621] text-slate-100 flex flex-col overflow-hidden font-sans"
          >
            {/* ШАПКА ПОПАПА С УЧЕТОМ НАВИГАЦИИ ТЕЛЕГРАМА */}
            <div 
              className="bg-[#17212b] border-b border-white/5 px-4 pb-3 flex items-center justify-between shadow-md shrink-0"
              style={{
                paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), 0px) + 58px)'
              }}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
                <div className="w-9 h-9 rounded-2xl bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee] shrink-0">
                  <Sparkles className="w-5 h-5 text-[#2aabee]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-100 leading-tight truncate">Как получать подарки</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Простая пошаговая инструкция</p>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowInfoModal(false);
                }}
                className="p-2 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5 active:scale-95 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* СКРОЛЛИРУЕМЫЙ КОНТЕНТ С КРУПНЫМИ ПИКТОГРАММАМИ */}
            <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4 custom-scrollbar">
              <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-[#2aabee] uppercase tracking-wider bg-[#2aabee]/15 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-[#2aabee]/20">
                  <Sparkles className="w-3 h-3 text-[#2aabee]" />
                  <span>3 простых шага</span>
                </span>
                <h3 className="font-extrabold text-base text-slate-100 pt-1">
                  Бесплатные подарки в лучшем заведении города
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Отдыхайте в ресторанах и СПА сети GiftX, сканируйте QR-код счёта и забирайте веер из 5 подарочных ваучеров!
                </p>
              </div>

              <div className="space-y-3">
                {/* ШАГ 1 */}
                <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-[#2aabee] shrink-0 shadow-md">
                    <span className="text-2xl select-none">🍹</span>
                    <span className="text-[9px] font-black text-[#2aabee] uppercase mt-0.5">Шаг 1</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-100">
                      Отдыхайте в заведении
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Делайте заказы в заведениях-партнерах сети (рестораны, СПА, развлечения).
                    </p>
                  </div>
                </div>

                {/* ШАГ 2 */}
                <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-md">
                    <span className="text-2xl select-none">📷</span>
                    <span className="text-[9px] font-black text-amber-400 uppercase mt-0.5">Шаг 2</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-100">
                      Сканируйте QR у официанта
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      При оплате счёта попросите официанта показать QR-код вашей суммы и отсканируйте его камерой.
                    </p>
                  </div>
                </div>

                {/* ШАГ 3 */}
                <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                  <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-md">
                    <span className="text-2xl select-none">🎁</span>
                    <span className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">Шаг 3</span>
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-100">
                      Забирайте 5 Подарков
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Откройте 3D-бокс и заберите веер из 5 карточек с бесплатными напитками, массажами и скидками!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ФУТЕР */}
            <div 
              className="bg-[#17212b] border-t border-white/5 p-4 shrink-0 max-w-md mx-auto w-full shadow-lg"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 0px), 16px)'
              }}
            >
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowInfoModal(false);
                }}
                className="w-full py-3.5 bg-[#2aabee] hover:bg-[#229ed9] font-extrabold text-white rounded-xl text-xs shadow-md shadow-[#2aabee]/30 transition-all cursor-pointer active:scale-[0.99]"
              >
                Всё понятно! 🚀
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. МОДАЛЬНОЕ ОКНО ТЕСТОВОЙ РАСПАКОВКИ 3D-БОКСА */}
      {showDemoBoxModal && (
        <DemoBoxOpeningModal
          onClose={() => {
            setShowDemoBoxModal(false);
          }}
        />
      )}
    </div>
  );
};

