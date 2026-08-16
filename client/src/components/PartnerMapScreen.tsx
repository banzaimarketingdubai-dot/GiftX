import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Star, ExternalLink, MessageSquare, Compass, Search, ChevronRight, Gift, Navigation, PlusCircle, CheckCircle, ShieldCheck, Link, Copy, Check, Share2 } from 'lucide-react';
import L from 'leaflet';
import { Partner, ClaimedVoucher } from '../types';
import { GoogleReviewsModal } from './GoogleReviewsModal';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { VenueGuestModal } from './VenueGuestModal';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';
import { useAppStore } from '../store/useAppStore';

export const PartnerMapScreen: React.FC = () => {
  const { selectedMapPartner } = useAppStore();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [userWallet, setUserWallet] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [mapCopiedVenueId, setMapCopiedVenueId] = useState<string | null>(null);

  const handleCopyMapVenueLink = (partner: Partner, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic('light');
    triggerNotificationHaptic('success');
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://gift-x.vercel.app';
    const url = `${origin}/?venue=${partner.id}`;
    navigator.clipboard.writeText(url);
    setMapCopiedVenueId(partner.id);
    setTimeout(() => setMapCopiedVenueId(null), 2500);
  };

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

  // Автоматический фокус карты при открытии маршрута конкретного заведения
  useEffect(() => {
    if (selectedMapPartner) {
      setSelectedPartner(selectedMapPartner);
      if (leafletMapRef.current && selectedMapPartner.lat && selectedMapPartner.lng) {
        leafletMapRef.current.flyTo([selectedMapPartner.lat, selectedMapPartner.lng], 15, { duration: 1.2 });
      }
    }
  }, [selectedMapPartner]);

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

  const [googlePlaces, setGooglePlaces] = useState<any[]>([]);

  // Загрузка близлежащих Google-мест (серые маркеры)
  useEffect(() => {
    fetch('/api/guest/google-places-nearby')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.places) {
          setGooglePlaces(data.places);
        }
      })
      .catch((e) => console.error('Google places fetch error', e));
  }, []);

  // Инициализация интерактивной 3-цветной минималистичной карты Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([10.15, 103.98], 11);

    // Стандартные светлые цвета Google Maps (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    leafletMapRef.current = map;

    // Запрос геопозиции пользователя при загрузке карты
    requestUserLocation(true);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Обновление меток партнеров и серых меток Google на карте
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

    const bounds = L.latLngBounds([]);

    // 1. Отображение обычных бизнесов из Google Maps СЕРЫМИ МАРКЕРАМИ
    googlePlaces.forEach((place) => {
      const gLat = place.lat;
      const gLng = place.lng;

      const grayIconHtml = `
        <div style="
          width: 30px;
          height: 30px;
          background: #1e293b;
          border: 1.5px solid #475569;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: #94a3b8;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          opacity: 0.85;
        ">
          📍
        </div>
      `;

      const grayIcon = L.divIcon({
        className: 'custom-google-gray-marker',
        html: grayIconHtml,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const gMarker = L.marker([gLat, gLng], { icon: grayIcon });

      gMarker.on('click', () => {
        triggerHaptic('light');
        setSelectedPartner({
          id: place.id,
          name: place.name,
          category: 'SERVICES',
          address: place.address,
          logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150',
          lat: place.lat,
          lng: place.lng,
          googleRating: place.googleRating,
          googleReviewsCount: place.googleReviewsCount,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
        } as Partner);
        leafletMapRef.current?.flyTo([gLat, gLng], 15, { duration: 0.8 });
      });

      markersGroupRef.current?.addLayer(gMarker);
    });

    // 2. Отображение заведений-партнеров GiftX ЯРКИМИ ЦВЕТНЫМИ МАРКЕРАМИ
    filteredPartners.forEach((partner) => {
      const partnerLat = partner.lat || 10.1982;
      const partnerLng = partner.lng || 103.9634;

      bounds.extend([partnerLat, partnerLng]);

      const hasUserVouchers = userWallet.some(
        (v) => v.status === 'ACTIVE' && v.voucherOffer?.partnerId === partner.id
      );

      // Яркие уникальные градиенты по категориям
      const getCategoryGradient = (cat: string) => {
        switch (cat) {
          case 'HORECA': return 'linear-gradient(135deg, #f59e0b, #d97706)';
          case 'BEAUTY_SPA': return 'linear-gradient(135deg, #ec4899, #be185d)';
          case 'AUTO_MOTO': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
          case 'ENTERTAINMENT': return 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
          default: return 'linear-gradient(135deg, #f59e0b, #d97706)';
        }
      };

      const getCategoryBadge = (cat: string) => {
        switch (cat) {
          case 'HORECA': return '🍸';
          case 'BEAUTY_SPA': return '💆';
          case 'AUTO_MOTO': return '🛵';
          case 'ENTERTAINMENT': return '🛥️';
          default: return '🎁';
        }
      };

      const iconHtml = `
        <div style="
          width: 44px;
          height: 44px;
          background: ${getCategoryGradient(partner.category)};
          border: 2px solid ${hasUserVouchers ? '#34d399' : '#ffffff'};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: 0 8px 25px ${hasUserVouchers ? 'rgba(52, 211, 153, 0.6)' : 'rgba(245, 158, 11, 0.4)'};
          position: relative;
          cursor: pointer;
          transform: scale(1.05);
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
        className: 'custom-partner-vibrant-marker',
        html: iconHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const marker = L.marker([partnerLat, partnerLng], { icon: customIcon });

      marker.on('click', () => {
        triggerHaptic('medium');
        setSelectedPartner(partner);
        leafletMapRef.current?.flyTo([partnerLat, partnerLng], 15, { duration: 0.8 });
      });

      markersGroupRef.current?.addLayer(marker);
    });

    if (filteredPartners.length > 0 && !selectedPartner) {
      leafletMapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [partners, googlePlaces, selectedCategory, searchQuery, userWallet]);

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
              <Navigation className="w-4 h-4 text-blue-400" />
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
            { id: 'ALL', label: 'Все' },
            { id: 'HORECA', label: 'HoReCa' },
            { id: 'BEAUTY_SPA', label: 'Beauty & Spa' },
            { id: 'AUTO_MOTO', label: 'Auto & Moto' },
            { id: 'ENTERTAINMENT', label: 'Развлечения' },
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
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Аккуратная плавающая кнопка центрирования карты по локации пользователя (GPS FAB) */}
      <div className="absolute right-4 bottom-24 z-20">
        <button
          onClick={() => {
            triggerHaptic('heavy');
            requestUserLocation(true);
          }}
          className="w-12 h-12 rounded-full bg-slate-900/90 hover:bg-slate-800 border-2 border-blue-500/80 text-blue-400 flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.4)] backdrop-blur-xl transition-all active:scale-90 group"
          title="Моё местоположение"
        >
          <Navigation className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
        </button>
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

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => handleCopyMapVenueLink(selectedPartner)}
                  title="Скопировать прямую ссылку на карточку заведения (Web App)"
                  className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition-all flex items-center space-x-1 shadow-sm"
                >
                  {mapCopiedVenueId === selectedPartner.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black text-amber-300">URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedPartner(null)}
                  className="text-slate-500 hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
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

            {/* Две ключевые кнопки действий + Условия боксов */}
            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  setShowVenueModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span>🎁 Условия Боксов & Инструкция</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
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
        </div>
      )}

      {/* Модальное окно заведения (Условия боксов & Инструкция) */}
      {showVenueModal && selectedPartner && (
        <VenueGuestModal
          partner={selectedPartner}
          onClose={() => setShowVenueModal(false)}
          onOpenScanner={() => {
            setShowVenueModal(false);
          }}
        />
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
