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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] text-slate-100 relative">
        {/* Шапка модалки */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">Инструкция и Справка GiftX</h2>
              <p className="text-[11px] text-slate-400">Выберите вашу роль или интересующий вопрос</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Переключатель вкладок 4 ролей + FAQ */}
        <div className="flex space-x-1 py-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'GUEST', label: '🎁 Гость', icon: Gift },
            { id: 'WAITER', label: '🍷 Официант', icon: QrCode },
            { id: 'OWNER', label: '🏢 Владелец', icon: Building2 },
            { id: 'SUPERADMIN', label: '👑 Суперадмин', icon: ShieldAlert },
            { id: 'FAQ', label: '❓ FAQ', icon: HelpCircle },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Контент вкладок (Скроллируемый) */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs pr-1 leading-relaxed">
          {/* 1. ИНСТРУКЦИЯ ДЛЯ ГОСТЯ */}
          {activeTab === 'GUEST' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                <h3 className="font-bold text-amber-300 flex items-center space-x-2 text-sm">
                  <span>💡 Как работает GiftX для Гостя?</span>
                </h3>
                <p className="text-slate-300 text-[11px]">
                  GiftX — это бесплатная сеть взаимоподарков. Совершая заказ в одном месте (например, в ресторане), вы получаете подарки в другие места города (массажи, байки, дайвинг, скидки)!
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-amber-400 mb-1 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>Получение бокса у официанта</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    При оплате счёта попросите официанта показать QR-код. Отсканируйте код камерой смартфона или через бота Telegram.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-purple-400 mb-1 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">2</span>
                    <span>Распаковка 3D-коробки (3 Тапа)</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Нажмите на подарочную коробку на экране 3 раза. После взрыва вы получите веер из **5 уникальных ваучеров** (GiftX).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">3</span>
                    <span>Использование в другом месте</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Откройте вкладку **«Мои Подарки»**, выберите ваучер и покажите его персоналу заведения-партнера до истечения срока (3 дня / 72 часа).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. ИНСТРУКЦИЯ ДЛЯ ОФИЦИАНТА */}
          {activeTab === 'WAITER' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                <h3 className="font-bold text-cyan-300 flex items-center space-x-2 text-sm">
                  <span>🍷 Пошаговая инструкция для Персонала / Официанта</span>
                </h3>
                <p className="text-slate-300 text-[11px]">
                  Официант выдаёт гостю QR-код при расчёте. Выдача боксов повышает лояльность клиентов и размер чаевых!
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-slate-100 mb-1">Шаг 1: Авторизация на смене</div>
                  <p className="text-slate-400 text-[11px]">
                    Перейдите во вкладку **«Официант»**, выберите своё заведение и нажмите на свой профиль сотрудника.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-slate-100 mb-1">Шаг 2: Выбор бокса по чеку</div>
                  <p className="text-slate-400 text-[11px]">
                    Определите сумму чека гостя и нажмите соответствующую кнопку:
                    <br />• **📦 Базовый бокс**: чек до 299,000 VND
                    <br />• **🥈 Серебряный бокс**: чек от 300,000 VND
                    <br />• **🥇 Золотой бокс**: чек от 600,000 VND
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-slate-100 mb-1">Шаг 3: Показ QR-кода и отклик</div>
                  <p className="text-slate-400 text-[11px]">
                    Покажите сгенерированный QR-код гостю. Код активен **3 минуты**. Как только гость сканирует код, ваш экран автоматически подтвердит вручение: *«🎉 Бокс успешно вручен!»*.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. ИНСТРУКЦИЯ ДЛЯ ОУНЕРА БИЗНЕСА */}
          {activeTab === 'OWNER' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <h3 className="font-bold text-purple-300 flex items-center space-x-2 text-sm">
                  <span>🏢 Руководство для Владельца заведения (Owner / Manager)</span>
                </h3>
                <p className="text-slate-300 text-[11px]">
                  Заведение обменивается клиентами с другими бизнесами города без затрат на рекламу!
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-purple-300 mb-1">1. Настройка порогов чеков (VND)</div>
                  <p className="text-slate-400 text-[11px]">
                    В Панели Управляющего (вкладка **«Админ»**) настройте сумму счёта для выдачи подарков (например, Базовый от 0k, Серебряный от 300k, Золотой от 600k VND).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-purple-300 mb-1">2. Создание 3 типов подарков для привлечения</div>
                  <p className="text-slate-400 text-[11px]">
                    Создавайте акции в разделе **«Ваучеры»**:
                    <br />• **TRAFFIC_MAGNET**: Бесплатный приветственный напиток/коктейль или услуга при визите (максимальный завлекающий трафик).
                    <br />• **LIFESTYLE**: Скидка 15–30% на основное меню или услуги.
                    <br />• **ANCHOR**: Сертификат на фиксированную сумму (например, 300,000 VND).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-purple-300 mb-1">3. Приём и гашение ваучеров на кассе</div>
                  <p className="text-slate-400 text-[11px]">
                    Когда новый гость приходит к вам с ваучером из другого заведения, сотрудник вводит PIN-код заведения (по умолчанию **`1234`**) для гашения подарка.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. ИНСТРУКЦИЯ ДЛЯ СУПЕРАДМИНА */}
          {activeTab === 'SUPERADMIN' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <h3 className="font-bold text-emerald-300 flex items-center space-x-2 text-sm">
                  <span>👑 Управление платформой GiftX (Superadmin)</span>
                </h3>
                <p className="text-slate-300 text-[11px]">
                  Суперадмин контролирует качество сети кросс-маркетинга и защищает от накруток.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-1">Кросс-маркетинговый алгоритм</div>
                  <p className="text-slate-400 text-[11px]">
                    Система никогда не выдает ваучеры из ТОЙ ЖЕ категории заведения, где был выдан QR-код (ресторан не отдаст клиента другому ресторану!). Гость ресторана всегда получает подарки в СПА, прокат байков, дайвинг и т.д.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-emerald-400 mb-1">Антифрод и Контроль лимитов</div>
                  <p className="text-slate-400 text-[11px]">
                    Каждый QR-токен официанта живёт 3 минуты и сгорает сразу после активации. Гость не может активировать один и тот же код дважды.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ (FAQ) */}
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
                  a: 'В демо-версии универсальный PIN-код заведений — 1234.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-400 text-xs">❓ {faq.q}</h4>
                  <p className="text-slate-300 text-[11px] leading-normal">{faq.a}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка закрытия */}
        <div className="pt-3 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-extrabold text-slate-950 rounded-2xl text-xs shadow-lg shadow-amber-500/20"
          >
            Понятно, закрыть справочник
          </button>
        </div>
      </div>
    </div>
  );
};
