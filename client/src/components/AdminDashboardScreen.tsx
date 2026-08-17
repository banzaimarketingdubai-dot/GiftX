import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Gift,
  TrendingUp,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Star,
  Plus,
  Sliders,
  ChevronRight,
  Search,
  FileText,
  Check,
  XCircle,
  UserCheck,
  Link,
  Copy
} from 'lucide-react';
import { Partner, StaffMember, VoucherOffer, PartnerCategory, VoucherCategory, BoxLevel } from '../types';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { BusinessOnboardingModal } from './BusinessOnboardingModal';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

import { DemoBoxOpeningModal } from './DemoBoxOpeningModal';
import { PlatformAnalyticsScreen } from './PlatformAnalyticsScreen';
import { SuperAdminDbScreen } from './SuperAdminDbScreen';
import { VenueAvatar } from './VenueAvatar';

export const AdminDashboardScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VENUES' | 'MODERATION' | 'STAFF' | 'APPLICATIONS' | 'OFFERS' | 'ANALYTICS' | 'DATABASE'>('VENUES');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDemoBoxModal, setShowDemoBoxModal] = useState(false);

  const [stats, setStats] = useState({
    totalPartners: 0,
    totalStaff: 0,
    totalOffers: 0,
    totalClaimed: 0,
    totalRedeemed: 0,
    redemptionRate: 0,
  });

  const [partners, setPartners] = useState<any[]>([]);

  // Состояние заявок персонала
  const [applications, setApplications] = useState<any[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Состояние развернутых секций стаффа и подарков внутри карточки заведения
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);
  const [expandedVenueTab, setExpandedVenueTab] = useState<'STAFF' | 'GIFTS'>('STAFF');

  // Состояние модалок
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showBusinessOnboardingModal, setShowBusinessOnboardingModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any | null>(null);
  const [copiedPartnerId, setCopiedPartnerId] = useState<string | null>(null);

  const handleCopyPartnerWebUrl = (partnerId: string) => {
    triggerHaptic('light');
    triggerNotificationHaptic('success');
    const origin = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://gift-x.vercel.app';
    const url = `${origin}/?venue=${partnerId}`;
    navigator.clipboard.writeText(url);
    setCopiedPartnerId(partnerId);
    setTimeout(() => setCopiedPartnerId(null), 2500);
  };

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ id: '', partnerId: '', name: '', role: 'WAITER', telegramId: '' });

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    id: '',
    partnerId: '',
    title: '',
    description: '',
    imageUrl: '',
    category: 'TRAFFIC_MAGNET' as VoucherCategory,
    validityHours: 72,
    totalLimit: 1000,
  });

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setPartners(data.partners);
      } else {
        setError(data.error || 'Ошибка загрузки данных');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePartner = async (partnerId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      triggerNotificationHaptic(status === 'APPROVED' ? 'success' : 'warning');
      const res = await fetch(`/api/admin/partner/${partnerId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchOverview();
      }
    } catch (e) {
      console.error('Moderate partner error', e);
    }
  };

  const fetchApplications = async () => {
    try {
      const query = new URLSearchParams();
      if (appSearch) query.set('search', appSearch);
      if (appStatusFilter !== 'ALL') query.set('status', appStatusFilter);

      const res = await fetch(`/api/admin/applications?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (e) {
      console.error('Fetch applications error', e);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [appSearch, appStatusFilter, activeTab]);

  const handleApproveApplication = async (id: string) => {
    try {
      triggerNotificationHaptic('success');
      const res = await fetch(`/api/admin/applications/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchApplications();
        fetchOverview();
      }
    } catch (e) {
      console.error('Approve app error', e);
    }
  };

  const handleRejectApplication = async (id: string) => {
    try {
      triggerNotificationHaptic('warning');
      const res = await fetch(`/api/admin/applications/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchApplications();
      }
    } catch (e) {
      console.error('Reject app error', e);
    }
  };

  // Добавление / Обновление сотрудника
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        setShowStaffModal(false);
        fetchOverview();
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (err: any) {
      alert('Ошибка добавления сотрудника: ' + err.message);
    }
  };

  // Удаление заведения
  const handleDeletePartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`Вы уверены, что хотите полностью удалить заведение «${partnerName}» и всех привязанных сотрудников?`)) return;
    try {
      const res = await fetch(`/api/admin/partner/${partnerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        fetchOverview();
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (e: any) {
      console.error('Delete partner error', e);
    }
  };

  // Удаление сотрудника
  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Удалить данного сотрудника?')) return;
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        fetchOverview();
      }
    } catch (e) {
      console.error('Delete staff error', e);
    }
  };

  // Добавление / Обновление ваучера
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...offerForm,
        discountValue: (offerForm as any).discountValue || 'ПОДАРОК'
      };
      const res = await fetch('/api/admin/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        setShowOfferModal(false);
        fetchOverview();
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (err: any) {
      alert('Ошибка сохранения ваучера: ' + err.message);
    }
  };

  // Удаление ваучера
  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Деактивировать данный ваучер?')) return;
    try {
      const res = await fetch(`/api/admin/offer/${offerId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        fetchOverview();
      }
    } catch (e) {
      console.error('Delete offer error', e);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-4 font-sans">
      {/* Шапка админ-панели (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#2aabee] uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Панель Управляющего</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-100">GiftX Admin Center</h1>
        </div>
        
        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowDemoBoxModal(true);
          }}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-bold text-xs shadow-md shadow-[#2aabee]/30 flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
        >
          <Gift className="w-4 h-4 text-white" />
          <span>🎁 Демо-открытие бокса</span>
        </button>
      </div>

      {/* Метрики KPI (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-[#2aabee]" />
            <span>Заведений</span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-1">{stats.totalPartners}</div>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Персонал</span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-1">{stats.totalStaff}</div>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            <span>Выдано подарков</span>
          </div>
          <div className="text-xl font-extrabold text-slate-100 mt-1">{stats.totalClaimed}</div>
        </div>

        <div className="bg-[#17212b] p-3.5 rounded-2xl border border-white/5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Гашений</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">{stats.redemptionRate}%</div>
        </div>
      </div>

      {/* Переключатель вкладок админки (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="flex space-x-1 bg-[#17212b] p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar shadow-md">
        {[
          { id: 'VENUES', label: '🏢 Заведения' },
          { id: 'MODERATION', label: `⚖️ Модерация (${partners.filter((p) => p.moderationStatus === 'PENDING').length})` },
          { id: 'STAFF', label: '👥 Персонал & Собственники' },
          { id: 'APPLICATIONS', label: `📥 Заявки (${applications.filter((a) => a.status === 'PENDING').length})` },
          { id: 'OFFERS', label: '🎁 Ваучеры' },
          { id: 'ANALYTICS', label: '📊 Аналитика' },
          { id: 'DATABASE', label: '🗄️ Моделирование БД' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              triggerHaptic('light');
              setActiveTab(tab.id as any);
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ВКЛАДКА 1: ЗАВЕДЕНИЯ */}
      {activeTab === 'VENUES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Список партнеров ({partners.length})
            </h3>
            <button
              onClick={() => {
                triggerHaptic('light');
                setEditingPartner(null);
                setShowBusinessOnboardingModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center space-x-1 hover:bg-amber-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Новое заведение</span>
            </button>
          </div>

          <div className="space-y-3">
            {partners.map((partner) => {
              const isExpanded = expandedVenueId === partner.id;
              const staffMembers = partner.staffMembers || [];
              const voucherOffers = partner.voucherOffers || [];

              return (
                <div key={partner.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <VenueAvatar
                        logoUrl={partner.logoUrl}
                        name={partner.name}
                        className="w-12 h-12 rounded-xl border border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {partner.category}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              partner.activeStatus
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {partner.activeStatus ? 'Активно' : 'Отключено'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm mt-1">{partner.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{partner.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCopyPartnerWebUrl(partner.id)}
                        title="Скопировать прямую Web App ссылку на карточку заведения"
                        className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all flex items-center space-x-1"
                      >
                        {copiedPartnerId === partner.id ? (
                          <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                        ) : (
                          <Link className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setEditingPartner(partner);
                          setShowPartnerModal(true);
                        }}
                        title="Редактировать заведение и пороги чеков"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(partner.id, partner.name)}
                        title="Удалить заведение"
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Пороги выработки чеков */}
                  <div className="pt-2 border-t border-slate-800/60 grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="bg-purple-950/30 p-1.5 rounded-lg border border-purple-500/20 text-center">
                      <span className="text-purple-300 font-bold block">BASIC</span>
                      <span className="text-slate-400">до {(partner.silverThreshold / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-500/20 text-center">
                      <span className="text-cyan-300 font-bold block">SILVER</span>
                      <span className="text-slate-400">{(partner.silverThreshold / 1000).toFixed(0)}k+</span>
                    </div>
                    <div className="bg-amber-950/30 p-1.5 rounded-lg border border-amber-500/20 text-center">
                      <span className="text-amber-300 font-bold block">GOLD</span>
                      <span className="text-slate-400">{(partner.goldThreshold / 1000).toFixed(0)}k+</span>
                    </div>
                  </div>

                  {/* Интерактивные кнопки управления ролями стаффа и подарками заведения */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        if (isExpanded && expandedVenueTab === 'STAFF') {
                          setExpandedVenueId(null);
                        } else {
                          setExpandedVenueId(partner.id);
                          setExpandedVenueTab('STAFF');
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        isExpanded && expandedVenueTab === 'STAFF'
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>👥 Роли стафа ({staffMembers.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        if (isExpanded && expandedVenueTab === 'GIFTS') {
                          setExpandedVenueId(null);
                        } else {
                          setExpandedVenueId(partner.id);
                          setExpandedVenueTab('GIFTS');
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        isExpanded && expandedVenueTab === 'GIFTS'
                          ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>🎁 Подарки ({voucherOffers.length}/3)</span>
                    </button>
                  </div>

                  {/* Встроенный блок управления стаффом и подарками для данного заведения */}
                  {isExpanded && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
                      {/* Переключатель подвкладок внутри заведения */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setExpandedVenueTab('STAFF');
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              expandedVenueTab === 'STAFF'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            👥 Роли стафа ({staffMembers.length})
                          </button>
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              setExpandedVenueTab('GIFTS');
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              expandedVenueTab === 'GIFTS'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            🎁 Подарки ({voucherOffers.length}/3)
                          </button>
                        </div>

                        <button
                          onClick={() => setExpandedVenueId(null)}
                          className="text-slate-500 hover:text-slate-300 p-1"
                          title="Свернуть"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* СЕКЦИЯ 1: Персонал заведения */}
                      {expandedVenueTab === 'STAFF' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Персонал заведения «{partner.name}»
                            </span>
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                setStaffForm({
                                  id: '',
                                  partnerId: partner.id,
                                  name: '',
                                  role: 'WAITER',
                                  telegramId: '',
                                });
                                setShowStaffModal(true);
                              }}
                              className="py-1 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-extrabold text-[11px] border border-cyan-500/40 flex items-center space-x-1 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Назначить роль</span>
                            </button>
                          </div>

                          {staffMembers.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
                              Сотрудники в данное заведение пока не добавлены
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {staffMembers.map((staff: any) => (
                                <div
                                  key={staff.id}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-xs"
                                >
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-slate-100">{staff.name}</span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                                          staff.role === 'OWNER'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : staff.role === 'MANAGER'
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        }`}
                                      >
                                        {staff.role}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                                      Выдано боксов: {staff.boxesIssuedCount || 0} {staff.telegramId ? `| TG: ${staff.telegramId}` : ''}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        triggerHaptic('light');
                                        setStaffForm({
                                          id: staff.id,
                                          partnerId: partner.id,
                                          name: staff.name,
                                          role: staff.role,
                                          telegramId: staff.telegramId ? String(staff.telegramId) : '',
                                        });
                                        setShowStaffModal(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                                      title="Редактировать роль"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStaff(staff.id)}
                                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                      title="Удалить сотрудника"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* СЕКЦИЯ 2: Подарки заведения */}
                      {expandedVenueTab === 'GIFTS' && (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Подарки заведения «{partner.name}»
                            </span>
                            <button
                              onClick={() => {
                                triggerHaptic('light');
                                setOfferForm({
                                  id: '',
                                  partnerId: partner.id,
                                  title: '',
                                  description: '',
                                  imageUrl: '',
                                  category: 'TRAFFIC_MAGNET',
                                  validityHours: 72,
                                  totalLimit: 1000,
                                });
                                setShowOfferModal(true);
                              }}
                              className="py-1 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-extrabold text-[11px] border border-purple-500/40 flex items-center space-x-1 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Добавить подарок</span>
                            </button>
                          </div>

                          {voucherOffers.length === 0 ? (
                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-xs">
                              Подарки для данного заведения еще не созданы
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {voucherOffers.map((offer: any) => (
                                <div
                                  key={offer.id}
                                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-2"
                                >
                                  <div className="flex items-start space-x-2.5 min-w-0">
                                    <img
                                      src={offer.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80'}
                                      alt={offer.title}
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-800 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                                        <span className="text-[9px] font-extrabold uppercase text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                                          {offer.category}
                                        </span>
                                      </div>
                                      <h5 className="font-bold text-slate-100 text-xs mt-0.5 truncate">{offer.title}</h5>
                                      <span className="text-[10px] text-slate-500 block mt-0.5">
                                        ⏳ {offer.validityHours}ч | Выдано: {offer.claimedCount || 0}/{offer.totalLimit}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        triggerHaptic('light');
                                        setOfferForm({
                                          id: offer.id,
                                          partnerId: partner.id,
                                          title: offer.title,
                                          description: offer.description || '',
                                          imageUrl: offer.imageUrl || '',
                                          category: offer.category,
                                          validityHours: offer.validityHours,
                                          totalLimit: offer.totalLimit,
                                        });
                                        setShowOfferModal(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                                      title="Редактировать подарок"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOffer(offer.id)}
                                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                                      title="Удалить подарок"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ВКЛАДКА МОДЕРАЦИЯ ЗАВЕДЕНИЙ */}
      {activeTab === 'MODERATION' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <span>⚖️ Заявки заведений на модерацию</span>
            </h3>
          </div>

          <div className="space-y-3">
            {partners.filter((p) => p.moderationStatus === 'PENDING' || !p.moderationStatus).length === 0 ? (
              <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs">
                🎉 Все новые заведения прошли модерацию! Нет новых заявок.
              </div>
            ) : (
              partners
                .filter((p) => p.moderationStatus === 'PENDING' || !p.moderationStatus)
                .map((partner) => (
                  <div key={partner.id} className="glass-card p-4 rounded-2xl border border-amber-500/30 space-y-3 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <VenueAvatar
                          logoUrl={partner.logoUrl}
                          name={partner.name}
                          className="w-12 h-12 rounded-xl border border-slate-700 shrink-0"
                        />
                        <div>
                          <span className="text-[9px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                            {partner.category}
                          </span>
                          <h4 className="font-bold text-slate-100 text-sm mt-1">{partner.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{partner.address}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 animate-pulse">
                        ⏳ На модерации
                      </span>
                    </div>

                    {partner.description && (
                      <p className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                        📝 «{partner.description}»
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>⏰ Часы: {partner.workingHours || '10:00 - 23:00'}</span>
                      <span>📍 Geo: {partner.lat?.toFixed(3)}, {partner.lng?.toFixed(3)}</span>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleModeratePartner(partner.id, 'REJECTED')}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold text-xs flex items-center justify-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Отклонить</span>
                      </button>

                      <button
                        onClick={() => handleModeratePartner(partner.id, 'APPROVED')}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Одобрить заведение</span>
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 2: ПЕРСОНАЛ И РОЛИ */}
      {activeTab === 'STAFF' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Сотрудники и Роли
            </h3>
            <button
              onClick={() => {
                triggerHaptic('light');
                setStaffForm({ id: '', partnerId: partners[0]?.id || '', name: '', role: 'WAITER', telegramId: '' });
                setShowStaffModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-xs flex items-center space-x-1 hover:bg-cyan-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Назначить роль</span>
            </button>
          </div>

          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 pb-2 border-b border-slate-800">
                  <span>🏢 {partner.name}</span>
                  <span className="text-slate-400 font-normal">
                    {partner.staffMembers?.length || 0} сотрудников
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {partner.staffMembers?.map((staff: any) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100">{staff.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              staff.role === 'OWNER'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : staff.role === 'MANAGER'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Выдано боксов: {staff.boxesIssuedCount || 0}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            triggerHaptic('light');
                            setStaffForm({
                              id: staff.id,
                              partnerId: partner.id,
                              name: staff.name,
                              role: staff.role,
                              telegramId: staff.telegramId ? String(staff.telegramId) : '',
                            });
                            setShowStaffModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ВКЛАДКА: ЗАЯВКИ ПЕРСОНАЛА И ПОИСК */}
      {activeTab === 'APPLICATIONS' && (
        <div className="space-y-4">
          {/* Панель поиска и фильтрации заявок */}
          <div className="glass-card p-3 rounded-2xl border border-slate-800 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Поиск по имени сотрудника или заведению..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'ALL', label: 'Все' },
                { id: 'PENDING', label: '⏳ Ожидают' },
                { id: 'APPROVED', label: '✅ Одобрены' },
                { id: 'REJECTED', label: '❌ Отклонены' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAppStatusFilter(f.id as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-extrabold whitespace-nowrap shrink-0 transition-all ${
                    appStatusFilter === f.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Список заявок */}
          <div className="space-y-3">
            {applications.length === 0 ? (
              <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                Заявок по заданным критериям не найдено
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={app.partnerLogo}
                        alt={app.partnerName}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-extrabold text-slate-100 text-sm truncate">{app.applicantName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase whitespace-nowrap shrink-0 ${
                              app.applicantRole === 'MANAGER'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {app.applicantRole}
                          </span>
                        </div>
                        <span className="text-xs text-amber-400 font-semibold block mt-0.5 truncate">
                          🏬 {app.partnerName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap shrink-0 ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : app.status === 'REJECTED'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {app.status === 'APPROVED'
                        ? 'Одобрено'
                        : app.status === 'REJECTED'
                        ? 'Отклонено'
                        : 'В ожидании'}
                    </span>
                  </div>

                  {app.comment && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      💬 «{app.comment}»
                    </p>
                  )}

                  {app.status === 'PENDING' && (
                    <div className="flex space-x-2 pt-1 border-t border-slate-800/60">
                      <button
                        onClick={() => handleRejectApplication(app.id)}
                        className="flex-1 py-2.5 px-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-extrabold whitespace-nowrap flex items-center justify-center transition-all"
                      >
                        ❌ Отклонить
                      </button>
                      <button
                        onClick={() => handleApproveApplication(app.id)}
                        className="flex-1 py-2.5 px-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-400 whitespace-nowrap flex items-center justify-center transition-all"
                      >
                        ✅ Одобрить и привязать
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: ВАУЧЕРЫ И БОНУСЫ */}
      {activeTab === 'OFFERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ваучеры партнеров
            </h3>
            <button
              onClick={() => {
                triggerHaptic('light');
                setOfferForm({
                  id: '',
                  partnerId: partners[0]?.id || '',
                  title: '',
                  description: '',
                  imageUrl: '',
                  category: 'TRAFFIC_MAGNET',
                  validityHours: 72,
                  totalLimit: 1000,
                });
                setShowOfferModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center space-x-1 hover:bg-purple-500/20 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Создать подарок</span>
            </button>
          </div>

          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="glass-card p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-slate-800 pb-2">
                  <span>🏢 {partner.name}</span>
                  <span className="text-slate-400 font-normal">
                    {partner.voucherOffers?.length || 0} подарков
                  </span>
                </div>

                <div className="space-y-2.5">
                  {partner.voucherOffers?.map((offer: any) => (
                    <div
                      key={offer.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={offer.imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80'}
                          alt={offer.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-bold uppercase text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                              {offer.category}
                            </span>
                          </div>
                          <h5 className="font-bold text-slate-100 text-xs mt-1">{offer.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">{offer.description}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            ⏳ {offer.validityHours}ч | Выдано: {offer.claimedCount || 0}/{offer.totalLimit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => {
                            triggerHaptic('light');
                            setOfferForm({
                              id: offer.id,
                              partnerId: partner.id,
                              title: offer.title,
                              description: offer.description || '',
                              imageUrl: offer.imageUrl || '',
                              category: offer.category,
                              validityHours: offer.validityHours,
                              totalLimit: offer.totalLimit,
                            });
                            setShowOfferModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 4: АНАЛИТИКА И МОНЕТИЗАЦИЯ */}
      {activeTab === 'ANALYTICS' && (
        <PlatformAnalyticsScreen />
      )}

      {/* ВКЛАДКА 5: МОДЕЛИРОВАНИЕ БАЗЫ ДАННЫХ */}
      {activeTab === 'DATABASE' && (
        <SuperAdminDbScreen />
      )}

      {/* Модалка обучения перед созданием заведения */}
      {showBusinessOnboardingModal && (
        <BusinessOnboardingModal
          onClose={() => setShowBusinessOnboardingModal(false)}
          onProceedToRegistration={() => {
            setShowBusinessOnboardingModal(false);
            setShowPartnerModal(true);
          }}
        />
      )}

      {/* Модалка редактирования партнера */}
      {showPartnerModal && (
        <PartnerRegistrationModal
          onClose={() => setShowPartnerModal(false)}
          onSuccess={() => fetchOverview()}
          initialPartner={editingPartner}
        />
      )}

      {/* Модалка создания/редактирования сотрудника */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-sm">
                {staffForm.id ? 'Редактировать роль сотрудника' : 'Добавить сотрудника'}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Заведение
                </label>
                <select
                  value={staffForm.partnerId}
                  onChange={(e) => setStaffForm({ ...staffForm, partnerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Имя сотрудника
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Имя / Должность"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Telegram ID (для привязки аккаунта)
                </label>
                <input
                  type="text"
                  value={(staffForm as any).telegramId || ''}
                  onChange={(e) => setStaffForm({ ...staffForm, telegramId: e.target.value } as any)}
                  placeholder="Пример: 99887766"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Роль и права доступа
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold"
                >
                  <option value="WAITER">🍷 WAITER (Официант — вызов боксов)</option>
                  <option value="MANAGER">📊 MANAGER (Управляющий — гашение и отсчет)</option>
                  <option value="OWNER">👑 OWNER (Владелец заведения)</option>
                  <option value="SUPER_ADMIN">⚡ SUPER_ADMIN (Администратор всей платформы)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
              >
                Сохранить сотрудника
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модалка создания/редактирования подарка */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {offerForm.id ? 'Редактировать подарок' : 'Создать подарок заведения'}
                </h3>
                <p className="text-[10px] text-slate-400">Подарок для кросс-маркетинговой сети GiftX</p>
              </div>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Информационная подсказка о кросс-маркетинге */}
            <div className="mb-3 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[10px] text-purple-200 space-y-1">
              <span className="font-bold flex items-center space-x-1 text-purple-300">
                <span>✨ Кросс-маркетинговый подарок</span>
              </span>
              <p className="leading-relaxed text-slate-300">
                Этот подарок выдается гостям других заведений-партнеров в сети GiftX. Пороги чеков для получения боксов настраиваются индивидуально в карточке заведения.
              </p>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Заведение-партнер
                </label>
                <select
                  value={offerForm.partnerId}
                  onChange={(e) => setOfferForm({ ...offerForm, partnerId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Название подарка / акции
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  placeholder="Например: Фирменный коктейль от шефа"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Ссылка на фото/изображение подарка <span className="text-[9px] text-slate-500 font-normal">(опционально)</span>
                </label>
                <input
                  type="url"
                  value={offerForm.imageUrl}
                  onChange={(e) => setOfferForm({ ...offerForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Категория подарка
                </label>
                <select
                  value={offerForm.category}
                  onChange={(e) => setOfferForm({ ...offerForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="TRAFFIC_MAGNET">TRAFFIC_MAGNET (Частая услуга / Напиток / Десерт)</option>
                  <option value="LIFESTYLE">LIFESTYLE (Скидка / Впечатление)</option>
                  <option value="ANCHOR">ANCHOR (Якорь / Фирменный сертификат)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Условия получения и описание
                </label>
                <textarea
                  rows={2}
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="Например: Действует при заказе любого блюда в заведении. Покажите QR-код официанту..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Срок действия (часы)
                  </label>
                  <input
                    type="number"
                    value={offerForm.validityHours}
                    onChange={(e) => setOfferForm({ ...offerForm, validityHours: parseInt(e.target.value) || 72 })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Лимит выдач (шт.)
                  </label>
                  <input
                    type="number"
                    value={offerForm.totalLimit}
                    onChange={(e) => setOfferForm({ ...offerForm, totalLimit: parseInt(e.target.value) || 1000 })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
              >
                {offerForm.id ? 'Сохранить изменения' : 'Создать подарок'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модалка Демо-открытия бокса */}
      {showDemoBoxModal && (
        <DemoBoxOpeningModal onClose={() => setShowDemoBoxModal(false)} />
      )}
    </div>
  );
};
