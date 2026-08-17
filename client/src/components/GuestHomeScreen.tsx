import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Building2,
  Award
} from 'lucide-react';
import L from 'leaflet';
import { getTelegramUserData, triggerHaptic } from '../telegram';
import { ClaimedVoucher, Partner } from '../types';

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
  const [partners, setPartners] = useState<Partner[]>([]);
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
    // Получение кошелька пользователя
    if (tgUser?.id) {
      fetch(`/api/guest/wallet/${tgUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.wallet) {
            const activeCount = data.wallet.filter((v: any) => v.status === 'ACTIVE').length;
            setActiveVouchersCount(activeCount);
          }
        })
        .catch((err) => console.error('Wallet fetch error', err));
    }

    // Получение заведений для превью карты
    fetch('/api/staff/partners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.partners) {
          setPartners(data.partners);
        }
      })
      .catch((err) => console.error('Partners map fetch error', err));
  }, [tgUser?.id]);

  // 3. Инициализация Leaflet Map Preview
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

    // Маркер местоположения пользователя (синий пульсирующий пин)
    const userIcon = L.divIcon({
      className: 'custom-user-location-pin',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          background: #3b82f6;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 20px #3b82f6;
          animation: pulse 2s infinite;
        "></div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

    // Маркеры заведений-партнеров (золотые пины)
    partners.slice(0, 5).forEach((p) => {
      if (p.lat && p.lng) {
        const partnerIcon = L.divIcon({
          className: 'custom-partner-pin',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #f59e0b;
              border: 2px solid #0f172a;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5);
              font-size: 14px;
            ">
              📍
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([p.lat, p.lng], { icon: partnerIcon }).addTo(map);
      }
    });

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, [userLocation, partners]);

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-4 font-sans">
      {/* 1. ХЭДЕР / ПРИВЕТСТВИЕ ГОСТЯ (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#2aabee]/15 border border-[#2aabee]/30 text-[#2aabee] text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-[#2aabee]" />
            <span>Сеть взаимоподарков</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-100 tracking-tight">
            Привет, {tgUser?.first_name || 'Гость'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Получайте бесплатные подарки в лучших заведениях
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2aabee] to-[#229ed9] flex items-center justify-center font-bold text-xl text-white shrink-0 shadow-lg shadow-[#2aabee]/30">
          {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : <Gift className="w-6 h-6 text-white" />}
        </div>
      </div>

      {/* 2. ИНТЕРАКТИВНЫЙ БЛОК-ИНСТРУКЦИЯ: 💡 КАК ЭТО РАБОТАЕТ */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-[#2aabee]" />
          <span>Как получать подарки в 3 шага:</span>
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2.5 rounded-xl bg-[#242f3d] border border-white/5 space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div className="font-bold text-slate-200">Отдыхайте</div>
            <div className="text-slate-400 leading-tight text-[9px]">Делайте заказы в заведениях</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#242f3d] border border-white/5 space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-[#2aabee]/20 text-[#2aabee] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div className="font-bold text-slate-200">Сканируйте</div>
            <div className="text-slate-400 leading-tight text-[9px]">QR-код у официанта</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#242f3d] border border-white/5 space-y-1">
            <div className="w-6 h-6 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div className="font-bold text-slate-200">Забирайте</div>
            <div className="text-slate-400 leading-tight text-[9px]">5 эксклюзивных подарков</div>
          </div>
        </div>
      </div>

      {/* 3. ГЛАВНАЯ КНОПКА-ГЕРОЙ: 📸 СКАНИРОВАТЬ QR-КОД ОФИЦИАНТА */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          triggerHaptic('heavy');
          onOpenScanner();
        }}
        className="cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-[#17212b] via-[#1f2c3a] to-[#242f3d] border border-[#2aabee]/40 shadow-xl relative overflow-hidden group transition-all"
      >
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2aabee] to-[#229ed9] p-0.5 shadow-lg shadow-[#2aabee]/30 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#17212b] rounded-[14px] flex items-center justify-center">
              <Camera className="w-7 h-7 text-[#2aabee] animate-pulse" />
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <div className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-[#2aabee] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#2aabee]/10 border border-[#2aabee]/20">
              <Zap className="w-3 h-3 text-[#2aabee]" />
              <span>Главное действие</span>
            </div>
            <h2 className="text-base font-extrabold text-white leading-tight">
              Сканировать QR Официанта
            </h2>
            <p className="text-xs text-slate-300 font-medium line-clamp-2">
              Наведите камеру при оплате счёта и заберите 5 подарков!
            </p>
          </div>
        </div>

        <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Нажмите для открытия сканера</span>
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#2aabee] text-white font-extrabold shadow-md shadow-[#2aabee]/30 group-hover:translate-x-1 transition-transform">
            <span>Сканер</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </div>
        </div>
      </motion.div>

      {/* 4. КАРТОЧКА МОИ ПОДАРКИ (КОШЕЛЕК - ЧАТ ТЕЛЕГРАМ СТИЛЬ) */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenWallet();
        }}
        className="cursor-pointer bg-[#17212b] hover:bg-[#1f2c3a] p-4 rounded-2xl border border-white/5 transition-all flex items-center justify-between shadow-md"
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

      {/* 5. КАРТА ЗАВЕДЕНИЙ (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Заведения Рядом С Вами</h3>
              <p className="text-[10px] text-slate-400">Партнеры сети на интерактивной карте</p>
            </div>
          </div>

          <span className="text-[10px] text-[#2aabee] font-mono font-bold px-2 py-0.5 rounded-full bg-[#2aabee]/10 border border-[#2aabee]/20 flex items-center space-x-1">
            <Navigation className="w-3 h-3 text-[#2aabee] inline" />
            <span>GPS</span>
          </span>
        </div>

        {/* Контейнер интерактивного превью карты */}
        <div className="relative rounded-xl overflow-hidden border border-white/5 shadow-inner">
          <div ref={mapRef} className="w-full h-36 z-0" />
          <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-full bg-[#17212b]/90 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-200 flex items-center space-x-1">
            <Navigation className="w-3 h-3 text-[#2aabee]" />
            <span>Локация определена</span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenMap();
          }}
          className="w-full py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-100 font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-white/5 cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-[#2aabee]" />
          <span>Открыть карту ({partners.length} мест)</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
