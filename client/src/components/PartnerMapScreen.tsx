import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, ExternalLink, MessageSquare, Compass, Search, ChevronRight, Gift, Navigation, PlusCircle, CheckCircle, ShieldCheck } from 'lucide-react';
import L from 'leaflet';
import { Partner, ClaimedVoucher } from '../types';
import { GoogleReviewsModal } from './GoogleReviewsModal';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { triggerHaptic, getTelegramUserData } from '../telegram';

export const PartnerMapScreen: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userWallet, setUserWallet] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Загрузка партнеров и кошелька
  const fetchData = async () => {
    try {
      setLoading(true);
      const tgUser = getTelegramUserData();
      
      const [partnersRes, walletRes] = await Promise.all([
        fetch('/api/guest/map-partners'),
        fetch(`/api/guest/wallet/${tgUser.id}`)
      ]);

      const partnersData = await partnersRes.json();
      const walletData = await walletRes.json();

      if (partnersData.success) {
        setPartners(partnersData.partners);
      }
      if (walletData.success) {
        setUserWallet(walletData.wallet);
      }
    } catch (e) {
      console.error('Failed to fetch map data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const requestUserLocation = (flyTo = true) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setUserLocation({ lat: userLat, lng: userLng });

          if (leafletMapRef.current) {
            if (flyTo) {
              leafletMapRef.current.flyTo([userLat, userLng], 14, { duration: 1.2 });
            }

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([userLat, userLng]);
            } else {
              const userIcon = L.divIcon({
                className: 'custom-user-marker',
                html: `
                  <div style="
                    width: 22px;
                    height: 22px;
                    background: #3b82f6;
                    border: 3px solid #ffffff;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.9);
                    animation: pulse 2s infinite;
                  "></div>
                `,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              });
              userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(leafletMapRef.current);
            }
          }
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const [mapStyle, setMapStyle] = useState<'GOOGLE_ROADMAP' | 'GOOGLE_SATELLITE' | 'DARK'>('GOOGLE_ROADMAP');
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  const getTileUrl = (style: string) => {
    switch (style) {
      case 'GOOGLE_SATELLITE':
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      case 'DARK':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      default:
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    }
  };

  // Инициализация интерактивной карты Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([10.15, 103.98], 11);

    const initialTileLayer = L.tileLayer(getTileUrl(mapStyle), {
      maxZoom: 20,
    }).addTo(map);

    activeTileLayerRef.current = initialTileLayer;
    markersGroupRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    // Запрос геопозиции пользователя при загрузке карты
    requestUserLocation(true);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Переключение слоя карты
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (activeTileLayerRef.current) {
      leafletMapRef.current.removeLayer(activeTileLayerRef.current);
    }

    const newLayer = L.tileLayer(getTileUrl(mapStyle), { maxZoom: 20 }).addTo(leafletMapRef.current);
    activeTileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Обновление меток партнеров на карте при фильтрации
  useEffect(() => {
    if (!leafletMapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const filteredPartners = partners.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filteredPartners.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredPartners.forEach((partner) => {
      const partnerLat = partner.lat || 10.1982;
      const partnerLng = partner.lng || 103.9634;

      bounds.extend([partnerLat, partnerLng]);

      // Наличие активных ваучеров у пользователя в этом заведении
      const hasUserVouchers = userWallet.some(
        (v) => v.status === 'ACTIVE' && v.voucherOffer?.partnerId === partner.id
      );

      // Иконка в зависимости от категории
      const getCategoryBadge = (cat: string) => {
        switch (cat) {
          case 'HORECA': return '🍸';
          case 'BEAUTY_SPA': return '💆';
          case 'AUTO_MOTO': return '🛵';
          case 'ENTERTAINMENT': return '🛥️';
          default: return '📍';
        }
      };

      const iconHtml = `
        <div style="
          width: 44px;
          height: 44px;
          background: ${hasUserVouchers ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b'};
          border: 2px solid ${hasUserVouchers ? '#fbbf24' : '#334155'};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 8px 20px ${hasUserVouchers ? 'rgba(245, 158, 11, 0.4)' : 'rgba(0,0,0,0.5)'};
          position: relative;
          cursor: pointer;
        ">
          ${getCategoryBadge(partner.category)}
          ${
            hasUserVouchers
              ? `<div style="
                  position: absolute;
                  top: -4px;
                  right: -4px;
                  width: 14px;
                  height: 14px;
                  background: #10b981;
                  border: 2px solid #0f172a;
                  border-radius: 50%;
                "></div>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-partner-marker',
        html: iconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([partnerLat, partnerLng], { icon: customIcon });

      marker.on('click', () => {
        triggerHaptic('medium');
        setSelectedPartner(partner);
        leafletMapRef.current?.flyTo([partnerLat, partnerLng], 14, { duration: 0.8 });
      });

      markersGroupRef.current?.addLayer(marker);
    });

    if (filteredPartners.length > 0 && !selectedPartner) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [partners, selectedCategory, searchQuery, userWallet]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 pb-20">
      {/* Карта во весь экран */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Верхний оверлей: Поиск и Фильтры */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 space-y-3 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-sm max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-100">Карта Заведений</h1>
              <p className="text-[10px] text-slate-400">Партнеры и Google Maps отзывы</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                requestUserLocation(true);
              }}
              title="Мое местоположение"
              className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center hover:bg-blue-500/30 transition-all shadow-md"
            >
              🎯
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setShowRegistrationModal(true);
              }}
              className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center space-x-1 hover:bg-amber-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Добавить место</span>
            </button>
          </div>
        </div>

        {/* Поисковая строка */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск заведений или адреса..."
            className="w-full py-2.5 pl-10 pr-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-100 text-xs shadow-lg outline-none focus:border-amber-500/50 backdrop-blur-xl transition-all"
          />
        </div>

        {/* Фильтры категорий */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'Все', icon: '📍' },
            { id: 'HORECA', label: 'HoReCa', icon: '🍸' },
            { id: 'BEAUTY_SPA', label: 'Beauty & Spa', icon: '💆' },
            { id: 'AUTO_MOTO', label: 'Auto & Moto', icon: '🛵' },
            { id: 'ENTERTAINMENT', label: 'Развлечения', icon: '🛥️' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat.id);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-400 border border-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Переключатель стилей Google Maps */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Карта:</span>
          <div className="flex space-x-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => { triggerHaptic('light'); setMapStyle('GOOGLE_ROADMAP'); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${mapStyle === 'GOOGLE_ROADMAP' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🗺️ Google
            </button>
            <button
              onClick={() => { triggerHaptic('light'); setMapStyle('GOOGLE_SATELLITE'); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${mapStyle === 'GOOGLE_SATELLITE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🛰️ Спутник
            </button>
            <button
              onClick={() => { triggerHaptic('light'); setMapStyle('DARK'); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${mapStyle === 'DARK' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🌙 Ночь
            </button>
          </div>
        </div>
      </div>

      {/* Нижняя всплывающая карточка выбранного заведения */}
      {selectedPartner && (
        <div className="absolute bottom-20 left-4 right-4 z-20 max-w-md mx-auto animate-slideUp">
          <div className="glass-card p-4 rounded-3xl border border-amber-500/30 shadow-2xl bg-slate-900/95 backdrop-blur-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedPartner.logoUrl}
                  alt={selectedPartner.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0 shadow-md"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {selectedPartner.category}
                  </span>
                  <h3 className="font-extrabold text-slate-100 text-base mt-1 line-clamp-1">
                    {selectedPartner.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{selectedPartner.address}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPartner(null)}
                className="text-slate-500 hover:text-slate-300 p-1"
              >
                ✕
              </button>
            </div>

            {/* Рейтинг Google Maps и кнопка отзывов */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{(selectedPartner.googleRating || 4.8).toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-400">
                  ({selectedPartner.googleReviewsCount || 120} отзывов Google)
                </span>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowReviewsModal(true);
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center space-x-1 transition-all border border-slate-700"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Отзывы</span>
              </button>
            </div>

            {/* Доступные ваучеры пользователя в этом месте */}
            {(() => {
              const activeVouchers = userWallet.filter(
                (v) => v.status === 'ACTIVE' && v.voucherOffer?.partnerId === selectedPartner.id
              );

              return (
                <div className="mt-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-300 flex items-center space-x-1">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ваши подарки здесь:</span>
                    </span>
                    <span className="font-bold text-emerald-400">{activeVouchers.length} активных</span>
                  </div>

                  {activeVouchers.length > 0 ? (
                    <div className="space-y-1">
                      {activeVouchers.map((v) => (
                        <div key={v.id} className="text-xs text-slate-200 flex items-center justify-between">
                          <span className="truncate max-w-[200px]">🎁 {v.voucherOffer?.title}</span>
                          <span className="text-[10px] text-amber-400 font-semibold">{v.voucherOffer?.discountValue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      У вас пока нет сгенерированных ваучеров в этом месте. Получите HappyBox от партнеров!
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Две ключевые кнопки действий */}
            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowReviewsModal(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Отзывы</span>
              </button>

              <a
                href={
                  selectedPartner.googleMapsUrl ||
                  `https://www.google.com/maps/dir/?api=1&destination=${selectedPartner.lat || 10.1982},${selectedPartner.lng || 103.9634}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('medium')}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Маршрут</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно отзывов Google */}
      {showReviewsModal && selectedPartner && (
        <GoogleReviewsModal
          partner={selectedPartner}
          onClose={() => setShowReviewsModal(false)}
        />
      )}

      {/* Модальное окно регистрации локации партнера */}
      {showRegistrationModal && (
        <PartnerRegistrationModal
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => fetchData()}
          initialPartner={selectedPartner || undefined}
        />
      )}
    </div>
  );
};
