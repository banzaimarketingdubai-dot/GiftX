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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
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
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-5">
      {/* 1. ХЭДЕР / ПРИВЕТСТВИЕ ГОСТЯ */}
      <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>GiftX Pass</span>
          </div>
          <h1 className="text-xl font-black text-slate-100">
            Привет, {tgUser?.first_name || 'Гость'}! 👋
          </h1>
          <p className="text-xs text-slate-400">
            Получайте подарки в лучших заведениях города
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-2xl text-amber-400 shrink-0 shadow-lg shadow-amber-500/20 z-10">
          {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : '🎁'}
        </div>
      </div>

      {/* 2. ГЛАВНАЯ КНОПКА-ГЕРОЙ: 📸 СКАНИРОВАТЬ QR-КОД ОФИЦИАНТА */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('heavy');
          onOpenScanner();
        }}
        className="cursor-pointer glass-card p-6 rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-500/20 via-amber-950/40 to-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.35)] relative overflow-hidden group transition-all"
      >
        {/* Неоновый блик */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/25 blur-3xl rounded-full animate-pulse-slow pointer-events-none" />

        <div className="flex items-center space-x-4 relative z-10">
          {/* Пульсирующая 3D иконка Камеры */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-xl shadow-amber-500/40 shrink-0 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
              <Camera className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <div className="inline-flex items-center space-x-1 text-[10px] font-black text-amber-300 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/40">
              <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
              <span>Главное действие</span>
            </div>
            <h2 className="text-lg font-black text-white leading-tight">
              Сканировать QR Официанта
            </h2>
            <p className="text-xs text-amber-200/80 font-medium line-clamp-2">
              Наведите камеру при оплате счёта и заберите 5 подарков!
            </p>
          </div>
        </div>

        {/* Кнопка действия */}
        <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between text-xs font-black text-amber-300">
          <span>Нажмите, чтобы открыть сканер</span>
          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 group-hover:translate-x-1 transition-transform">
            <span>Открыть сканер</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </div>
        </div>
      </motion.div>

      {/* 3. КАРТОЧКА МОИ ПОДАРКИ (КОШЕЛЕК) */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenWallet();
        }}
        className="cursor-pointer glass-card p-4 rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-purple-500/40 transition-all flex items-center justify-between shadow-xl"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-purple-400 tracking-wider">
              Ваш Кошелек
            </span>
            <h3 className="font-extrabold text-slate-100 text-sm">Мои Подарки</h3>
            <p className="text-xs text-slate-400">
              {activeVouchersCount > 0
                ? `Вам доступно ${activeVouchersCount} активных подарков`
                : 'Пока нет активных подарков'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeVouchersCount > 0 && (
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-emerald-500/30">
              {activeVouchersCount}
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* 4. КАРТА ЗАВЕДЕНИЙ С ПРЕВЬЮ И ЦЕНТРИРОВАНИЕМ ПО ЛОКАЦИИ ГОСТЯ */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">Заведения Рядом С Вами</h3>
              <p className="text-[10px] text-slate-400">Партнеры сети на интерактивной карте</p>
            </div>
          </div>

          <span className="text-[10px] text-amber-400 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            📍 GPS
          </span>
        </div>

        {/* Контейнер интерактивного превью карты */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
          <div ref={mapRef} className="w-full h-36 z-0" />
          <div className="absolute bottom-2 left-2 z-10 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center space-x-1">
            <Navigation className="w-3 h-3 text-blue-400" />
            <span>Локация определена</span>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenMap();
          }}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-slate-700"
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Открыть полноэкранную карту ({partners.length} мест)</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* 5. ИНТЕРАКТИВНЫЙ БЛОК-ИНСТРУКЦИЯ: 💡 КАК ЭТО РАБОТАЕТ */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-3">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Как получать подарки в 3 шага:</span>
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div className="font-bold text-slate-200">Отдыхайте</div>
            <div className="text-slate-400 leading-tight text-[9px]">Делайте заказы у партнеров</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div className="font-bold text-slate-200">Сканируйте</div>
            <div className="text-slate-400 leading-tight text-[9px]">QR-код у официанта</div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="w-7 h-7 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div className="font-bold text-slate-200">Забирайте</div>
            <div className="text-slate-400 leading-tight text-[9px]">5 эксклюзивных подарков</div>
          </div>
        </div>
      </div>
    </div>
  );
};
