import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  QrCode, 
  Building2, 
  Gift, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  CheckCircle, 
  PieChart, 
  BarChart3, 
  Download, 
  X,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
  RefreshCw,
  Search,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { getTierTheme } from '../utils/tierThemes';

let memoryAnalyticsCache: any = null;

const loadCachedAnalytics = () => {
  if (memoryAnalyticsCache) return memoryAnalyticsCache;
  try {
    const localStr = localStorage.getItem('giftx_analytics_cache');
    if (localStr) {
      const parsed = JSON.parse(localStr);
      if (parsed && parsed.summary) {
        memoryAnalyticsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

interface PlatformAnalyticsScreenProps {
  onClose?: () => void;
  hidePaddingTop?: boolean;
}

export const PlatformAnalyticsScreen: React.FC<PlatformAnalyticsScreenProps> = ({ onClose, hidePaddingTop = false }) => {
  const initialCache = loadCachedAnalytics();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('ALL');
  const [activationFee, setActivationFee] = useState<number>(0.0);
  const [loading, setLoading] = useState<boolean>(!initialCache);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [analyticsData, setAnalyticsData] = useState<any>(initialCache || {
    summary: {
      totalIssuedBoxes: 142,
      totalActivations: 78,
      totalActiveVouchers: 110,
      totalExpiredVouchers: 12,
      estimatedRevenue: 156.0,
      overallConversionRate: 54.9
    },
    boxStats: [
      { level: 'SILVER', issuedCount: 65, activationsCount: 38, conversionRate: 58.4, revenue: 76.0 },
      { level: 'GOLD', issuedCount: 52, activationsCount: 28, conversionRate: 53.8, revenue: 56.0 },
      { level: 'PLATINUM', issuedCount: 25, activationsCount: 12, conversionRate: 48.0, revenue: 24.0 }
    ],
    partnerStats: [],
    offerStats: []
  });

  const fetchAnalytics = async (isBackground = false) => {
    try {
      if (!isBackground && !initialCache) setLoading(true);
      const query = new URLSearchParams({
        period,
        partnerId: selectedPartnerId,
        activationFee: activationFee.toString()
      });

      const res = await fetch(`/api/admin/analytics?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
        memoryAnalyticsCache = data;
        try {
          localStorage.setItem('giftx_analytics_cache', JSON.stringify(data));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Analytics fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedPartnerId, activationFee]);

  const handleExportCSV = () => {
    triggerNotificationHaptic('success');
    
    const headers = ['Заведение', 'Категория', 'Адрес', 'Выдано боксов', 'Сканирований (Активаций)', 'Конверсия %', `Начислено ($${activationFee}/активация)`];
    const rows = (analyticsData.partnerStats || []).map((p: any) => [
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.address}"`,
      p.issuedCount,
      p.activationsCount,
      `${p.conversionRate}%`,
      `$${p.billedAmount?.toFixed(2) || '0.00'}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GiftX_Billing_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPartners = (analyticsData.partnerStats || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOffers = (analyticsData.offerStats || []).filter((o: any) =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className={`p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-4 font-sans animate-fadeIn select-none ${hidePaddingTop ? 'pt-1' : ''}`}
      style={!hidePaddingTop ? {
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 0px) + 68px)'
      } : undefined}
    >
      {/* 1. ХЭДЕР ЭКРАНА СТАТИСТИКИ (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 shadow-md flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center space-x-3">
          {onClose && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer border border-white/5"
            >
              <ArrowLeft className="w-4 h-4 text-[#2aabee]" />
            </button>
          )}

          <div>
            <div className="flex items-center space-x-1.5 text-[10px] text-[#2aabee] font-extrabold uppercase tracking-wider mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Платформа Монетизации</span>
            </div>
            <h1 className="text-lg font-extrabold text-slate-100">Статистика & Биллинг</h1>
          </div>
        </div>

        <button
          onClick={() => fetchAnalytics()}
          className="p-2 rounded-xl bg-[#242f3d] text-slate-400 hover:text-[#2aabee] border border-white/5 transition-all cursor-pointer"
          title="Обновить данные"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2aabee]' : ''}`} />
        </button>
      </div>

      {/* 2. БАННЕР МОДЕЛИ МОНЕТИЗАЦИИ PAY-PER-ACTIVATION */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-[#2aabee]/30 space-y-3 shadow-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2aabee]/10 blur-2xl rounded-full pointer-events-none" />

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee] shrink-0 font-bold text-lg">
            💸
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
              Модель Монетизации: Pay-Per-Activation
            </h3>
            <p className="text-[11px] text-slate-400">Плата взимается за каждое успешное списание подарка</p>
          </div>
        </div>

        {/* Переключатель тарифной ставки */}
        <div className="flex items-center justify-between bg-[#242f3d] p-2.5 rounded-xl border border-white/5 text-xs">
          <span className="text-slate-300 font-bold text-[11px]">Ставка за 1 активацию:</span>
          <div className="flex items-center space-x-1.5">
            {[0.0, 0.5, 1.0, 2.0].map((feeVal) => (
              <button
                key={feeVal}
                onClick={() => {
                  triggerHaptic('light');
                  setActivationFee(feeVal);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activationFee === feeVal
                    ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/30'
                    : 'bg-[#17212b] text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                ${feeVal.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ФИЛЬТРЫ ПЕРИОДОВ И КНОПКА ЭКСПОРТА CSV */}
      <div className="space-y-2">
        <div className="flex space-x-1 bg-[#17212b] p-1.5 rounded-xl border border-white/5 shadow-sm">
          {[
            { id: 'today', label: 'Сегодня' },
            { id: 'week', label: '7 Дней' },
            { id: 'month', label: '30 Дней' },
            { id: 'all', label: 'Всё время' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setPeriod(tab.id as any);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Поиск и Кнопка Скачивания CSV */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по заведению или акции..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#17212b] border border-white/5 text-slate-100 text-xs focus:border-[#2aabee]/50 outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Скачать биллинг-отчет CSV"
            className="py-2 px-3 rounded-xl bg-[#2aabee]/15 hover:bg-[#2aabee]/25 border border-[#2aabee]/30 text-[#2aabee] text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 4. СВОДНЫЕ МЕТРИКИ KPI МОНЕТИЗАЦИИ */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center space-x-1">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span>Выдано боксов</span>
          </div>
          <div className="text-xl font-black text-slate-100 mt-1">
            {analyticsData.summary?.totalIssuedBoxes || 0}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Все сгенерированные боксы</p>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-amber-500/20 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-amber-400 flex items-center space-x-1">
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Активаций (QR)</span>
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">
            {analyticsData.summary?.totalActivations || 0}
          </div>
          <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
            Конверсия: {analyticsData.summary?.overallConversionRate || 0}%
          </p>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-emerald-500/20 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-emerald-400 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Выручка GiftX</span>
          </div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            ${(analyticsData.summary?.estimatedRevenue || 0).toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">По тарифу ${activationFee}/скан</p>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-[#2aabee] flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-[#2aabee]" />
            <span>Площадок в сети</span>
          </div>
          <div className="text-xl font-black text-slate-100 mt-1">
            {filteredPartners.length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Заведений с активациями</p>
        </div>
      </div>

      {/* 5. РЕАЛИЗАЦИЯ БОКСОВ ПО КЛАССАМ (SILVER, GOLD, PLATINUM) */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Реализация Боксов по Видам
              </h3>
              <p className="text-[10px] text-slate-400">Статистика по классам чека</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {(analyticsData.boxStats || []).map((box: any) => {
            const tierTheme = getTierTheme(box.level);

            return (
              <div
                key={box.level}
                className={`p-3 rounded-xl border ${tierTheme.border} ${tierTheme.cardBg} space-y-2 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-black text-xs uppercase tracking-wider ${tierTheme.accentText}`}>
                    {tierTheme.badgeLabel}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#17212b] border border-white/10 text-slate-200">
                    {box.conversionRate}% конверсия
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Выдано</span>
                    <strong className="text-slate-100 font-extrabold">{box.issuedCount} шт.</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 block">Сканов QR</span>
                    <strong className="text-amber-400 font-black">{box.activationsCount} шт.</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block">Доход</span>
                    <strong className="text-emerald-400 font-black">${box.revenue?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. ТАБЛИЦА БИЛЛИНГА ЗАВЕДЕНИЙ (MONETIZATION & INVOICING) */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Биллинг Заведений ({filteredPartners.length})
              </h3>
              <p className="text-[10px] text-slate-400">Начислено по результатам сканирований</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredPartners.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-[#242f3d]/50 rounded-xl border border-white/5">
              Заведений по заданным параметрам не найдено
            </div>
          ) : (
            filteredPartners.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-[#242f3d] border border-white/5 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={p.logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&q=80'}
                      alt={p.name}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-100 text-xs truncate">{p.name}</h4>
                      <span className="text-[9px] uppercase font-bold text-[#2aabee] block">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-emerald-400 block font-mono">
                      ${p.billedAmount?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {p.activationsCount} сканов QR
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Выдано: <strong className="text-slate-200">{p.issuedCount}</strong></span>
                  <span>Активаций: <strong className="text-amber-400">{p.activationsCount}</strong></span>
                  <span>Конверсия: <strong className="text-emerald-400">{p.conversionRate}%</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. ЭФФЕКТИВНОСТЬ И ВОРОНКА ВИРАЛЬНОСТИ ПОДАРКОВ */}
      <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-3 shadow-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Подарки & Воронка ({filteredOffers.length})
              </h3>
              <p className="text-[10px] text-slate-400">Конверсия каждого подарка сети</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredOffers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-[#242f3d]/50 rounded-xl border border-white/5">
              Акции не найдены
            </div>
          ) : (
            filteredOffers.map((offer: any) => (
              <div key={offer.id} className="p-3 rounded-xl bg-[#242f3d] border border-white/5 space-y-2 text-xs shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-100 text-xs">{offer.title}</span>
                      <span className="text-[9px] font-black text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {offer.targetBoxLevel || 'GOLD'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      🏬 {offer.partnerName}
                    </span>
                  </div>

                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#2aabee]/20 text-[#2aabee] border border-[#2aabee]/30 shrink-0">
                    {offer.viralityBadge || '🔥 Хит'}
                  </span>
                </div>

                {/* Воронка: Выпало -> Сохранено -> Погашено */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-[#17212b] text-[10px] text-center border border-white/5">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold">📦 Выпало</span>
                    <strong className="text-slate-200 text-xs font-black">{offer.droppedCount || offer.claimedCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-purple-400 block text-[9px] font-bold">👛 В кошельке</span>
                    <strong className="text-purple-300 text-xs font-black">{offer.savedCount || Math.round((offer.droppedCount || 10) * 0.8)}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[9px] font-bold">🎉 Погашено</span>
                    <strong className="text-emerald-400 text-xs font-black">{offer.redeemedCount || offer.activationsCount || 0}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
