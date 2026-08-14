import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Building2, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Trash2, 
  Check, 
  RefreshCw, 
  Crown, 
  Sliders, 
  Sparkles,
  Edit3,
  LogOut,
  Gift
} from 'lucide-react';
import { getTelegramUserData, triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { useAppStore } from '../store/useAppStore';
import { DemoBoxOpeningModal } from './DemoBoxOpeningModal';

interface ManageUserRoleModalProps {
  onClose: () => void;
  currentStaff: any | null;
  isStaff: boolean;
  onRoleChanged: (newRole: string, newStaff?: any) => void;
  onOpenVenueSearch: () => void;
  onOpenPartnerRegister: () => void;
  onClearStaffRole: () => void;
}

export const ManageUserRoleModal: React.FC<ManageUserRoleModalProps> = ({
  onClose,
  currentStaff,
  isStaff,
  onRoleChanged,
  onOpenVenueSearch,
  onOpenPartnerRegister,
  onClearStaffRole,
}) => {
  const { role, setRole } = useAppStore();
  const tgUser = getTelegramUserData();

  const [displayName, setDisplayName] = useState(
    currentStaff?.name || `${tgUser?.first_name || 'Пользователь'} ${tgUser?.last_name || ''}`.trim()
  );
  const [selectedRole, setSelectedRole] = useState<string>(currentStaff?.role || role || 'GUEST');
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDemoBoxModal, setShowDemoBoxModal] = useState(false);

  // Смена роли в один клик
  const handleSelectRole = (newRole: string) => {
    triggerHaptic('medium');
    setSelectedRole(newRole);

    if (newRole === 'GUEST' || newRole === 'PROFILE') {
      onRoleChanged('PROFILE', null);
    } else if (newRole === 'WAITER') {
      const demoStaff = {
        id: currentStaff?.id || 'demo-staff-1',
        partnerId: currentStaff?.partnerId || 'demo-partner-1',
        name: displayName || 'Алекс (Sunset Bar)',
        role: 'WAITER',
        boxesIssuedCount: currentStaff?.boxesIssuedCount || 14,
        partner: currentStaff?.partner || {
          id: 'demo-partner-1',
          name: 'Sunset Beach Club',
          category: 'HORECA',
          logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
          address: 'Phu Quoc, Long Beach, St 4',
        }
      };
      localStorage.setItem('giftx_demo_staff', JSON.stringify(demoStaff));
      onRoleChanged('WAITER', demoStaff);
    } else if (newRole === 'MANAGER' || newRole === 'OWNER' || newRole === 'SUPER_ADMIN') {
      const demoStaff = {
        id: currentStaff?.id || 'demo-staff-2',
        partnerId: currentStaff?.partnerId || 'demo-partner-1',
        name: displayName || (newRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Анна (Менеджер)'),
        role: newRole,
        boxesIssuedCount: currentStaff?.boxesIssuedCount || 42,
        partner: currentStaff?.partner || {
          id: 'demo-partner-1',
          name: 'Sunset Beach Club',
          category: 'HORECA',
          logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
          address: 'Phu Quoc, Long Beach, St 4',
        }
      };
      localStorage.setItem('giftx_demo_staff', JSON.stringify(demoStaff));
      onRoleChanged('ADMIN', demoStaff);
    } else if (newRole === 'ADMIN') {
      onRoleChanged('ADMIN', currentStaff);
    }
  };

  // Сохранение отредактированного имени и данных роли
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    triggerNotificationHaptic('success');
    
    if (isStaff && currentStaff) {
      const updatedStaff = {
        ...currentStaff,
        name: displayName,
        role: selectedRole,
      };
      localStorage.setItem('giftx_demo_staff', JSON.stringify(updatedStaff));
      onRoleChanged(selectedRole === 'WAITER' ? 'WAITER' : selectedRole === 'GUEST' ? 'PROFILE' : 'ADMIN', updatedStaff);
    }
    onClose();
  };

  // Подтягивание данных напрямую из Telegram
  const handleSyncTelegram = () => {
    triggerHaptic('light');
    const freshTg = getTelegramUserData();
    const fullName = `${freshTg.first_name || ''} ${freshTg.last_name || ''}`.trim();
    setDisplayName(fullName || 'Алексей Гость');
    triggerNotificationHaptic('success');
  };

  // Удаление роли / Выход из заведения
  const handleDeleteRole = () => {
    triggerNotificationHaptic('warning');
    onClearStaffRole();
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between cursor-default"
      >
        {/* Шапка модалки */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Управление аккаунтом и ролями</h3>
              <p className="text-[11px] text-slate-400">Смена роли, редактирование и привязка к заведению</p>
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

        <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">

          {/* Карточка профиля с данными Telegram */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              {/* Фото Telegram или Аватар */}
              {tgUser?.photo_url ? (
                <img
                  src={tgUser.photo_url}
                  alt={tgUser.first_name}
                  className="w-14 h-14 rounded-2xl object-cover border border-amber-500/40 shadow-md shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 shadow-md shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-xl text-amber-400">
                    {tgUser?.first_name ? tgUser.first_name[0].toUpperCase() : '👤'}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-extrabold text-slate-100 text-sm">
                  {tgUser?.first_name || 'Пользователь'} {tgUser?.last_name || ''}
                </h4>
                {tgUser?.username && (
                  <p className="text-xs text-amber-400 font-bold">@{tgUser.username}</p>
                )}
                <span className="text-[10px] text-slate-500 font-mono">
                  Telegram ID: {tgUser?.id || 'Demo-999888'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncTelegram}
              title="Синхронизировать данные из Telegram"
              className="py-1.5 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center space-x-1 transition-all shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Telegram Sync</span>
            </button>
          </div>

          {/* 1. БЫСТРАЯ СМЕНА РОЛИ (SWITCH ROLE) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400">
              🔄 Смена роли в один клик:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleSelectRole('GUEST')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'GUEST' || role === 'PROFILE' || role === 'WALLET'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🎁 Гость</span>
                <span className="text-[9px] opacity-80 block mt-1">Клиентские подарки</span>
              </button>

              <button
                onClick={() => handleSelectRole('WAITER')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'WAITER' || (role === 'WAITER' && isStaff)
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🍷 Официант</span>
                <span className="text-[9px] opacity-80 block mt-1">Выдача QR-боксов</span>
              </button>

              <button
                onClick={() => handleSelectRole('MANAGER')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'MANAGER'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>📊 Управляющий</span>
                <span className="text-[9px] opacity-80 block mt-1">Заявки & Аналитика</span>
              </button>

              <button
                onClick={() => handleSelectRole('OWNER')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'OWNER'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>👑 Владелец</span>
                <span className="text-[9px] opacity-80 block mt-1">Хозяин заведения</span>
              </button>

              <button
                onClick={() => handleSelectRole('ADMIN')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'ADMIN'
                    ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>⚡ Администратор</span>
                <span className="text-[9px] opacity-80 block mt-1">Все заведения сети</span>
              </button>

              <button
                onClick={() => handleSelectRole('SUPER_ADMIN')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all flex flex-col justify-between ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>🗄️ Super Admin</span>
                <span className="text-[9px] opacity-80 block mt-1">Моделирование всей БД</span>
              </button>
            </div>

            {/* Кнопка демонстрации анимации открытия бокса */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowDemoBoxModal(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-slate-950 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center space-x-2 transition-all mt-2 shadow-md active:scale-95"
            >
              <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>🎁 Демонстрация открытия бокса для партнеров</span>
            </button>
          </div>

          {/* 2. РЕГИСТРАЦИЯ В НОВОЕ ЗАВЕДЕНИЕ / ПОДАЧА ЗАЯВКИ */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              🏬 Привязка к заведению:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                  onOpenVenueSearch();
                }}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold flex items-center space-x-2 transition-all text-left"
              >
                <Search className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="block">➕ Подать заявку в заведение</span>
                  <span className="text-[9px] text-slate-400 block font-normal">Поиск среди заведений сети</span>
                </div>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                  onOpenPartnerRegister();
                }}
                className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-extrabold flex items-center space-x-2 transition-all text-left"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block">🏬 Зарегистрировать заведение</span>
                  <span className="text-[9px] text-slate-400 block font-normal">Новая локация на карте</span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. РЕДАКТИРОВАНИЕ ДАННЫХ В ЗАВЕДЕНИИ */}
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              ✏️ Редактирование отображаемого имени:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Отображаемое имя (например: Алекс Bar)..."
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20 shrink-0 active:scale-95"
              >
                Сохранить
              </button>
            </div>
          </form>

          {/* 4. УДАЛЕНИЕ ИЛИ ОТВЯЗКА РОЛИ ЗАВЕДЕНИЯ */}
          {isStaff && (
            <div className="pt-3 border-t border-slate-800">
              {!showConfirmDelete ? (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>🗑️ Покинуть заведение / Удалить роль персонала</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/40 space-y-2 text-center">
                  <p className="text-xs text-red-300 font-bold">
                    Вы точно хотите отвязать эту бизнес-роль и сбросить профиль до Гостя?
                  </p>
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={handleDeleteRole}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs shadow-md"
                    >
                      Да, удалить роль
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Модалка Демо-открытия бокса */}
      {showDemoBoxModal && (
        <DemoBoxOpeningModal onClose={() => setShowDemoBoxModal(false)} />
      )}
    </div>
  );
};
