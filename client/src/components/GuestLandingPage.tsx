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
  Compass
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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-12">
      {/* Фоновые неоновые свечения */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/15 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute top-2/3 -left-20 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-md mx-auto px-4 pt-4 space-y-8 relative z-10">
        
        {/* Переключатель лендинга (Гость vs Заведение) */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 backdrop-blur-md">
          <button className="flex-1 py-2 rounded-xl text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20">
            🎁 Для Гостей (VIP Pass)
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              onSwitchToBusinessLanding();
            }}
            className="flex-1 py-2 rounded-xl text-xs font-extrabold text-slate-400 hover:text-slate-200 transition-all"
          >
            🏬 Для Заведений (B2B)
          </button>
        </div>

        {/* ========================================== */}
        {/* 1. HERO SECTION (ОБЕЩАНИЕ И КРЮЧОК) */}
        {/* ========================================== */}
        <div className="text-center space-y-4 pt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Инновационная система VIP-привилегий</span>
          </div>

          <h1 className="text-3xl font-black leading-tight text-slate-100">
            Отдыхай в лучших местах города — <span className="text-gradient-gold">получай подарки</span> и поднимай статус!
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Оплачивайте счет в ресторанах, СПА и клубах сети GiftX и моментально получайте боксы с реальными бесплатными ваучерами.
          </p>

          {/* Быстрые CTA кнопки */}
          <div className="flex flex-col space-y-2.5 pt-2">
            <button
              onClick={() => {
                triggerHaptic('heavy');
                onOpenWallet();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-black text-slate-950 text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Gift className="w-5 h-5 text-slate-950" />
              <span>Забрать свой VIP Pass и подарки</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenMap();
              }}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-extrabold flex items-center justify-center space-x-2"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Карта VIP-заведений города</span>
            </button>
          </div>
        </div>

        {/* ========================================== */}
        {/* 2. THE PROBLEM (БОЛЬ ГОСТЯ) */}
        {/* ========================================== */}
        <div className="glass-card p-5 rounded-3xl border border-red-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 space-y-3 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 text-sm font-black">
              ⚡
            </div>
            <h3 className="font-extrabold text-slate-100 text-xs uppercase tracking-wider">
              Устали от бесполезных накопительных карт?
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Сгорающие баллы:</strong> Приходится копить полгода ради скидки в 3%.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Одно заведение:</strong> Каждая карта работает только в 1 месте.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start space-x-3">
              <span className="text-red-400 font-bold text-base leading-none">❌</span>
              <p className="text-slate-300 text-[11px]">
                <strong className="text-slate-100">Нет чувства VIP:</strong> Никакой выгоды и внимания к постоянным гостям.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. THE GUIDE & 3-STEP PLAN (ПЛАН ДЕЙСТВИЙ) */}
        {/* ========================================== */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-black text-amber-400 tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Решение GiftX
            </span>
            <h2 className="text-lg font-black text-slate-100">Как это работает? 3 простых шага</h2>
          </div>

          <div className="space-y-3">
            {/* Шаг 1 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-lg shrink-0">
                🍷
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-amber-400 block">Шаг 1</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Отдыхайте в заведениях сети</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Посещайте любимые рестораны, СПА и клубы города.
                </p>
              </div>
            </div>

            {/* Шаг 2 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-lg shrink-0">
                📱
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-amber-400 block">Шаг 2</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Сканируйте QR-бокс официанта</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  При оплате счета официант покажет QR-код подарочного бокса.
                </p>
              </div>
            </div>

            {/* Шаг 3 */}
            <div className="glass-card p-4 rounded-3xl border border-amber-500/30 bg-slate-900/90 flex items-center space-x-3.5 shadow-lg relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                👑
              </div>
              <div>
                <span className="text-[9px] uppercase font-black text-amber-400 block">Шаг 3</span>
                <h4 className="font-extrabold text-slate-100 text-xs">Распаковывайте подарки & VIP-статус</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Получайте сеты ваучеров и открывайте уровни от Бронзы до Платины!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 4. STATUS SYSTEM & PRIVILEGES (VIP СТАТУСЫ) */}
        {/* ========================================== */}
        <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950 to-slate-950 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-black text-slate-100 text-sm">Уровни VIP-статуса и привилегии</h3>
              <p className="text-[10px] text-slate-400">Чем выше счет, тем дороже подарки внутри бокса</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {/* BASIC */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-700/20 border border-amber-600/40 text-amber-500 flex items-center justify-center text-xs font-black">
                  🥉
                </span>
                <div>
                  <span className="font-black text-slate-100 text-xs block">BASIC Pass</span>
                  <span className="text-[10px] text-slate-400">Любая сумма чека</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                Приветственный напиток / скидка
              </span>
            </div>

            {/* SILVER */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-slate-300/20 border border-slate-300/40 text-slate-200 flex items-center justify-center text-xs font-black">
                  🥈
                </span>
                <div>
                  <span className="font-black text-slate-100 text-xs block">SILVER VIP</span>
                  <span className="text-[10px] text-slate-400">Чек от 300,000 VND</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-200 bg-slate-300/10 px-2 py-0.5 rounded-lg border border-slate-300/20">
                Фирменный десерт / СПА процедура
              </span>
            </div>

            {/* GOLD */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center text-xs font-black">
                  🥇
                </span>
                <div>
                  <span className="font-black text-amber-400 text-xs block">GOLD VIP</span>
                  <span className="text-[10px] text-slate-400">Чек от 600,000 VND</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                Авторский сет + Сертификаты
              </span>
            </div>

            {/* PLATINUM */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/40 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center text-xs font-black">
                  💎
                </span>
                <div>
                  <span className="font-black text-purple-300 text-xs block">PLATINUM ELITE</span>
                  <span className="text-[10px] text-slate-400">Чек от 1,000,000 VND</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                Полный VIP эксклюзив
              </span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 5. EXAMPLES OF GIFTS (ПРИМЕРЫ ПОДАРКОВ) */}
        {/* ========================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Подарки, которые ждут вас в боксах:
            </h3>
            <span className="text-[10px] text-amber-400 font-bold">100% бесплатно</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <img
                src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&q=80"
                alt="Cocktail"
                className="w-full h-20 rounded-xl object-cover"
              />
              <div>
                <span className="text-[9px] uppercase font-black text-amber-400 block">Sunset Beach</span>
                <h5 className="font-extrabold text-slate-100 text-xs truncate">Коктейль «Sunset Chill»</h5>
                <span className="text-[10px] text-emerald-400 font-bold">Бесплатно при заказе</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <img
                src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&q=80"
                alt="Spa"
                className="w-full h-20 rounded-xl object-cover"
              />
              <div>
                <span className="text-[9px] uppercase font-black text-purple-400 block">Lotus Spa</span>
                <h5 className="font-extrabold text-slate-100 text-xs truncate">30-мин Фут-Массаж</h5>
                <span className="text-[10px] text-emerald-400 font-bold">Сертификат в подарках</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* 6. FINAL CTA BANNER (ФИНАЛЬНЫЙ ПРИЗЫВ) */}
        {/* ========================================== */}
        <div className="glass-card p-6 rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-950 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-2xl mx-auto shadow-lg">
            🎁
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-100">Откройте свой первый подарок прямо сейчас</h3>
            <p className="text-xs text-slate-300 mt-1">
              Перейдите в кошелек и проверяйте активные ваучеры сети заведений!
            </p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              onOpenWallet();
            }}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 font-black text-slate-950 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 text-sm active:scale-95 transition-all"
          >
            <span>Забрать подарки в Кошельке</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

      </div>
    </div>
  );
};
