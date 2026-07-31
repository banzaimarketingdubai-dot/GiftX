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
  Award
} from 'lucide-react';
import { triggerHaptic } from '../telegram';

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
  // Состояние Калькулятора ROI
  const [avgCheck, setAvgCheck] = useState<number>(300000);
  const [targetCheck, setTargetCheck] = useState<number>(600000);
  const [dailyChecks, setDailyChecks] = useState<number>(30);

  // Расчет результатов
  const checkIncrease = Math.max(0, targetCheck - avgCheck);
  const conversionRate = 0.4; // 40% гостей поднимают чек ради бокса
  const monthlyRevenueGain = checkIncrease * dailyChecks * conversionRate * 30;
  const monthlyNewGuests = Math.round(dailyChecks * 0.3 * 30);

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
              GiftX — кросс-маркетинговая B2B платформа. Выдавайте подарки партнеров за чек от определённой суммы, мотивируйте гостей заказывать больше и привлекайте готовых клиентов из лучших ресторанов и СПА города.
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
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80"
                alt="Successful restaurant venue"
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
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80"
                alt="Venue onboarding"
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
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80"
                alt="Waiter presenting box"
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
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"
                alt="Happy customers in venue"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. ROI CALCULATOR (АДАПТИВНЫЙ КАЛЬКУЛЯТОР ВЫГОДЫ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <Calculator className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-black text-slate-100 text-lg sm:text-xl">Калькулятор прироста выручки заведения</h3>
                <p className="text-xs text-slate-400">Передвигайте ползунки и посчитайте дополнительную прибыль</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              Бесплатная B2B модель
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            {/* Ползунки */}
            <div className="lg:col-span-7 space-y-5">
              {/* Поле 1: Текущий средний чек */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-xs sm:text-sm text-slate-200">
                  <span>Текущий средний чек:</span>
                  <span className="text-amber-400 font-black">{avgCheck.toLocaleString()} VND</span>
                </div>
                <input
                  type="range"
                  min="100000"
                  max="1000000"
                  step="50000"
                  value={avgCheck}
                  onChange={(e) => setAvgCheck(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Поле 2: Целевой порог чека для GiftX */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-xs sm:text-sm text-slate-200">
                  <span>Целевой порог чека для GiftX бокса:</span>
                  <span className="text-emerald-400 font-black">{targetCheck.toLocaleString()} VND</span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="2000000"
                  step="50000"
                  value={targetCheck}
                  onChange={(e) => setTargetCheck(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Поле 3: Чеков в день */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-extrabold text-xs sm:text-sm text-slate-200">
                  <span>Обслуживаемых чеков в день:</span>
                  <span className="text-slate-100 font-black">{dailyChecks} чеков</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="5"
                  value={dailyChecks}
                  onChange={(e) => setDailyChecks(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>
            </div>

            {/* Карточка с подведенными итоговыми данными */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Расчётная выгода в месяц:
                </span>
                <h4 className="text-2xl sm:text-3xl font-black text-emerald-400">
                  +{monthlyRevenueGain.toLocaleString()} VND
                </h4>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">👥 Приток новых гостей/мес:</span>
                  <span className="text-amber-400 font-black text-sm">+{monthlyNewGuests} клиентов</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">💰 Затраты на маркетинг:</span>
                  <span className="text-emerald-400 font-bold">0$ (Бесплатно)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onRegisterPartner();
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Подключить заведение с этими параметрами
              </button>
            </div>
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
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
              alt="Waiters team and staff leaderboard"
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
          </div>
        </div>

      </div>
    </div>
  );
};
