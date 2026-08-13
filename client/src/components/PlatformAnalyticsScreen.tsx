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
  Search
} from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface PlatformAnalyticsScreenProps {
  onClose?: () => void;
}

export const PlatformAnalyticsScreen: React.FC<PlatformAnalyticsScreenProps> = ({ onClose }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('ALL');
  const [activationFee, setActivationFee] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [analyticsData, setAnalyticsData] = useState<any>({
    summary: {
      totalIssuedBoxes: 0,
      totalActivations: 0,
      totalActiveVouchers: 0,
      totalExpiredVouchers: 0,
      estimatedRevenue: 0,
      overallConversionRate: 0
    },
    boxStats: [],
    partnerStats: [],
    offerStats: []
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        period,
        partnerId: selectedPartnerId,
        activationFee: activationFee.toString()
      });

      const res = await fetch(`/api/admin/analytics?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
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
    
    // Формирование файла CSV для скачивания биллинг-отчета
    const headers = ['Заведение', 'Категория', 'Адрес', 'Выдано боксов', 'Сканирований (Активаций)', 'Конверсия %', `Начислено ($${activationFee}/активация)`];
    const rows = analyticsData.partnerStats.map((p: any) => [
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.address}"`,
      p.issuedCount,
      p.activationsCount,
      `${p.conversionRate}%`,
      `$${p.billedAmount.toFixed(2)}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GiftX_Monetization_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPartners = analyticsData.partnerStats.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOffers = analyticsData.offerStats.filter((o: any) =>
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-5 animate-fadeIn">
      {/* 1. Хэдер экрана статистики */}
      <div className="glass-card p-5 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 shadow-2xl relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Платформа Монетизации</span>
          </div>
          <h1 className="text-xl font-black text-slate-100">Статистика и Биллинг</h1>
          <p className="text-xs text-slate-400">Посещаемость, реализация боксов и выручка</p>
        </div>

        {onClose && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Баннер Модели Монетизации GiftX */}
      <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Модель Монетизации: Pay-Per-Activation
              </h3>
              <p className="text-[10px] text-slate-400">Плата взимается за сканирование QR-кода при использовании подарка</p>
            </div>
          </div>
        </div>

        {/* Настройка тарифной ставки за 1 сканирование */}
        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs">
          <span className="text-slate-300 font-bold">Ставка за 1 активацию:</span>
          <div className="flex items-center space-x-1.5">
            {[0.5, 1.0, 2.0].map((feeVal) => (
              <button
                key={feeVal}
                onClick={() => {
                  triggerHaptic('light');
                  setActivationFee(feeVal);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  activationFee === feeVal
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                ${feeVal.toFixed(2)}
              </button>
            ))}
            <div className="relative w-16">
              <input
                type="number"
                step="0.1"
                value={activationFee}
                onChange={(e) => setActivationFee(parseFloat(e.target.value) || 1.0)}
                className="w-full pl-4 pr-1 py-1 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs font-bold text-center outline-none focus:border-amber-500"
              />
              <span className="absolute left-1.5 top-1 text-slate-500 text-[10px]">$</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Фильтры периодов и заведений */}
      <div className="space-y-2.5">
        <div className="flex space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md">
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
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                period === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Поиск и Фильтр по заведению */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по заведению или акции..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <button
            onClick={handleExportCSV}
            title="Скачать биллинг-отчет CSV"
            className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center space-x-1 transition-all shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Отчет</span>
          </button>
        </div>
      </div>

      {/* 4. Сводные метрики KPI монетизации */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center space-x-1">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span>Выдано боксов</span>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {analyticsData.summary.totalIssuedBoxes}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Все сгенерированные боксы</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 shadow-lg">
          <div className="text-[10px] uppercase font-extrabold text-amber-400 flex items-center space-x-1">
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Активаций (QR Сканов)</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {analyticsData.summary.totalActivations}
          </div>
          <p className="text-[9px] text-emerald-400 font-bold mt-0.5">
            Конверсия: {analyticsData.summary.overallConversionRate}%
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 shadow-lg">
          <div className="text-[10px] uppercase font-extrabold text-emerald-400 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Выручка GiftX</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ${analyticsData.summary.estimatedRevenue.toFixed(2)}
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">По тарифу ${activationFee}/скан</p>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <div className="text-[10px] uppercase font-extrabold text-cyan-400 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Площадок в сети</span>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-1">
            {analyticsData.partnerStats.length}
          </div>
          <p className="text-[9px] text-slate-500 mt-0.5">Заведений с активациями</p>
        </div>
      </div>

      {/* 5. СТАТИСТИКА РЕАЛИЗАЦИИ БОКСОВ ПО ВИДАМ (BASIC, SILVER, GOLD, PLATINUM) */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Реализация Боксов по Видам
              </h3>
              <p className="text-[10px] text-slate-400">Статистика по уровням суммы чека</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {analyticsData.boxStats.map((box: any) => {
            const getBoxBadgeStyle = (lvl: string) => {
              switch (lvl) {
                case 'BASIC': return 'border-purple-500/30 text-purple-300 bg-purple-950/30';
                case 'SILVER': return 'border-cyan-500/30 text-cyan-300 bg-cyan-950/30';
                case 'GOLD': return 'border-amber-500/40 text-amber-400 bg-amber-950/30';
                case 'PLATINUM': return 'border-purple-400/50 text-purple-200 bg-purple-900/30';
                default: return 'border-slate-800 text-slate-300 bg-slate-950';
              }
            };

            return (
              <div
                key={box.level}
                className={`p-3 rounded-2xl border ${getBoxBadgeStyle(box.level)} space-y-2 shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wider">{box.title}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">
                    {box.conversionRate}% конверсия
                  </span>
                </div>

                <p className="text-[9px] text-slate-400 line-clamp-1">{box.description}</p>

                <div className="space-y-1 pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Выдано:</span>
                    <span className="font-extrabold text-slate-200">{box.issuedCount} шт.</span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400 font-bold">Сканов (QR):</span>
                    <span className="font-black text-amber-400">{box.activationsCount} шт.</span>
                  </div>

                  <div className="flex justify-between text-[10px] pt-0.5 text-emerald-400 font-mono font-bold">
                    <span>Доход:</span>
                    <span>${box.revenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. ТАБЛИЦА БИЛЛИНГА ЗАВЕДЕНИЙ (Monetization & Invoicing per partner) */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
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

        <div className="space-y-2.5">
          {filteredPartners.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
              Заведений по заданным параметрам не найдено
            </div>
          ) : (
            filteredPartners.map((p: any) => (
              <div key={p.id} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.logoUrl}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-100 text-xs">{p.name}</h4>
                      <span className="text-[9px] uppercase font-bold text-amber-400">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-400 block font-mono">
                      ${p.billedAmount.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {p.activationsCount} сканов QR
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Выдано: <strong className="text-slate-200">{p.issuedCount}</strong></span>
                  <span>Активаций: <strong className="text-amber-400">{p.activationsCount}</strong></span>
                  <span>Конверсия: <strong className="text-emerald-400">{p.conversionRate}%</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 7. СПИСОК ДОСТУПНЫХ ПОДАРКОВ И ИХ ЭФФЕКТИВНОСТЬ */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 bg-slate-900/90 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
                Подарки и Акции ({filteredOffers.length})
              </h3>
              <p className="text-[10px] text-slate-400">Эффективность каждого подарка сети</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
          {filteredOffers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
              Акции не найдены
            </div>
          ) : (
            filteredOffers.map((offer: any) => (
              <div key={offer.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-100">{offer.title}</span>
                      <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {offer.discountValue}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      🏬 {offer.partnerName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-amber-400 block">{offer.activationsCount} сканов</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">${offer.revenue.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Выдано: {offer.claimedCount}</span>
                  <span>Срок: {offer.validityHours}ч</span>
                  <span>Конверсия: <strong className="text-emerald-400">{offer.conversionRate}%</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
