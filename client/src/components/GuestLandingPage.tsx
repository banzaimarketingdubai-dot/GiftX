import React from 'react';
import { 
  Sparkles, 
  Gift, 
  Crown, 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  MapPin, 
  Coffee, 
  Star, 
  Award,
  ChevronRight,
  TrendingUp,
  Compass,
  Heart,
  Smartphone,
  Lock,
  Smile
} from 'lucide-react';
import { triggerHaptic } from '../telegram';

interface GuestLandingPageProps {
  onOpenWallet: () => void;
  onOpenMap: () => void;
  onSwitchToBusinessLanding: () => void;
}

export const GuestLandingPage: React.FC<GuestLandingPageProps> = ({
  onOpenWallet,
  onOpenMap,
  onSwitchToBusinessLanding,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-16">
      {/* Фоновые стильные неоновые свечения */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-2/3 -left-20 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Основной адаптивный контейнер: на мобильных max-w-md, на ПК max-w-6xl */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Переключатель лендинга (Для Гостей vs Для Заведений) */}
        <div className="max-w-md mx-auto flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <button className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5">
            <Gift className="w-4 h-4 text-slate-950" />
            <span>Для Гостей (VIP Pass)</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onSwitchToBusinessLanding();
            }}
            className="flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>🏬 Для Заведений (B2B)</span>
          </button>
        </div>

        {/* ========================================== */}
        {/* 1. HERO SECTION (АДАПТИВНЫЙ БЛОК: ПК И МОБ) */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-2">
          {/* Левая колонка: Текст и Кнопки */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>Инновационная система VIP-привилегий</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-slate-100 tracking-tight">
              Отдыхайте в лучших местах города — <span className="text-gradient-gold">получайте подарки</span> и поднимайте свой статус!
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Каждый раз, когда вы отдыхаете в ресторанах, СПА и клубах сети GiftX, вы получаете подарочные боксы с настоящими бесплатными ваучерами. Распаковывайте подарки и открывайте привилегии от Бронзы до Платины!
            </p>

            {/* Быстрые CTA кнопки */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-3 justify-center lg:justify-start">
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onOpenWallet();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-black text-slate-950 text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2.5 active:scale-95 transition-all hover:brightness-110"
              >
                <Gift className="w-5 h-5 text-slate-950" />
                <span>Забрать свой VIP Pass</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenMap();
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-extrabold flex items-center justify-center space-x-2 transition-all"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Карта VIP-заведений</span>
              </button>
            </div>

            {/* Доверительные факты */}
            <div className="pt-4 flex items-center justify-center lg:justify-start space-x-6 text-xs text-slate-400 border-t border-slate-900">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Бесплатно</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Лучшие заведения</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Мгновенная выдача</span>
              </div>
            </div>
          </div>

          {/* Правая колонка: Яркое эмоциональное фото с интерактивной карточкой */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 group">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Friends enjoying restaurant gifts"
                className="w-full h-80 sm:h-96 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

              {/* Плавающая плашка с открытым подарком */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/40 shadow-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-xs font-black">
                      👑
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-100">Вы открыли VIP-Бокс!</h4>
                      <p className="text-[10px] text-slate-300">Ресторан Sunset Beach Club</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    +1 Ваучер
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-bold text-amber-300 flex items-center justify-between">
                  <span>🍷 Бесплатный авторский коктейль</span>
                  <span className="text-emerald-400 text-[10px]">В кошельке</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. THE PROBLEM (БОЛЬ ГОСТЯ И СТАРЫХ КАРТ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-6 shadow-xl">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider">
              <span>⚡ Знакомая ситуация?</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Устали от бесполезных накопительных карт?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Обычные программы лояльности заставляют копить баллы месяцами, а потом они просто сгорают.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Сгорающие баллы</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Вы копите баллы полгода, чтобы получить скидку 3%, а они сгорают в самый не подходящий момент.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Одно заведение</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Кафе, СПА, ресторан — везде требуется скачивать отдельное приложение или брать пластиковую карту.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-black text-lg">
                ❌
              </div>
              <h4 className="font-extrabold text-slate-100 text-sm">Никакого чувства VIP</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Постоянный вы гость или пришли впервые — заведение относится к вам абсолютно одинаково.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. THE GUIDE & 3-STEP PLAN (ПЛАН И РЕШЕНИЕ) */}
        {/* ========================================== */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase text-amber-400 tracking-widest px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              Решение GiftX
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Как это работает? 3 простых шага к VIP-подаркам
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Без накопления баллов и длинных анкет. Настоящие подарки прямо при оплате чека!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Шаг 1 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xl shadow-md">
                  🍷
                </div>
                <span className="text-xs uppercase font-black text-amber-400">Шаг 1</span>
                <h3 className="font-extrabold text-slate-100 text-base">Отдыхайте в заведениях сети</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Выбирайте рестораны, СПА и бары на интерактивной карте города. Наслаждайтесь едой и сервисом.
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80"
                alt="Dining out"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>

            {/* Шаг 2 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-xl shadow-md">
                  📱
                </div>
                <span className="text-xs uppercase font-black text-amber-400">Шаг 2</span>
                <h3 className="font-extrabold text-slate-100 text-base">Сканируйте QR-бокс официанта</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  При оплате чека попросите официанта показать QR-код GiftX. Камера телефона сразу откроет бокс!
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80"
                alt="Waiter showing QR"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>

            {/* Шаг 3 */}
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
                  👑
                </div>
                <span className="text-xs uppercase font-black text-amber-400">Шаг 3</span>
                <h3 className="font-extrabold text-slate-100 text-base">Распаковывайте подарки & VIP-статус</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Сохраняйте бесплатные ваучеры в кошелек свайпом и повышайте уровень от Бронзы до Платины!
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&q=80"
                alt="Unboxing luxury gifts and rewards"
                className="w-full h-36 rounded-2xl object-cover border border-slate-800 mt-2"
              />
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. STATUS SYSTEM & PRIVILEGES (VIP СТАТУСЫ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-center sm:text-left">
              <Crown className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-black text-slate-100 text-lg sm:text-xl">Уровни VIP-статуса и привилегии</h3>
                <p className="text-xs text-slate-400">Чем выше сумма чека, тем дороже подарки внутри виртуального бокса</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              Повышение статуса происходит автоматически
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* BASIC */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-700/20 border border-amber-600/40 text-amber-500 flex items-center justify-center text-sm font-black">
                  🥉
                </span>
                <span className="text-[10px] font-bold text-slate-400">Чек от любой суммы</span>
              </div>
              <div>
                <h4 className="font-black text-slate-100 text-sm">BASIC Pass</h4>
                <p className="text-xs text-amber-400 font-bold mt-1">Приветственный напиток / скидка 10-15%</p>
              </div>
            </div>

            {/* SILVER */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-slate-300/20 border border-slate-300/40 text-slate-200 flex items-center justify-center text-sm font-black">
                  🥈
                </span>
                <span className="text-[10px] font-bold text-slate-400">Чек от 300,000 VND</span>
              </div>
              <div>
                <h4 className="font-black text-slate-100 text-sm">SILVER VIP</h4>
                <p className="text-xs text-slate-200 font-bold mt-1">Фирменный десерт / СПА процедура</p>
              </div>
            </div>

            {/* GOLD */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-sm font-black">
                  🥇
                </span>
                <span className="text-[10px] font-bold text-amber-400">Чек от 600,000 VND</span>
              </div>
              <div>
                <h4 className="font-black text-amber-400 text-sm">GOLD VIP</h4>
                <p className="text-xs text-emerald-400 font-bold mt-1">Авторский дегустационный сет</p>
              </div>
            </div>

            {/* PLATINUM */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center text-sm font-black">
                  💎
                </span>
                <span className="text-[10px] font-bold text-purple-300">Чек от 1,000,000 VND</span>
              </div>
              <div>
                <h4 className="font-black text-purple-300 text-sm">PLATINUM ELITE</h4>
                <p className="text-xs text-purple-300 font-bold mt-1">Полный VIP эксклюзив & закрытые ивенты</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. EMOTIONAL GALLERY & REAL REWARDS (ГАЛЕРЕЯ) */}
        {/* ========================================== */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-100">
              Подарки, которые уже ждут вас в боксах
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Партнеры сети дарят 100% бесплатные позиции при заполнении бокса
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-amber-500/40 transition-all">
              <img
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80"
                alt="Beach Cocktail"
                className="w-full h-44 rounded-2xl object-cover"
              />
              <div>
                <span className="text-[10px] uppercase font-black text-amber-400 block">Sunset Beach Club</span>
                <h4 className="font-extrabold text-slate-100 text-sm">Авторский коктейль «Tropical Chill»</h4>
                <p className="text-xs text-emerald-400 font-bold mt-1">Бесплатно по ваучеру</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-purple-500/40 transition-all">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80"
                alt="Spa massage"
                className="w-full h-44 rounded-2xl object-cover"
              />
              <div>
                <span className="text-[10px] uppercase font-black text-purple-400 block">Lotus Spa Resort</span>
                <h4 className="font-extrabold text-slate-100 text-sm">30-мин Фут-массаж с маслами</h4>
                <p className="text-xs text-emerald-400 font-bold mt-1">Бесплатный сертификат</p>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg hover:border-amber-500/40 transition-all">
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80"
                alt="Gourment Steak"
                className="w-full h-44 rounded-2xl object-cover"
              />
              <div>
                <span className="text-[10px] uppercase font-black text-amber-400 block">Prime Grill Restaurant</span>
                <h4 className="font-extrabold text-slate-100 text-sm">Фирменный запечённый десерт</h4>
                <p className="text-xs text-emerald-400 font-bold mt-1">Подарок к заказу</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. FINAL CTA BANNER (ФИНАЛЬНЫЙ ПРИЗЫВ) */}
        {/* ========================================== */}
        <div className="glass-card p-8 sm:p-10 rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-950 text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-3xl mx-auto shadow-lg">
            🎁
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              Готовы начать получать подарки уже сегодня?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Перейдите в кошелек, находите лучшие заведения на карте и наслаждайтесь VIP-привилегиями сети GiftX!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onOpenWallet();
              }}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-sm sm:text-base active:scale-95 transition-all hover:brightness-110"
            >
              <span>Забрать VIP Pass в Кошельке</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenMap();
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Карта VIP-заведений</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
