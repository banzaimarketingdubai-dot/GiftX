import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, QrCode, MapPin, Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../telegram';

interface OnboardingModalProps {
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Gift,
      color: 'from-amber-500 to-amber-600',
      badge: 'ШАГ 1 ИЗ 3: О СЕРВИСЕ',
      title: 'Что такое GiftX?',
      subtitle: 'Инновационная система привилегий и подарков',
      description: 'Каждый раз, когда вы отдыхаете в ресторанах, СПА и барах сети GiftX, вам вручают подарочные боксы с бесплатными сертификатами в лучшие заведения города!',
      illustration: '🍷 🍸 💆‍♀️ 🎟️'
    },
    {
      icon: QrCode,
      color: 'from-purple-500 to-indigo-600',
      badge: 'ШАГ 2 ИЗ 3: КАК ОТКРЫТЬ',
      title: 'Сканируйте QR и тапайте!',
      subtitle: 'Интерактивная кликер-механика распаковки',
      description: 'Попросите у официанта QR-код GiftX при оплате чека. Затем быстро тапайте по коробке, чтобы заполнить шкалу «ТАП ЧТОБЫ ОТКРЫТЬ» и разблокировать веер подарков!',
      illustration: '📲 ⚡️ 💥 🎁'
    },
    {
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
      badge: 'ШАГ 3 ИЗ 3: КОШЕЛЕК И СТАТУС',
      title: 'Гашение ваучеров и VIP-Уровни',
      subtitle: 'Сохраняйте сертификаты и растите от Бронзы до Платины',
      description: 'Добавляйте ваучеры в кошелек «Мои Подарки», предъявляйте их при визитах и повышайте ваш персональный статус лояльности от BASIC до PLATINUM ELITE!',
      illustration: '💎 🥂 🏆 👑'
    }
  ];

  const handleNext = () => {
    triggerHaptic('light');
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('giftx_first_visit_completed', 'true');
      localStorage.setItem('giftx_onboarded', 'true');
      onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]">
        {/* Кнопка закрытия */}
        <button
          onClick={() => {
            triggerHaptic('light');
            localStorage.setItem('giftx_onboarded', 'true');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Заголовок слайда */}
        <div className="space-y-4 pt-2 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full uppercase">
              {steps[currentStep].badge}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Иконка с градиентом */}
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${steps[currentStep].color} p-0.5 shadow-xl flex items-center justify-center my-2`}>
                <div className="w-full h-full bg-slate-950/40 rounded-[22px] flex items-center justify-center backdrop-blur-md">
                  <StepIcon className="w-10 h-10 text-white drop-shadow-md animate-pulse-slow" />
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
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/25'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>{currentStep === steps.length - 1 ? 'Начать использовать GiftX 🚀' : 'Далее'}</span>
              {currentStep < steps.length - 1 ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
