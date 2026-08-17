import React, { useState } from 'react';
import { 
  X, 
  Gift, 
  QrCode, 
  Building2, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles,
  MapPin,
  Clock,
  Key,
  Flame,
  Award
} from 'lucide-react';
import { triggerHaptic } from '../telegram';

interface HelpGuideModalProps {
  onClose: () => void;
  defaultRole?: 'GUEST' | 'WAITER' | 'ADMIN';
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ onClose, defaultRole }) => {
  const [activeTab, setActiveTab] = useState<'GUEST' | 'WAITER' | 'OWNER' | 'SUPERADMIN' | 'FAQ'>(
    defaultRole === 'WAITER' ? 'WAITER' : defaultRole === 'ADMIN' ? 'OWNER' : 'GUEST'
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0e1621] text-slate-100 flex flex-col overflow-hidden font-sans animate-fadeIn">
      {/* 1. ВЕРХНЯЯ ШАПКА ФУЛЛ-СКРИН ПОПАПА */}
      <div 
        className="bg-[#17212b] border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-md shrink-0"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), var(--tg-safe-area-inset-top, 0px), var(--tg-content-safe-area-inset-top, 0px), 14px)'
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2aabee]/15 border border-[#2aabee]/30 flex items-center justify-center text-[#2aabee] shadow-sm">
            <HelpCircle className="w-5 h-5 text-[#2aabee]" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-100 leading-tight">Инструкции & О сервисе</h2>
            <p className="text-[11px] text-slate-400">Как работать с системой GiftX</p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="p-2.5 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. ПЕРЕКЛЮЧАТЕЛЬ ВКЛАДОК РОЛЕЙ (ТЕЛЕГРАМ СТИЛЬ) */}
      <div className="bg-[#17212b] px-4 py-2.5 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
        <div className="flex space-x-1.5 max-w-md mx-auto">
          {[
            { id: 'GUEST', label: '🎁 Гость', icon: Gift },
            { id: 'WAITER', label: '🍷 Официант', icon: QrCode },
            { id: 'OWNER', label: '🏢 Владелец', icon: Building2 },
            { id: 'SUPERADMIN', label: '👑 Суперадмин', icon: ShieldAlert },
            { id: 'FAQ', label: '❓ FAQ', icon: HelpCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2aabee] text-white shadow-md shadow-[#2aabee]/30'
                  : 'bg-[#242f3d] text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. ОСНОВНОЙ СКРОЛЛИРУЕМЫЙ КОНТЕНТ С БОЛЬШИМИ ПИКТОГРАММАМИ */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4 custom-scrollbar">
        {/* ============================================================== */}
        {/* 1. ИНСТРУКЦИЯ ДЛЯ ГОСТЯ (КРУПНЫЕ ПИКТОГРАММЫ И ШАГИ)         */}
        {/* ============================================================== */}
        {activeTab === 'GUEST' && (
          <div className="space-y-4">
            <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 space-y-1 shadow-md">
              <span className="text-[10px] font-bold text-[#2aabee] uppercase tracking-wider bg-[#2aabee]/15 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-[#2aabee]/20">
                <Sparkles className="w-3 h-3 text-[#2aabee]" />
                <span>Инструкция Гостя</span>
              </span>
              <h3 className="font-extrabold text-base text-slate-100 pt-1">
                Как получать бесплатные подарки в 3 шага
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                GiftX — сеть взаимоподарков. Оплачивая счет в заведениях-партнерах, вы получаете сюрприз-боксы с подарками в ресторанах, СПА и сервисах города!
              </p>
            </div>

            <div className="space-y-3">
              {/* ШАГ 1 */}
              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-[#2aabee] shrink-0 shadow-md">
                  <span className="text-2xl select-none">🍹</span>
                  <span className="text-[9px] font-black text-[#2aabee] uppercase mt-0.5">Шаг 1</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">
                    Отдыхайте в заведении
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Делайте заказы в любимых ресторанах, кафе или СПА-салонах сети GiftX.
                  </p>
                </div>
              </div>

              {/* ШАГ 2 */}
              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">📷</span>
                  <span className="text-[9px] font-black text-amber-400 uppercase mt-0.5">Шаг 2</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">
                    Сканируйте QR у официанта
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    При расчёте попросите официанта показать QR-код вашей суммы счёта и отсканируйте его камерой.
                  </p>
                </div>
              </div>

              {/* ШАГ 3 */}
              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">🎁</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">Шаг 3</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">
                    Забирайте 5 Подарков
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Распакуйте виртуальный 3D-бокс и заберите веер из 5 карточек с бесплатными напитками, массажами и скидками!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. ИНСТРУКЦИЯ ДЛЯ ОФИЦИАНТА                                    */}
        {/* ============================================================== */}
        {activeTab === 'WAITER' && (
          <div className="space-y-4">
            <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 space-y-1 shadow-md">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/15 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-cyan-500/20">
                <QrCode className="w-3 h-3 text-cyan-400" />
                <span>Инструкция Официанта</span>
              </span>
              <h3 className="font-extrabold text-base text-slate-100 pt-1">
                Как выдавать подарки и поднимать средний чек
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Выдача сюрприз-боксов мотивирует гостей делать более крупные заказы и увеличивает ваши чаевые!
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-cyan-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">🔑</span>
                  <span className="text-[9px] font-black text-cyan-400 uppercase mt-0.5">Шаг 1</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Вход на смену</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Откройте раздел **«Официант»**, выберите своё заведение и свой профиль сотрудника.
                  </p>
                </div>
              </div>

              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-amber-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">💳</span>
                  <span className="text-[9px] font-black text-amber-400 uppercase mt-0.5">Шаг 2</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Выбор вида бокса по сумме чека</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Нажмите нужный уровень чека:
                    <br />• 🥈 **Silver Box** (от 300k VND)
                    <br />• 🥇 **Gold Box** (от 600k VND)
                    <br />• 💎 **Platinum Box** (от 1M VND)
                  </p>
                </div>
              </div>

              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">📱</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">Шаг 3</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Показ QR-кода гостю</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Покажите QR на экране телефона. После сканирования экраны автоматически синхронизируются и зачислят вам баллы турнира!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. ИНСТРУКЦИЯ ДЛЯ ВЛАДЕЛЬЦА                                    */}
        {/* ============================================================== */}
        {activeTab === 'OWNER' && (
          <div className="space-y-4">
            <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 space-y-1 shadow-md">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/15 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 border border-purple-500/20">
                <Building2 className="w-3 h-3 text-purple-400" />
                <span>Инструкция Владельца</span>
              </span>
              <h3 className="font-extrabold text-base text-slate-100 pt-1">
                Кросс-маркетинг без расходов на рекламу (0$ CAC)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Обменивайтесь гостями с лучшими заведениями города и привлекайте новых клиентов.
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-purple-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">⚙️</span>
                  <span className="text-[9px] font-black text-purple-400 uppercase mt-0.5">Шаг 1</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Настройка порогов чека</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Задайте суммы заказов, при которых официанты будут вручать боксы с подарками партнёров.
                  </p>
                </div>
              </div>

              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-[#2aabee] shrink-0 shadow-md">
                  <span className="text-2xl select-none">🍸</span>
                  <span className="text-[9px] font-black text-[#2aabee] uppercase mt-0.5">Шаг 2</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Создание подарков заведения</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Добавьте бесплатный welcome-коктейль или скидку 20%. Ваши подарки начнут выпадать гостям в других ресторанах и СПА!
                  </p>
                </div>
              </div>

              <div className="bg-[#17212b] p-4 rounded-2xl border border-white/5 flex items-start space-x-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[#242f3d] border border-white/10 flex flex-col items-center justify-center text-emerald-400 shrink-0 shadow-md">
                  <span className="text-2xl select-none">📌</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase mt-0.5">Шаг 3</span>
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-100">Гашение ваучеров на кассе</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Пришедший гость показывает подарок на телефоне. Персонал вводит PIN-код **`1234`** для гашения.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. ИНСТРУКЦИЯ СУПЕРАДМИНА И FAQ                                */}
        {/* ============================================================== */}
        {activeTab === 'SUPERADMIN' && (
          <div className="bg-[#17212b] p-4.5 rounded-2xl border border-white/5 space-y-3 shadow-md">
            <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>👑 Управление платформой GiftX</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Алгоритм защиты от конкуренции: система выдаёт ваучеры ТОЛЬКО из смежных категорий (рестораны обмениваются с СПА, байками и развлечениями).
            </p>
          </div>
        )}

        {activeTab === 'FAQ' && (
          <div className="space-y-3">
            {[
              {
                q: 'Сколько стоит участие в GiftX для заведения?',
                a: 'Подключение к базовой сети бесплатно! Заведения обмениваются клиентами напрямую.'
              },
              {
                q: 'Что делать, если таймер QR-кода у официанта истёк?',
                a: 'Просто нажмите кнопку «Сгенерировать новый» — будет создан свежий токен на 3 минуты.'
              },
              {
                q: 'Может ли гость передать ваучер другу?',
                a: 'Да, ваучер хранится в кошельке Telegram Mini App и может использоваться при посещении заведения.'
              },
              {
                q: 'Какой PIN-код используется для гашения подарков?',
                a: 'В универсальной демо-версии PIN-код заведений — 1234.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#17212b] p-4 rounded-2xl border border-white/5 space-y-1 shadow-md">
                <h4 className="font-extrabold text-[#2aabee] text-xs">❓ {faq.q}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. ФУТЕР С КНОПКОЙ ЗАКРЫТИЯ */}
      <div 
        className="bg-[#17212b] border-t border-white/5 p-4 shrink-0 max-w-md mx-auto w-full shadow-lg"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--tg-safe-area-inset-bottom, 0px), var(--tg-content-safe-area-inset-bottom, 0px), 16px)'
        }}
      >
        <button
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="w-full py-3.5 bg-[#2aabee] hover:bg-[#229ed9] font-extrabold text-white rounded-xl text-xs shadow-md shadow-[#2aabee]/30 transition-all cursor-pointer active:scale-[0.99]"
        >
          Понятно, закрыть справочник
        </button>
      </div>
    </div>
  );
};

