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
  Calculator
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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-12">
      {/* Фоновые свечения */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-8 relative z-10">
        
        {/* Переключатель лендинга (Заведение vs Гость) */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 backdrop-blur-md">
          <button
            onClick={() => {
              triggerHaptic('light');
              onSwitchToGuestLanding();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold text-slate-400 hover:text-slate-200 transition-all"
          >
            🎁 Для Гостей (VIP Pass)
          </button>
          <button className="flex-1 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
            🏬 Для Заведений (B2B)
          </button>
        </div>

        {/* ========================================== */}
        {/* 1. HERO SECTION (ЛИФТ ПИТЧ ДЛЯ БИЗНЕСА) */}
        {/* ========================================== */}
        <div className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>0$ Расходов на маркетинг (CAC = 0)</span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-slate-100">
            Увеличивайте средний чек и получайте <span className="text-gradient-gold">новых клиентов БЕСПЛАТНО</span>
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            GiftX — кросс-маркетинговая B2B сеть. Выдавайте подарки партнеров за чек от определённой суммы и привлекайте готовых клиентов из ресторанов и СПА города.
          </p>

          {/* Быстрые CTA кнопки */}
          <div className="flex flex-col space-y-2.5 pt-2">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onRegisterPartner();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-black text-slate-950 text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
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
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-extrabold flex items-center justify-center space-x-2"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Открыть Демо-панель Управляющего</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. THE PROBLEM (БОЛЬ ВЛАДЕЛЬЦА ЗАВЕДЕНИЯ) */}
        {/* ========================================== */}
        <div className="glass-card p-5 rounded-3xl border border-red-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-sm font-black">
              💸
            </div>
            <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
              Почему традиционная реклама сливает бюджет?
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Дорогой таргетинг:</strong> Контекст и блогеры стоят тысячи долларов без гарантий прихода людей.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Низкий средний чек:</strong> Гости берут по 1 напитку и занимают столик на весь вечер.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Пустые столы в будни:</strong> Сложно привлечь гостей в дневное время без скидок в урон себе.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. THE GUIDE & 3-STEP PLAN (ПЛАН ДЛЯ БИЗНЕСА) */}
        {/* ========================================== */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Решение GiftX B2B
            </span>
            <h2 className="text-lg font-black text-slate-100">Как это работает? 3 простых шага</h2>
          </div>

          <div className="space-y-3">
            {/* Шаг 1 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-lg shrink-0">
                📜
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-amber-400 block">Шаг 1</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Подключите заведение за 2 минуты</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Без сложных интеграций и платы за подключение.
                </p>
              </div>
            </div>

            {/* Шаг 2 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-lg shrink-0">
                📦
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-emerald-400 block">Шаг 2</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Установите порог чека для боксов</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Официант выдает QR-бокс при чеке от 600,000 VND — гости дозаказывают блюда!
                </p>
              </div>
            </div>

            {/* Шаг 3 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-slate-950 font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                🚀
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-emerald-400 block">Шаг 3</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Получайте трафик гостей БЕСПЛАТНО</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Гости из других заведений сети приходят к вам по ваучерам из боксов.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. ROI CALCULATOR (КАЛЬКУЛЯТОР ВЫГОДЫ) */}
        {/* ========================================== */}
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <Calculator className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-black text-slate-100 text-sm">Калькулятор прироста выручки заведения</h3>
              <p className="text-[10px] text-slate-400">Посчитайте выгоду от внедрения GiftX B2B</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Поле 1: Текущий средний чек */}
            <div>
              <div className="flex justify-between font-extrabold text-slate-200 mb-1">
                <span>Текущий средний чек:</span>
                <span className="text-amber-400">{avgCheck.toLocaleString()} VND</span>
              </div>
              <input
                type="range"
                min="100000"
                max="1000000"
                step="50000"
                value={avgCheck}
                onChange={(e) => setAvgCheck(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Поле 2: Целевой порог чека для GiftX */}
            <div>
              <div className="flex justify-between font-extrabold text-slate-200 mb-1">
                <span>Порог чека для вызова GiftX бокса:</span>
                <span className="text-emerald-400">{targetCheck.toLocaleString()} VND</span>
              </div>
              <input
                type="range"
                min="200000"
                max="2000000"
                step="50000"
                value={targetCheck}
                onChange={(e) => setTargetCheck(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Поле 3: Чеков в день */}
            <div>
              <div className="flex justify-between font-extrabold text-slate-200 mb-1">
                <span>Количество чеков в день:</span>
                <span className="text-slate-100">{dailyChecks} чеков</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={dailyChecks}
                onChange={(e) => setDailyChecks(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Результаты расчета */}
            <div className="pt-3 border-t border-slate-800 space-y-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">📈 Доп. выручка заведения в месяц:</span>
                <span className="text-emerald-400 font-black text-sm">+{monthlyRevenueGain.toLocaleString()} VND</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">👥 Новых пришедших гостей/мес:</span>
                <span className="text-amber-400 font-black text-xs">+{monthlyNewGuests} гостей</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">💰 Затраты на рекламу:</span>
                <span className="text-emerald-400 font-extrabold text-xs">0$ (Бесплатно)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. GAMIFICATION & STAFF MANAGEMENT */}
        {/* ========================================== */}
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-3 shadow-lg">
          <div className="flex items-center space-x-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
              Геймификация и мотивация официантов
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Встроенная турнирная таблица персонально мотивирует персонал предлагать боксы за высокий чек. Автоматические отчеты владельцу в Telegram каждый вечер!
          </p>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-300">🥇 Авто-поздравления лидера дня в Bot</span>
            <span className="text-emerald-400 font-black">Включено</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. FINAL CTA BANNER (ФИНАЛЬНЫЙ ПРИЗЫВ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-950 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-2xl mx-auto shadow-lg">
            🏬
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-100">Готовы поднять средний чек вашего заведения?</h3>
            <p className="text-xs text-slate-300 mt-1">
              Регистрация заведения занимает 2 минуты и открывает доступ к сети B2B партнеров.
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              onRegisterPartner();
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-sm active:scale-95 transition-all"
          >
            <span>Зарегистрировать заведение бесплатно</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

      </div>
    </div>
  );
};
