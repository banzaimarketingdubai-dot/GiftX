import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Gift, Users, TrendingUp, ChevronRight, ChevronLeft, X, CheckCircle2, Sparkles, ArrowRight, ShieldCheck, BarChart3 } from 'lucide-react';
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
      icon: Gift,
      color: 'from-amber-500 via-amber-400 to-amber-600',
      badge: '1/4: КРОСС-МАРКЕТИНГ И ПОДАРКИ',
      title: 'Бесплатный обмен клиентами (0$ CAC)',
      subtitle: 'Привлекайте новых гостей из лучших заведений города',
      description: 'Выдавайте сюрприз-боксы с подарками партнёров (бесплатный коктейль, массаж или скидка) за целевой чек. Гости других ресторанов и СПА получают ваши подарки и приходят к вам!',
      illustration: '🎁 🍸 💆‍♂️ 🎟️',
      highlights: [
        '0$ расходов на рекламу (CAC = 0)',
        'Рост среднего чека заведения до +40%',
        'Готовый поток платежеспособных гостей'
      ]
    },
    {
      icon: Building2,
      color: 'from-emerald-500 via-teal-400 to-emerald-600',
      badge: '2/4: СОЗДАНИЕ ЗАВЕДЕНИЯ',
      title: 'Быстрая настройка за 2 минуты',
      subtitle: 'Локация на карте, меню и пороги чеков',
      description: 'Заполните название вашего заведения, адрес и геолокацию Google Maps. Укажите порог суммы чека (например 600,000 VND), при котором официанты будут вручать клиентам HappyBox.',
      illustration: '🏬 📍 🎯 ⚡',
      highlights: [
        'Отображение на интерактивной карте',
        'Гибкие настройки целевого чека',
        'Без абонентских плат и комиссий'
      ]
    },
    {
      icon: Users,
      color: 'from-purple-500 via-indigo-500 to-purple-600',
      badge: '3/4: УПРАВЛЕНИЕ ПЕРСОНАЛОМ',
      title: 'Привязка официантов и Турниры',
      subtitle: 'Мотивация персонала поднимать средний чек',
      description: 'Официанты и администраторы привязываются за 5 секунд через QR-код в Telegram. Персонал мотивирован выдавать боксы, участвует в авто-турнире и получает награды за высокий чек.',
      illustration: '👥 📱 🏆 ⚡',
      highlights: [
        'Мгновенная авторизация через Telegram',
        'Автоматический турнир официантов',
        'Защита от фрода и повторной выдачи'
      ]
    },
    {
      icon: TrendingUp,
      color: 'from-amber-400 via-orange-500 to-red-500',
      badge: '4/4: СТАТИСТИКА И РЕЗУЛЬТАТЫ',
      title: 'Дашборд Управляющего & Telegram Отчёты',
      subtitle: 'Контролируйте выручку и гашение ваучеров в реальном времени',
      description: 'Следите за конверсией возврата гостей (Redemption Rate) и суммарным приростом выручки. Каждую смену бот автоматически отправляет управляющему и владельцу краткий отчёт в Telegram!',
      illustration: '📊 📈 🤖 💰',
      highlights: [
        'Ежедневный авто-отчёт владельцу в Telegram',
        'Прозрачная аналитика всех гашений',
        'Учёт прироста выручки за 30 дней'
      ]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0e1621]/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md bg-[#17212b] border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[540px] my-auto font-sans">
        {/* Кнопка закрытия */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Шапка слайда */}
        <div className="space-y-4 pt-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold tracking-widest px-3 py-1 bg-[#2aabee]/15 border border-[#2aabee]/30 text-[#2aabee] rounded-full uppercase flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[#2aabee]" />
              <span>{steps[currentStep].badge}</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.22 }}
              className="space-y-3.5"
            >
              {/* Иконка ТЕЛЕГРАМ СТИЛЬ */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#242f3d] border border-white/10 p-0.5 shadow-md flex items-center justify-center my-1">
                <div className="w-full h-full rounded-[14px] flex items-center justify-center bg-[#2aabee]/15 border border-[#2aabee]/30">
                  <StepIcon className="w-8 h-8 text-[#2aabee]" />
                </div>
              </div>

              {/* Эмодзи-иллюстрация */}
              <div className="text-2xl text-center tracking-widest select-none py-0.5">
                {steps[currentStep].illustration}
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-extrabold text-slate-100">{steps[currentStep].title}</h3>
                <p className="text-xs font-bold text-[#2aabee]">{steps[currentStep].subtitle}</p>
                <p className="text-xs text-slate-300 leading-relaxed px-1 pt-1">{steps[currentStep].description}</p>
              </div>

              {/* Ключевые преимущества (Highlights) */}
              <div className="bg-[#242f3d] p-3 rounded-xl border border-white/5 space-y-1.5 mt-3">
                {steps[currentStep].highlights.map((h, i) => (
                  <div key={i} className="flex items-center space-x-2 text-[11px] font-bold text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Прогресс-бар и кнопки навигации */}
        <div className="pt-4 space-y-3.5 z-10">
          {/* Буллеты */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx
                    ? 'w-7 bg-[#2aabee] shadow-sm shadow-[#2aabee]/50'
                    : 'w-2 bg-[#242f3d] hover:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="py-3 px-4 rounded-xl bg-[#242f3d] hover:bg-[#2b394a] text-slate-300 font-bold text-xs flex items-center space-x-1 transition-all border border-white/5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 py-3 px-6 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-2 transition-all bg-[#2aabee] hover:bg-[#229ed9] text-white shadow-md shadow-[#2aabee]/30 cursor-pointer"
            >
              <span>{currentStep === steps.length - 1 ? 'Подключить заведение 🚀' : 'Далее'}</span>
              {currentStep < steps.length - 1 ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ArrowRight className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

