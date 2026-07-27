import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Link as LinkIcon, Star, Check, Globe, Navigation, Building2 } from 'lucide-react';
import L from 'leaflet';
import { PartnerCategory } from '../types';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';

interface PartnerRegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialPartner?: any;
}

export const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({
  onClose,
  onSuccess,
  initialPartner,
}) => {
  const [name, setName] = useState(initialPartner?.name || '');
  const [category, setCategory] = useState<PartnerCategory>(initialPartner?.category || 'HORECA');
  const [address, setAddress] = useState(initialPartner?.address || '');
  const [logoUrl, setLogoUrl] = useState(initialPartner?.logoUrl || '');
  const [lat, setLat] = useState<number>(initialPartner?.lat || 10.1982);
  const [lng, setLng] = useState<number>(initialPartner?.lng || 103.9634);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialPartner?.googleMapsUrl || '');
  const [googleRating, setGoogleRating] = useState<number>(initialPartner?.googleRating || 4.8);
  const [googleReviewsCount, setGoogleReviewsCount] = useState<number>(initialPartner?.googleReviewsCount || 150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Живой поиск мест на Google Maps
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Обработчик живого поиска по названию/адресу
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/guest/places-search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success && data.results) {
          setSearchResults(data.results);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error('Places search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectPlaceResult = (place: any) => {
    setName(place.name);
    setAddress(place.address);
    setLat(place.lat);
    setLng(place.lng);
    if (place.googleRating) setGoogleRating(place.googleRating);
    if (place.googleReviewsCount) setGoogleReviewsCount(place.googleReviewsCount);
    if (place.googleMapsUrl) setGoogleMapsUrl(place.googleMapsUrl);

    if (leafletMap.current && markerRef.current) {
      leafletMap.current.setView([place.lat, place.lng], 16);
      markerRef.current.setLatLng([place.lat, place.lng]);
    }

    setShowSearchResults(false);
    setSearchQuery('');
    triggerNotificationHaptic('success');
  };

  // Инициализация карты в модалке для выбора локации
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const initialLat = lat || 10.1982;
    const initialLng = lng || 103.9634;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([initialLat, initialLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-pin-container',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #f59e0b;
          border: 3px solid #0f172a;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
          color: #0f172a;
          font-weight: bold;
        ">
          📍
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon,
    }).addTo(map);

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLat(position.lat);
      setLng(position.lng);
      triggerHaptic('light');
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
      triggerHaptic('light');
    });

    leafletMap.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Разбор вставленной ссылки Google Maps
  const handleGoogleUrlChange = (url: string) => {
    setGoogleMapsUrl(url);
    if (!url) return;

    // Парсим @lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const parsedLat = parseFloat(atMatch[1]);
      const parsedLng = parseFloat(atMatch[2]);
      setLat(parsedLat);
      setLng(parsedLng);
      if (leafletMap.current && markerRef.current) {
        leafletMap.current.setView([parsedLat, parsedLng], 16);
        markerRef.current.setLatLng([parsedLat, parsedLng]);
      }
      triggerNotificationHaptic('success');
      return;
    }

    // Парсим q=lat,lng
    const qMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const parsedLat = parseFloat(qMatch[1]);
      const parsedLng = parseFloat(qMatch[2]);
      setLat(parsedLat);
      setLng(parsedLng);
      if (leafletMap.current && markerRef.current) {
        leafletMap.current.setView([parsedLat, parsedLng], 16);
        markerRef.current.setLatLng([parsedLat, parsedLng]);
      }
      triggerNotificationHaptic('success');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tgUser = getTelegramUserData();
      const res = await fetch('/api/staff/partner/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: initialPartner?.id,
          name,
          category,
          address,
          logoUrl,
          lat,
          lng,
          googleMapsUrl,
          googleRating,
          googleReviewsCount,
          telegramId: tgUser?.id
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при сохранении заведения');
      }

      triggerNotificationHaptic('success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Шапка */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialPartner ? 'Редактировать локацию заведения' : 'Регистрация заведения-партнера'}
              </h2>
              <p className="text-[11px] text-slate-400">Укажите координаты и данные Google Maps</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Быстрый поиск заведения на Google Maps */}
          <div className="relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-between">
              <span>🔍 Быстрый поиск в Google Картах</span>
              {isSearching && <span className="text-[10px] text-slate-400 animate-pulse">Поиск...</span>}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Введите название заведения (например, Sunset Beach Club)..."
              className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-amber-500/40 text-slate-100 text-xs focus:border-amber-400 outline-none transition-all shadow-md"
            />

            {/* Выпадающий список подсказок Google Places */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                {searchResults.map((place, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectPlaceResult(place)}
                    className="w-full p-3 text-left hover:bg-amber-500/10 border-b border-slate-800 last:border-0 flex items-start space-x-2 transition-all"
                  >
                    <span className="text-amber-400 text-sm mt-0.5">📍</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{place.name}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{place.address}</p>
                      {place.googleRating && (
                        <span className="text-[9px] text-amber-400 font-semibold mt-0.5 inline-block">
                          ⭐ {place.googleRating} ({place.googleReviewsCount} отзывов)
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Название и Категория */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Название заведения
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Bar Beach Sunset"
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all"
              >
                <option value="HORECA">HoReCa (Рестораны/Бары)</option>
                <option value="BEAUTY_SPA">Beauty & Spa</option>
                <option value="AUTO_MOTO">Auto & Moto</option>
                <option value="ENTERTAINMENT">Развлечения & Яхты</option>
                <option value="SERVICES">Услуги & Сервис</option>
              </select>
            </div>
          </div>

          {/* Адрес */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Официальный адрес
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="город, улица, дом"
                className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Ссылка на Google Maps */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Ссылка на Google Maps (автозаполнение координат)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => handleGoogleUrlChange(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-slate-950 border border-amber-500/40 text-slate-100 text-xs focus:border-amber-400 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Вставьте ссылку на место из Google Карт — координаты определятся автоматически.
            </p>
          </div>

          {/* Выбор точки на карте */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Укажите местоположение на карте
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            </div>
            <div
              ref={mapRef}
              className="w-full h-44 rounded-2xl border border-slate-800 overflow-hidden shadow-inner relative z-0"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1">
              <Navigation className="w-3 h-3 text-slate-400" />
              <span>Кликните по карте или перетащите маркер 📍 для точной установки локации</span>
            </p>
          </div>

          {/* Рейтинг Google Maps */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Рейтинг Google ⭐
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={googleRating}
                onChange={(e) => setGoogleRating(parseFloat(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Кол-во отзывов
              </label>
              <input
                type="number"
                value={googleReviewsCount}
                onChange={(e) => setGoogleReviewsCount(parseInt(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Сохранить локацию заведения</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
