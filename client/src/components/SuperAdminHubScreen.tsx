import React, { useState } from 'react';
import { 
  Database, 
  TrendingUp, 
  Building2, 
  Gift, 
  Users, 
  QrCode, 
  Crown, 
  Sliders, 
  ArrowLeft,
  ShieldAlert,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { triggerHaptic } from '../telegram';
import { SuperAdminDbScreen } from './SuperAdminDbScreen';
import { PlatformAnalyticsScreen } from './PlatformAnalyticsScreen';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { WaiterScreen } from './WaiterScreen';

interface SuperAdminHubScreenProps {
  onClose: () => void;
  onSwitchToGuest?: () => void;
}

export type SuperAdminRubric = 
  | 'VENUES'
  | 'OFFERS'
  | 'STAFF'
  | 'ANALYTICS' 
  | 'DATABASE' 
  | 'TEST_WAITER' 
  | 'TEST_MANAGER' 
  | 'TEST_OWNER';

export const SuperAdminHubScreen: React.FC<SuperAdminHubScreenProps> = ({ onClose, onSwitchToGuest }) => {
  const [activeRubric, setActiveRubric] = useState<SuperAdminRubric>('VENUES');

  const rubrics = [
    { id: 'VENUES', label: '🏬 Заведения Сети', icon: Building2 },
    { id: 'OFFERS', label: '🎁 Все Подарки', icon: Gift },
    { id: 'STAFF', label: '👥 Персонал & Заявки', icon: Users },
    { id: 'ANALYTICS', label: '📊 Биллинг & Доход', icon: TrendingUp },
    { id: 'DATABASE', label: '🗄️ База Данных', icon: Database },
    { id: 'TEST_WAITER', label: '🍷 Тест: Официант', icon: QrCode },
    { id: 'TEST_MANAGER', label: '👔 Тест: Менеджер', icon: Sliders },
    { id: 'TEST_OWNER', label: '👑 Тест: Владелец', icon: Crown },
  ];

  return (
    <div 
      className="min-h-screen bg-[#0e1621] text-slate-100 font-sans relative pb-28 animate-fadeIn select-none"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 0px) + 68px)'
      }}
    >
      {/* 1. ВЕРХНИЙ БЕЗОПАСНЫЙ ХЭДЕР (БЕЗ НАЛОЖЕНИЯ НА КНОПКИ ТМА) */}
      <div className="bg-[#17212b] px-4 py-3 border-b border-white/5 flex items-center justify-between shadow-md max-w-md mx-auto sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer border border-white/5"
          >
            <ArrowLeft className="w-4 h-4 text-[#2aabee]" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-[#2aabee] animate-pulse" />
              <span className="text-[10px] font-black uppercase text-[#2aabee] tracking-widest block">Хаб Управляющего & Суперадмина</span>
            </div>
            <h1 className="text-sm font-extrabold text-slate-100">GiftX Control Center</h1>
          </div>
        </div>

        {onSwitchToGuest && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onSwitchToGuest();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-[#2aabee] border border-[#2aabee]/30 text-[10px] font-bold flex items-center space-x-1 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <User className="w-3.5 h-3.5" />
            <span>Вид Гостя</span>
          </button>
        )}
      </div>

      {/* 2. СКРОЛЛЕР РУБРИК СУПЕРАДМИНА (TELEGRAM PILL TABS) */}
      <div className="bg-[#17212b]/95 border-b border-white/10 py-2.5 px-3 sticky top-[57px] z-40 backdrop-blur-md max-w-md mx-auto">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5">
          {rubrics.map((r) => {
            const isActive = activeRubric === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  triggerHaptic('medium');
                  setActiveRubric(r.id as SuperAdminRubric);
                }}
                className={`py-2 px-3.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                  isActive
                    ? 'bg-[#2aabee] text-white border border-[#2aabee] shadow-md shadow-[#2aabee]/30 scale-[1.02]'
                    : 'bg-[#242f3d] text-slate-300 border border-white/5 hover:text-white hover:bg-[#2b394a]'
                }`}
              >
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. КОНТЕНТ ВЫБРАННОЙ РУБРИКИ */}
      <div className="max-w-md mx-auto p-4 space-y-4">
        {activeRubric === 'VENUES' && (
          <AdminDashboardScreen defaultTab="VENUES" />
        )}

        {activeRubric === 'OFFERS' && (
          <AdminDashboardScreen defaultTab="OFFERS" />
        )}

        {activeRubric === 'STAFF' && (
          <AdminDashboardScreen defaultTab="STAFF" />
        )}

        {activeRubric === 'ANALYTICS' && (
          <PlatformAnalyticsScreen />
        )}

        {activeRubric === 'DATABASE' && (
          <div className="space-y-3">
            <div className="bg-[#17212b] p-3 rounded-xl border border-white/5 text-xs text-slate-300 flex items-center justify-between">
              <span className="font-bold text-[#2aabee]">🗄️ Моделирование БД (PostgreSQL / Prisma)</span>
              <span className="text-[10px] text-slate-400">Прямое инспектирование сущностей</span>
            </div>
            <SuperAdminDbScreen />
          </div>
        )}

        {activeRubric === 'TEST_WAITER' && (
          <div className="space-y-3">
            <div className="bg-[#242f3d] p-3 rounded-xl border border-[#2aabee]/40 text-xs text-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🍷</span>
                <div>
                  <strong className="text-slate-100 block">Тестовый режим Официанта</strong>
                  <span className="text-[10px] text-slate-400">Выдача QR-кодов и прием заказов</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#2aabee]/20 text-[#2aabee] font-bold text-[10px]">
                TEST MODE
              </span>
            </div>
            <WaiterScreen />
          </div>
        )}

        {activeRubric === 'TEST_MANAGER' && (
          <div className="space-y-3">
            <div className="bg-[#242f3d] p-3 rounded-xl border border-amber-500/40 text-xs text-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">👔</span>
                <div>
                  <strong className="text-slate-100 block">Тестовый режим Менеджера</strong>
                  <span className="text-[10px] text-slate-400">Управление сменами и заявками персонала</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                MANAGER MODE
              </span>
            </div>
            <AdminDashboardScreen defaultTab="APPLICATIONS" />
          </div>
        )}

        {activeRubric === 'TEST_OWNER' && (
          <div className="space-y-3">
            <div className="bg-[#242f3d] p-3 rounded-xl border border-purple-500/40 text-xs text-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">👑</span>
                <div>
                  <strong className="text-slate-100 block">Тестовый режим Владельца заведения</strong>
                  <span className="text-[10px] text-slate-400">Настройка порогов чеков и созданных акций</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                OWNER MODE
              </span>
            </div>
            <AdminDashboardScreen defaultTab="VENUES" />
          </div>
        )}
      </div>
    </div>
  );
};
