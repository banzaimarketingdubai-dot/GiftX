import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Building2, 
  PlusCircle, 
  ShieldCheck, 
  QrCode, 
  Sliders, 
  Sparkles, 
  ChevronRight, 
  RefreshCw,
  Gift,
  MapPin,
  CheckCircle2,
  Award
} from 'lucide-react';
import { getTelegramUserData, triggerHaptic } from '../telegram';
import { PartnerRegistrationModal } from './PartnerRegistrationModal';
import { AdminDashboardScreen } from './AdminDashboardScreen';
import { WaiterScreen } from './WaiterScreen';
import { useAppStore } from '../store/useAppStore';

interface ProfileScreenProps {
  onSwitchToClientMode: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onSwitchToClientMode }) => {
  const { role, setRole } = useAppStore();
  const tgUser = getTelegramUserData();

  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'PROFILE' | 'ADMIN' | 'WAITER'>('PROFILE');

  const checkStaffRole = async () => {
    try {
      setLoading(true);
      if (tgUser?.id) {
        const res = await fetch(`/api/staff/check-member/${tgUser.id}`);
        const data = await res.json();
        if (data.success && data.isStaff) {
          setIsStaff(true);
          setStaffInfo(data.staff);
        } else {
          setIsStaff(false);
          setStaffInfo(null);
        }
      }
    } catch (e) {
      console.error('Check staff role error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStaffRole();
  }, []);

  // Если пользователь внутри профиля переключил вид на встроенный Admin или Waiter экран
  if (viewMode === 'ADMIN') {
    return (
      <div className="relative">
        <div className="bg-slate-900 border-b border-slate-800 p-3 max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('PROFILE');
            }}
            className="text-xs font-bold text-amber-400 flex items-center space-x-1 hover:underline"
          >
            <span>← Назад в Мой Профиль</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            Режим Владельца
          </span>
        </div>
        <AdminDashboardScreen />
      </div>
    );
  }

  if (viewMode === 'WAITER') {
    return (
      <div className="relative">
        <div className="bg-slate-900 border-b border-slate-800 p-3 max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic('light');
              setViewMode('PROFILE');
            }}
            className="text-xs font-bold text-amber-400 flex items-center space-x-1 hover:underline"
          >
            <span>← Назад в Мой Профиль</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            Режим Официанта
          </span>
        </div>
        <WaiterScreen />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen pb-24 text-slate-100 space-y-5">
      {/* Шапка карточки профиля пользователя */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-2xl text-amber-400">
              {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : '👤'}
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-100">
                {tgUser?.first_name} {tgUser?.last_name || ''}
              </h1>
              {isStaff && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase">
                  {staffInfo?.role || 'БИЗНЕС'}
                </span>
              )}
            </div>

            {tgUser?.username && (
              <p className="text-xs text-amber-400 font-medium">@{tgUser.username}</p>
            )}

            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {tgUser?.id}</p>
          </div>
        </div>
      </div>

      {/* Блок привязанного бизнеса (если пользователь является сотрудником/владельцем) */}
      {isStaff && staffInfo?.partner && (
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-amber-950/20 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <img
                src={staffInfo.partner.logoUrl}
                alt={staffInfo.partner.name}
                className="w-12 h-12 rounded-2xl object-cover border border-amber-500/30 shrink-0 shadow-md"
              />
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-amber-400 block">
                  Ваше Заведение
                </span>
                <h3 className="font-extrabold text-slate-100 text-sm">{staffInfo.partner.name}</h3>
                <p className="text-[11px] text-slate-400">{staffInfo.partner.address}</p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs">
              {staffInfo.role}
            </span>
          </div>

          {/* Панель переключения рабочих режимов для владельца/персонала */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Переключение рабочих режимов:
            </p>

            {(staffInfo.role === 'OWNER' || staffInfo.role === 'MANAGER') && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setViewMode('ADMIN');
                }}
                className="w-full p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-between transition-all shadow-lg shadow-amber-500/20"
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4" />
                  <span>Управление заведением (Панель Владельца)</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('medium');
                setViewMode('WAITER');
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-100 font-extrabold text-xs flex items-center justify-between transition-all"
            >
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>Выдача боксов клиентам (Экран Официанта)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Баннер регистрации бизнеса (если пользователь ещё НЕ привязан к бизнесу) */}
      {!isStaff && (
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl shrink-0">
              🏬
            </div>
            <div>
              <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-widest px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                GiftX B2B Сеть
              </span>
              <h3 className="text-base font-extrabold text-slate-100 mt-1">Подключите ваше заведение</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Привлекайте новых гостей из других ресторанов, СПА и сервисов города совершенно бесплатно без бюджета на рекламу!
          </p>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              setShowRegisterModal(true);
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.99]"
          >
            <PlusCircle className="w-5 h-5 text-slate-950" />
            <span>Зарегистрировать заведение</span>
          </button>
        </div>
      )}

      {/* Дополнительные опции пользователя */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">
          Настройки и сессии
        </h4>

        <button
          onClick={() => {
            triggerHaptic('light');
            onSwitchToClientMode();
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-between hover:bg-slate-800/80 transition-all"
        >
          <div className="flex items-center space-x-2.5">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Перейти в Кошелек «Мои Подарки»</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            checkStaffRole();
          }}
          className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-400 text-xs font-semibold flex items-center justify-center space-x-1.5 hover:text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Обновить статус роли</span>
        </button>
      </div>

      {/* Модалка регистрации заведения */}
      {showRegisterModal && (
        <PartnerRegistrationModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            checkStaffRole();
          }}
        />
      )}
    </div>
  );
};
