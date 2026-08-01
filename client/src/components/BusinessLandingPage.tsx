import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  QrCode,
  Trophy,
  Sliders,
  PlusCircle,
  Calculator,
  Gift,
  Award,
  Printer,
  FileText,
  Download
} from 'lucide-react';
import { triggerHaptic } from '../telegram';
import { B2BPromoFlyerModal } from './B2BPromoFlyerModal';

interface BusinessLandingPageProps {
  onRegisterPartner: () => void;
  onSwitchToGuestLanding: () => void;
  onOpenAdminDemo: () => void;
}

export const BusinessLandingPage: React.FC<BusinessLandingPageProps> = ({
  onRegisterPartner,
  onSwitchToGuestLanding,
  onOpenAdminDemo,
}) => {
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  // Расчёт примерных параметров прибыльности
  const exampleAvgCheck = 300000;
  const exampleTargetCheck = 600000;
  const exampleDailyChecks = 30;
  const exampleMonthlyGain = (exampleTargetCheck - exampleAvgCheck) * exampleDailyChecks * 0.4 * 30;
  const exampleNewGuests = Math.round(exampleDailyChecks * 0.3 * 30);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-16">
      {/* Фоновые свечения */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Основной адаптивный контейнер: на мобильных max-w-md, на ПК max-w-6xl */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Переключатель лендинга (Для Гостей vs Для Заведений) */}
        <div className="max-w-md mx-auto flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <button
            onClick={() => {
              triggerHaptic('light');
              onSwitchToGuestLanding();
            }}
            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center space-x-1.5"
          >
            <Gift className="w-4 h-4 text-slate-400" />
            <span>Для Гостей (VIP Pass)</span>
          </button>
          <button className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5">
            <Building2 className="w-4 h-4 text-slate-950" />
            <span>Для Заведений (B2B)</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* 1. HERO SECTION (АДАПТИВНЫЙ БЛОК: ПК И МОБ) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2">
          {/* Левая колонка: Текст и Кнопки */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider animate-pulse">
              <TrendingUp className="w-4 h-4" />
              <span>0$ Расходов на маркетинг (CAC = 0)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-slate-100 tracking-tight">
              Увеличивайте средний чек и получайте <span className="text-gradient-gold">новых клиентов БЕСПЛАТНО</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              GiftX — это уникальный способ получать НОВЫХ клиентов и УВЕЛИЧИВАТЬ количество гостей БЕСПЛАТНО за счет обмена аудиторией с другими бизнесами (кросс-маркетинговая B2B платформа). Выдавайте подарки партнеров за чек от определённой суммы, мотивируйте гостей заказывать больше и привлекайте готовых клиентов из лучших ресторанов и СПА города.
            </p>

            {/* Быстрые CTA кнопки */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-3 justify-center lg:justify-start">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onRegisterPartner();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-black text-slate-950 text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2.5 active:scale-95 transition-all hover:brightness-110"
              >
                <PlusCircle className="w-5 h-5 text-slate-950" />
                <span>Подключить заведение за 2 минуты</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenAdminDemo();
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2 transition-all"
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Демо-панель Управляющего</span>
              </button>
            </div>

            {/* Доверительные факты */}
            <div className="pt-4 flex items-center justify-center lg:justify-start space-x-6 text-xs text-slate-400 border-t border-slate-900">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Без абонентской платы</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Кросс-трафик партнеров</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>Геймификация персонала</span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Фото ресторана и плашка результатов */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 group">
              <img
                src="/images/lively_terrace.png"
                alt="Full lively restaurant venue with guests"
                className="w-full h-80 sm:h-96 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Плавающая плашка ROI */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 shadow-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-xs font-black">
                      📈
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-100">Результат заведения сети:</h4>
                      <p className="text-[10px] text-slate-300">Прирост выручки за 30 дней</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    Рост выручки до +40%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-slate-200 flex items-center justify-between">
                  <span>👥 Пришло новых гостей:</span>
                  <span className="text-amber-400 font-extrabold">+120 клиентов</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. THE PROBLEM (БОЛЬ ВЛАДЕЛЬЦА ЗАВЕДЕНИЯ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-6 shadow-xl">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
              <span>💸 Проблемы традиционного маркетинга</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Почему традиционная реклама сливает бюджет?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Вы тратите тысячи долларов на таргетинг и блогеров, но гости приходят один раз или не приходят вовсе.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Дорогой привлеченный клиент (CAC)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Таргетированная реклама и блогеры требуют расходов до визита гостей, без гарантий повторных чеков.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Низкий средний чек</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Гости берут по 1 напитку или десерту и сидят за столиком весь вечер — официантам трудно допродать позиции.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Пустые столы в будни</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                В дневное время и будние дни сложно привлечь целевых гостей без снижения цен себе в убыток.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. THE GUIDE & 3-STEP PLAN (ПЛАН ДЛЯ БИЗНЕСА) */}
        {/* ========================================== */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase text-emerald-400 tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Решение GiftX B2B
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Как заведение зарабатывает больше? 3 шага
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Простой алгоритм роста выручки и получения платящего трафика клиентов.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Шаг 1 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xl shadow-md">
                  📜
                </div>
                <span className="text-xs uppercase font-black text-amber-400">Шаг 1</span>
                <h3 className="font-extrabold text-slate-100 text-base">Подключите заведение за 2 минуты</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Без платных подписок и сложных систем. Настройте адрес, меню и категории подарков.
                </p>
              </div>
              <img
                src="/images/lively_restaurant.png"
                alt="Venue onboarding with happy guests"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>

            {/* Шаг 2 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-xl shadow-md">
                  📦
                </div>
                <span className="text-xs uppercase font-black text-emerald-400">Шаг 2</span>
                <h3 className="font-extrabold text-slate-100 text-base">Установите порог чека для бокса</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Официант вручает бокс при достижении целевой суммы чека заведения. Гости охотно дозаказывают позиции!
                </p>
              </div>
              <img
                src="/images/waiter_guest_dialogue.png"
                alt="Friendly dialogue between waiter and guest"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>

            {/* Шаг 3 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
                  🚀
                </div>
                <span className="text-xs uppercase font-black text-emerald-400">Шаг 3</span>
                <h3 className="font-extrabold text-slate-100 text-base">Получайте трафик БЕСПЛАТНО</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ваши бесплатные ваучеры попадают в боксы партнеров сети. Гости ресторанов и СПА приходят к вам!
                </p>
              </div>
              <img
                src="/images/lively_terrace.png"
                alt="Happy customers in lively venue"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. PROFITABILITY EXAMPLE BREAKDOWN (ПРИМЕР РАСЧЁТА ПРИБЫЛЬНОСТИ) */}
        {/* ========================================== */}
        <div className="glass-card p-5 sm:p-7 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-5 shadow-2xl max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <span className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shrink-0">
                📊
              </span>
              <div>
                <h3 className="font-black text-slate-100 text-base sm:text-lg">Пример расчёта прибыльности заведения</h3>
                <p className="text-xs text-slate-400">Наглядная математика роста выручки за 30 дней работы с GiftX</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowFlyerModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center space-x-1.5 transition-all shrink-0 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>📄 B2B Листовка (PDF / JPEG)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Карточка 1: Исходные параметры */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 shadow-md">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                ☕ Исходные параметры ресторана / кафе:
              </span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Текущий средний чек:</span>
                  <span className="font-extrabold text-amber-400">300,000 VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Порог чека для GiftX бокса:</span>
                  <span className="font-extrabold text-emerald-400">600,000 VND (+100%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Обслуживаемых столов в день:</span>
                  <span className="font-extrabold text-slate-100">30 чеков</span>
                </div>
              </div>
            </div>

            {/* Карточка 2: Итоговая выгода */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2.5 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  📈 Итоговый результат за 30 дней:
                </span>
                <h4 className="text-2xl font-black text-emerald-400 mt-1">
                  +36,000,000 VND / мес
                </h4>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-900 text-slate-300">
                <div className="flex justify-between items-center">
                  <span>👥 Приток новых гостей из сети:</span>
                  <span className="text-amber-400 font-extrabold">+120 клиентов / мес</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>💰 Стоимость привлечения (CAC):</span>
                  <span className="text-emerald-400 font-bold">0$ (Кросс-маркетинг)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onRegisterPartner();
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all hover:brightness-110 flex items-center justify-center space-x-2"
            >
              <span>Подключить заведение бесплатно</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setShowFlyerModal(true);
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-slate-200 text-xs rounded-2xl flex items-center justify-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Скачать рекламную листовку B2B</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. GAMIFICATION & STAFF MOTIVATION */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-black uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>Геймификация и Турниры</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Мотивируйте официантов поднимать средний чек
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Встроенная турнирная таблица персонально мотивирует персонал предлагать боксы за высокий чек. Бот отправляет поздравления лидеру смены в Telegram и высылает вам ежедневный краткий отчет выручки!
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
                <span className="text-amber-400 text-base">🥇</span>
                <span className="text-slate-200">Авто-награждение лидера смены в Telegram</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
                <span className="text-emerald-400 text-base">📊</span>
                <span className="text-slate-200">Ежедневный отчет Владельцу — кто сколько выдал</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <img
              src="/images/waiter_happy_guests.png"
              alt="Waiters team and happy guests"
              className="w-full h-72 sm:h-80 rounded-3xl object-cover border border-slate-800 shadow-2xl"
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. FINAL CTA BANNER (ФИНАЛЬНЫЙ ПРИЗЫВ) */}
        {/* ========================================== */}
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-950 text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-3xl mx-auto shadow-lg">
            🏬
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Готовы поднять средний чек и наполнить заведение гостями?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Регистрация заведения занимает 2 минуты и мгновенно открывает доступ к сети B2B партнеров.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onRegisterPartner();
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-sm sm:text-base active:scale-95 transition-all hover:brightness-110"
            >
              <span>Зарегистрировать заведение бесплатно</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                setShowFlyerModal(true);
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-slate-200 rounded-2xl flex items-center justify-center space-x-2 text-sm transition-all"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>📄 Листовка B2B (PDF / JPEG)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Модалка Рекламной Листовки B2B */}
      {showFlyerModal && (
        <B2BPromoFlyerModal
          onClose={() => setShowFlyerModal(false)}
          onRegisterClick={onRegisterPartner}
        />
      )}
    </div>
  );
};
