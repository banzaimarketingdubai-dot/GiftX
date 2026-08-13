import React, { useState } from 'react';
import { X, Sparkles, Gift, Play, RotateCcw } from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';
import { GuestUnpackScreen } from './GuestUnpackScreen';

interface DemoBoxOpeningModalProps {
  onClose: () => void;
}

export const DemoBoxOpeningModal: React.FC<DemoBoxOpeningModalProps> = ({ onClose }) => {
  const [boxLevel, setBoxLevel] = useState<'SILVER' | 'GOLD' | 'PLATINUM'>('GOLD');
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  const handleStartDemo = (level: 'SILVER' | 'GOLD' | 'PLATINUM') => {
    triggerHaptic('heavy');
    setBoxLevel(level);
    setIsPlayingDemo(true);
  };

  if (isPlayingDemo) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between animate-fadeIn overflow-hidden touch-none select-none">
        {/* Верхняя панель Демо-режима с кнопкой ЗАКРЫТЬ */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-3 max-w-md mx-auto w-full flex items-center justify-between z-50 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              ✨ GIFTX {boxLevel}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsPlayingDemo(false);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Боксы</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('medium');
                onClose();
              }}
              className="px-3 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-black flex items-center space-x-1 shadow-md transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Закрыть</span>
            </button>
          </div>
        </div>

        {/* Экран интерактивной распаковки бокса */}
        <div className="flex-1 overflow-y-auto">
          <GuestUnpackScreen
            claimToken={`demo_${boxLevel.toLowerCase()}_token`}
            onFinished={() => {
              triggerNotificationHaptic('success');
              setIsPlayingDemo(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-5 cursor-default relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Шапка модалки */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100">Демонстрация открытия бокса</h3>
              <p className="text-[11px] text-slate-400">Покажите владельцу эффект разблокировки подарка</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Выбор уровня бокса для презентации */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-400">
            🎁 Выберите уровень бокса для показа:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleStartDemo('SILVER')}
              className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 font-bold text-left space-y-1 transition-all group active:scale-95 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-cyan-300 font-black">🥈 SILVER</span>
                <Play className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-400 font-normal">Чек от 300k VND</p>
            </button>

            <button
              onClick={() => handleStartDemo('GOLD')}
              className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 hover:border-amber-400 font-bold text-left space-y-1 transition-all group active:scale-95 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-black">🥇 GOLD</span>
                <Play className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-400 font-normal">Чек от 600k VND</p>
            </button>

            <button
              onClick={() => handleStartDemo('PLATINUM')}
              className="p-3.5 rounded-2xl bg-slate-950 border border-purple-500/50 hover:border-purple-400 font-bold text-left space-y-1 transition-all group active:scale-95 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-purple-300 font-black">💎 PLATINUM</span>
                <Play className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-400 font-normal">VIP Чек от 1.0M VND</p>
            </button>
          </div>
        </div>

        {/* Подсказка админу */}
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1 text-xs">
          <span className="text-amber-400 font-black text-xs block">✨ Совет по презентации:</span>
          <p className="text-slate-300 text-[11px]">
            Дайте смартфон владельцу или менеджеру заведения и попросите его 3 раза тапнуть по коробке для открытия.
          </p>
        </div>
      </div>
    </div>
  );
};
