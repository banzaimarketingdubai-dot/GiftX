import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Link as LinkIcon, Star, Check, Globe, Navigation, Building2, PlusCircle } from 'lucide-react';
import L from 'leaflet';
import { PartnerCategory } from '../types';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';

interface PartnerRegistrationModalProps {
  onClose: () => void;
  onSuccess: (partner?: any) => void;
  initialPartner?: any;
}

export const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({
  onClose,
  onSuccess,
  initialPartner,
}) => {
  const [name, setName] = useState(initialPartner?.name || '');
  const [description, setDescription] = useState(initialPartner?.description || '');
  const [workingHours, setWorkingHours] = useState(initialPartner?.workingHours || '10:00 - 23:00');
  
  const [openTime, setOpenTime] = useState<string>(() => {
    if (initialPartner?.workingHours) {
      const parts = initialPartner.workingHours.split('-');
      if (parts[0]) return parts[0].trim();
    }
    return '10:00';
  });
  const [closeTime, setCloseTime] = useState<string>(() => {
    if (initialPartner?.workingHours) {
      const parts = initialPartner.workingHours.split('-');
      if (parts[1]) return parts[1].trim();
    }
    return '23:00';
  });

  const [category, setCategory] = useState<PartnerCategory>(initialPartner?.category || 'HORECA');
  const [customCategories, setCustomCategories] = useState<string[]>(['Фитнес & Спорт', 'Шопинг & Ритейл', 'Отели & Виллы']);
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [role, setRole] = useState<'OWNER' | 'MANAGER' | 'WAITER'>('OWNER');

  const handleAddCustomCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    triggerNotificationHaptic('success');
    if (!customCategories.includes(trimmed)) {
      setCustomCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed as PartnerCategory);
    setNewCategoryInput('');
    setIsCreatingNewCategory(false);
  };
  const [address, setAddress] = useState(initialPartner?.address || '');
  const [logoUrl, setLogoUrl] = useState(initialPartner?.logoUrl || '');
  const [lat, setLat] = useState<number>(initialPartner?.lat || 10.1982);
  const [lng, setLng] = useState<number>(initialPartner?.lng || 103.9634);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialPartner?.googleMapsUrl || '');
  const [googleRating, setGoogleRating] = useState<number | ''>(initialPartner?.googleRating ?? '');
  const [googleReviewsCount, setGoogleReviewsCount] = useState<number | ''>(initialPartner?.googleReviewsCount ?? '');
  const [basicThreshold, setBasicThreshold] = useState<number>(initialPartner?.basicThreshold ?? 0);
  const [silverThreshold, setSilverThreshold] = useState<number>(initialPartner?.silverThreshold ?? 300000);
  const [goldThreshold, setGoldThreshold] = useState<number>(initialPartner?.goldThreshold ?? 600000);
  const [platinumThreshold, setPlatinumThreshold] = useState<number>(initialPartner?.platinumThreshold ?? 1000000);
  const [loading, setLoading] = useState(false);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Живой поиск мест на Google Maps
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Определение геолокации пользователя при открытии (если не редактируем существующее)
  useEffect(() => {
    if (!initialPartner && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          setLat(userLat);
          setLng(userLng);
          if (leafletMap.current && markerRef.current) {
            leafletMap.current.setView([userLat, userLng], 15);
            markerRef.current.setLatLng([userLat, userLng]);
          }
        },
        (err) => console.warn('Geolocation warning:', err.message),
        { timeout: 5000 }
      );
    }
  }, [initialPartner]);

  // Обработчик живого поиска по названию/адресу с учетом координат и сортировки по близости
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/guest/places-search?query=${encodeURIComponent(searchQuery)}&lat=${lat}&lng=${lng}`);
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
  }, [searchQuery, lat, lng]);

  const selectPlaceResult = (place: any) => {
    if (place.name) setName(place.name);
    if (place.address) setAddress(place.address);
    if (place.lat) setLat(place.lat);
    if (place.lng) setLng(place.lng);
    if (place.googleRating !== undefined) setGoogleRating(place.googleRating);
    if (place.googleReviewsCount !== undefined) setGoogleReviewsCount(place.googleReviewsCount);
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

  // Разбор вставленной ссылки Google Maps и получение данных из API
  const handleGoogleUrlChange = async (url: string) => {
    setGoogleMapsUrl(url);
    if (!url || url.trim().length < 5) return;

    // Быстрый локальный разбор координат из URL (@lat,lng)
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
    }

    // Глубокий парсинг через серверную функцию parse-google-url
    try {
      setIsParsingUrl(true);
      const res = await fetch('/api/guest/parse-google-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.name) setName(d.name);
        if (d.address) setAddress(d.address);
        if (d.lat && d.lng) {
          setLat(d.lat);
          setLng(d.lng);
          if (leafletMap.current && markerRef.current) {
            leafletMap.current.setView([d.lat, d.lng], 16);
            markerRef.current.setLatLng([d.lat, d.lng]);
          }
        }
        if (d.googleRating !== undefined) setGoogleRating(d.googleRating);
        if (d.googleReviewsCount !== undefined) setGoogleReviewsCount(d.googleReviewsCount);
        if (d.workingHours) {
          setWorkingHours(d.workingHours);
          const parts = d.workingHours.split('-');
          if (parts.length === 2) {
            setOpenTime(parts[0].trim());
            setCloseTime(parts[1].trim());
          }
        }
        triggerNotificationHaptic('success');
      }
    } catch (err) {
      console.warn('Parse Google URL failed:', err);
    } finally {
      setIsParsingUrl(false);
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
          description,
          workingHours,
          category,
          address,
          logoUrl,
          lat,
          lng,
          googleMapsUrl,
          googleRating: googleRating !== '' ? Number(googleRating) : undefined,
          googleReviewsCount: googleReviewsCount !== '' ? Number(googleReviewsCount) : undefined,
          basicThreshold,
          silverThreshold,
          goldThreshold,
          platinumThreshold,
          telegramId: tgUser?.id,
          role
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Ошибка при сохранении заведения');
      }

      triggerNotificationHaptic('success');
      onSuccess(data.partner);
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
              <p className="text-[11px] text-slate-400">Данные заведения и выбор роли пользователя</p>
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

          {/* Выбор роли пользователя */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              👑 Ваша роль в заведении
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRole('OWNER');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                  role === 'OWNER'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                👑 Владелец
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRole('MANAGER');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                  role === 'MANAGER'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                👔 Админ
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRole('WAITER');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                  role === 'WAITER'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                👨‍🍳 Стаф
              </button>
            </div>
          </div>

          {/* 🌟 Ссылка на Google Maps (поднята наверх для мгновенного автозаполнения) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <LinkIcon className="w-3.5 h-3.5 text-amber-400 inline" />
                <span>Ссылка на Google Maps (Автозаполнение)</span>
              </span>
              {isParsingUrl && <span className="text-[10px] text-amber-400 animate-pulse">Парсинг данных...</span>}
            </label>
            <div className="relative">
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => handleGoogleUrlChange(e.target.value)}
                placeholder="Вставьте ссылку Google Maps (например, https://maps.app.goo.gl/...)..."
                className="w-full py-2.5 pl-3 pr-10 rounded-xl bg-slate-950 border border-amber-500/40 text-slate-100 text-xs focus:border-amber-400 outline-none transition-all shadow-md"
              />
              {isParsingUrl ? (
                <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Globe className="w-4 h-4 text-amber-400/60 absolute right-3 top-3 pointer-events-none" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              📍 Вставьте ссылку на Google Карты — название, координаты, отзывы и часы работы заполнятся автоматически.
            </p>
          </div>

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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{place.name}</h4>
                        {place.distanceStr && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0 ml-2">
                            📍 {place.distanceStr}
                          </span>
                        )}
                      </div>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Категория
                </label>
                {!isCreatingNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setIsCreatingNewCategory(true);
                    }}
                    className="text-[10px] font-extrabold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3 h-3 text-amber-400 inline" />
                    <span>Создать новую</span>
                  </button>
                )}
              </div>

              {!isCreatingNewCategory ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === 'CREATE_NEW') {
                      setIsCreatingNewCategory(true);
                    } else {
                      setCategory(e.target.value as PartnerCategory);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all font-semibold"
                >
                  <option value="HORECA">HoReCa (Рестораны/Бары)</option>
                  <option value="BEAUTY_SPA">Beauty & Spa</option>
                  <option value="AUTO_MOTO">Auto & Moto</option>
                  <option value="ENTERTAINMENT">Развлечения & Яхты</option>
                  <option value="SERVICES">Услуги & Сервис</option>
                  {customCategories.map((c) => (
                    <option key={c} value={c}>✨ {c}</option>
                  ))}
                  <option value="CREATE_NEW">➕ Создать новую категорию...</option>
                </select>
              ) : (
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-950 border border-amber-500/40 animate-fadeIn">
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      autoFocus
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                      placeholder="Название новой категории..."
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-amber-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddCustomCategory()}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shrink-0 active:scale-95"
                    >
                      Добавить
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(false)}
                      className="px-2 py-1.5 bg-slate-800 text-slate-400 hover:text-white text-xs rounded-lg shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[9px] text-amber-300">Пример: Фитнес & Спорт, Отели & Виллы, Шопинг</p>
                </div>
              )}
            </div>
          </div>

          {/* Описание заведения & Часы работы (с выпадающим списком / селектором времени) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Описание заведения
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Короткое описание для клиентов..."
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Часы работы (выбор времени)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <span className="text-[9px] text-slate-500 block mb-0.5 font-bold">Открытие</span>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => {
                      const newOpen = e.target.value;
                      setOpenTime(newOpen);
                      setWorkingHours(`${newOpen} - ${closeTime}`);
                    }}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none font-mono"
                  />
                </div>
                <span className="text-slate-500 font-bold mt-3">–</span>
                <div className="flex-1">
                  <span className="text-[9px] text-slate-500 block mb-0.5 font-bold">Закрытие</span>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => {
                      const newClose = e.target.value;
                      setCloseTime(newClose);
                      setWorkingHours(`${openTime} - ${newClose}`);
                    }}
                    className="w-full py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none font-mono"
                  />
                </div>
              </div>
              
              {/* Пресеты быстрого выбора времени */}
              <div className="flex items-center space-x-1 mt-1.5 overflow-x-auto pb-0.5">
                {['09:00 - 22:00', '10:00 - 23:00', '12:00 - 00:00', '24/7'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      if (preset === '24/7') {
                        setWorkingHours('24/7 (Круглосуточно)');
                        setOpenTime('00:00');
                        setCloseTime('23:59');
                      } else {
                        setWorkingHours(preset);
                        const [o, c] = preset.split(' - ');
                        if (o && c) {
                          setOpenTime(o.trim());
                          setCloseTime(c.trim());
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold border transition-all whitespace-nowrap ${
                      workingHours.includes(preset)
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Адрес */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Официальный адрес <span className="text-[10px] text-slate-500 font-normal">(опционально)</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="город, улица, дом (опционально)..."
                className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none transition-all"
              />
            </div>
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

          {/* Рейтинг Google Maps и отзывы (оставляются пустыми, если не удалось спарсить) */}
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
                placeholder="Оставить пустым..."
                onChange={(e) => setGoogleRating(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                placeholder="Оставить пустым..."
                onChange={(e) => setGoogleReviewsCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          {/* 🎁 Условия выдачи категорий подарков (Пороги чека заведения) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                🎁
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">
                  Пороги чека для уровней подарков
                </h3>
                <p className="text-[10px] text-slate-400">
                  Укажите, от какой суммы чека официанты этого заведения выдают Серебряный, Золотой и Платиновый боксы
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Silver threshold */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-200 flex items-center space-x-1.5">
                    <span>🥈 Серебряный бокс (Silver)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    от {(silverThreshold / 1000).toFixed(0)}k VND
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={silverThreshold}
                    onChange={(e) => setSilverThreshold(parseFloat(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold outline-none focus:border-amber-500"
                    placeholder="300000"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">VND</span>
                </div>
                <div className="flex space-x-1 overflow-x-auto pt-0.5">
                  {[200000, 300000, 400000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { triggerHaptic('light'); setSilverThreshold(val); }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                        silverThreshold === val ? 'bg-slate-200 text-slate-950 border-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Gold threshold */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-400 flex items-center space-x-1.5">
                    <span>🥇 Золотой бокс (Gold)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    от {(goldThreshold / 1000).toFixed(0)}k VND
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    value={goldThreshold}
                    onChange={(e) => setGoldThreshold(parseFloat(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold outline-none focus:border-amber-500"
                    placeholder="600000"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">VND</span>
                </div>
                <div className="flex space-x-1 overflow-x-auto pt-0.5">
                  {[500000, 600000, 700000, 800000, 1000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { triggerHaptic('light'); setGoldThreshold(val); }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                        goldThreshold === val ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platinum threshold */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-purple-500/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-purple-300 flex items-center space-x-1.5">
                    <span>💎 Платиновый VIP бокс (Platinum)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    от {(platinumThreshold / 1000000).toFixed(1)}M VND
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="100000"
                    min="0"
                    value={platinumThreshold}
                    onChange={(e) => setPlatinumThreshold(parseFloat(e.target.value) || 0)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono font-bold outline-none focus:border-amber-500"
                    placeholder="1000000"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">VND</span>
                </div>
                <div className="flex space-x-1 overflow-x-auto pt-0.5">
                  {[1000000, 1200000, 1500000, 2000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { triggerHaptic('light'); setPlatinumThreshold(val); }}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${
                        platinumThreshold === val ? 'bg-purple-500 text-slate-950 border-purple-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {(val / 1000000).toFixed(1)}M
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialPartner ? 'СОХРАНИТЬ ЛОКАЦИЮ' : 'СОЗДАТЬ БИЗНЕС'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
