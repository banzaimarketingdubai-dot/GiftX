import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Gift, Users, TrendingUp, ChevronRight, ChevronLeft, X, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../telegram';

interface BusinessOnboardingModalProps {
  onClose: () => void;
  onProceedToRegistration: () => void;
}

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({
  onClose,
  onProceedToRegistration,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Building2,
      color: 'from-amber-500 to-amber-600',
      badge: 'ШАГ 1 ИЗ 4: ЗАВЕДЕНИЕ',
      title: 'Создание профиля заведения',
      subtitle: 'Укажите координаты Google Maps, категорию и адрес',
      description: 'Заполните профиль ресторана, СПА или сервиса. Установите пороги чеков (Silver/Gold Thresholds), при достижении которых официанты будут выдавать клиентам подарки.',
      illustration: '🏬 📍 🎯'
    },
    {
      icon: Gift,
      color: 'from-emerald-500 to-teal-600',
      badge: 'ШАГ 2 ИЗ 4: ПОДАРКИ',
      title: 'Добавление подарков и ваучеров',
      subtitle: 'Настройте кросс-маркетинговые акции сети',
      description: 'Создавайте бесплатные тизерные напитки/десерты (TRAFFIC_MAGNET) или скидки 15-30% (LIFESTYLE). Гости других ресторанов города получат ваши ваучеры и придут к вам!',
      illustration: '🎁 🍸 💆‍♂️ 🎟️'
    },
    {
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
      badge: 'ШАГ 3 ИЗ 4: ПЕРСОНАЛ',
      title: 'Привязка персонала и официантов',
      subtitle: 'Геймификация и вызов боксов через Telegram',
      description: 'Назначайте роли: WAITER (выдача боксов), MANAGER (управление) или OWNER. Персонал сканирует QR-код привязки в боте и участвует в авто-турнире заведения.',
      illustration: '👥 📱 🏆 ⚡'
    },
    {
      icon: TrendingUp,
      color: 'from-amber-400 to-orange-500',
      badge: 'ШАГ 4 ИЗ 4: АНАЛИТИКА',
      title: 'Статистика и авто-отчеты',
      subtitle: 'Контролируйте выручку и гашения ваучеров',
      description: 'Следите за конверсией возврата клиентов (Redemption Rate) и приростом среднего чека. Ежедневные отчеты отправляются Владельцу прямо в Telegram Бот!',
      illustration: '📊 📈 🤖 💰'
    }
  ];

  const handleNext = () => {
    triggerHaptic('light');
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      triggerHaptic('heavy');
      onProceedToRegistration();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[520px]">
        {/* Фоновый свечение */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Кнопка закрытия */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Шапка слайда */}
        <div className="space-y-4 pt-2 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full uppercase">
              {steps[currentStep].badge}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {/* Иконка с градиентом */}
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${steps[currentStep].color} p-0.5 shadow-xl flex items-center justify-center my-2`}>
                <div className="w-full h-full bg-slate-950/40 rounded-[22px] flex items-center justify-center backdrop-blur-md">
                  <StepIcon className="w-10 h-10 text-white drop-shadow-md" />
                </div>
              </div>

              {/* Эмодзи-иллюстрация */}
              <div className="text-3xl text-center tracking-widest select-none py-1">
                {steps[currentStep].illustration}
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-xl font-black text-slate-100">{steps[currentStep].title}</h3>
                <p className="text-xs font-semibold text-amber-400">{steps[currentStep].subtitle}</p>
                <p className="text-xs text-slate-400 leading-relaxed px-2 pt-1">{steps[currentStep].description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Прогресс-бар и кнопки навигации */}
        <div className="pt-6 space-y-5 z-10">
          {/* Буллеты */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-8 bg-amber-400 shadow-md shadow-amber-400/50'
                    : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                currentStep === steps.length - 1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25 hover:brightness-110'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>{currentStep === steps.length - 1 ? 'Зарегистрировать заведение 🚀' : 'Далее'}</span>
              {currentStep < steps.length - 1 ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4 text-slate-950" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
