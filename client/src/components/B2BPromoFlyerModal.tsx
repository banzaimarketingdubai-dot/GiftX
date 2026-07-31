import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Award, 
  QrCode, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface B2BPromoFlyerModalProps {
  onClose: () => void;
  onRegisterClick: () => void;
}

export const B2BPromoFlyerModal: React.FC<B2BPromoFlyerModalProps> = ({
  onClose,
  onRegisterClick,
}) => {
  const flyerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Печать листовки в формате A4 / PDF
  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  // Скачивание листовки в формате JPEG / PNG через Canvas
  const handleDownloadJPEG = async () => {
    try {
      triggerHaptic('heavy');
      setIsDownloading(true);

      const flyerElement = flyerRef.current;
      if (!flyerElement) return;

      // Создаем виртуальный SVG Canvas элемент для рендеринга высокого качества
      const width = 1200;
      const height = 1700;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Заливка премиального темного фона
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#020617');
      bgGradient.addColorStop(0.5, '#0f172a');
      bgGradient.addColorStop(1, '#020617');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Отрисовка золотой рамки
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Отрисовка Логотипа и Заголовков
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('GiftX B2B', 70, 110);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('КРОСС-МАРКЕТИНГОВАЯ ПЛАТФОРМА ДЛЯ БИЗНЕСА', 70, 150);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 48px sans-serif';
      ctx.fillText('Увеличивайте средний чек и получайте', 70, 230);
      
      ctx.fillStyle = '#10b981';
      ctx.fillText('новых клиентов БЕСПЛАТНО', 70, 295);

      // Блок преимуществ
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('🚀 3 ключевых преимущества GiftX:', 70, 380);

      const benefits = [
        { title: '📈 Рост среднего чека до +40%', desc: 'Официанты выдают сюрприз-боксы за чек от целевой суммы' },
        { title: '👥 0$ Затрат на маркетинг (CAC = 0)', desc: 'Обмен клиентами с лучшими ресторанами, СПА и отелями' },
        { title: '🏆 Геймификация персонала', desc: 'Авто-турниры официантов и отчёты управляющему в Telegram' },
      ];

      benefits.forEach((b, i) => {
        const y = 440 + i * 110;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(70, y, width - 140, 90, 16);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(b.title, 95, y + 40);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px sans-serif';
        ctx.fillText(b.desc, 95, y + 72);
      });

      // Пример расчета прибыльности
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(70, 800, width - 140, 420, 24);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('📊 Пример расчёта прибыльности заведения:', 100, 860);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '24px sans-serif';
      ctx.fillText('• Средний чек до GiftX: 300,000 VND  ➔  Целевой чек: 600,000 VND', 100, 920);
      ctx.fillText('• Обслуживаемых чеков в день: 30 чеков', 100, 970);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('Прирост выручки за месяц: +36,000,000 VND', 100, 1060);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('👥 +120 новых клиентов / месяц  (CAC = 0$)', 100, 1140);

      // Призыв к действию и QR Код
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(70, 1260, width - 140, 360, 24);
      ctx.fill();

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('ПОДКЛЮЧИТЕ ЗАВЕДЕНИЕ ЗА 2 МИНУТЫ', 100, 1340);
      
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('Отсканируйте QR-код для регистрации B2B партнера:', 100, 1400);

      // Создание скачиваемой ссылки
      const imageURI = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = 'GiftX_B2B_Promo_Flyer.jpg';
      link.href = imageURI;
      link.click();

      triggerNotificationHaptic('success');
    } catch (e: any) {
      alert('Ошибка скачивания листовки: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Кнопки управления модалкой */}
      <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Печать A4 / PDF</span>
        </button>

        <button
          onClick={handleDownloadJPEG}
          disabled={isDownloading}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Сохранение...' : 'Скачать JPEG'}</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Обертка A4 Листовки для просмотра и печати */}
      <div className="w-full max-w-3xl my-auto py-8">
        <div 
          ref={flyerRef}
          className="bg-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* Декоративные свечения */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* 1. ШАПКА ЛИСТОВКИ */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 relative z-10">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>B2B Платформа Кросс-Маркетинга</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                GiftX <span className="text-gradient-gold">B2B Pass</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Для ресторанов, баров, СПА-центров и отелей
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 block">
                0$ Затрат (CAC = 0)
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">gift-x.vercel.app</span>
            </div>
          </div>

          {/* 2. ГЛАВНЫЙ БАННЕР С КАРТИНКОЙ */}
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-xl group">
            <img
              src="/b2b_flyer.png"
              alt="GiftX B2B Promo"
              className="w-full h-48 sm:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 space-y-1">
              <h2 className="text-lg sm:text-2xl font-black text-slate-100">
                Увеличивайте средний чек и получайте новых клиентов БЕСПЛАТНО
              </h2>
              <p className="text-xs text-slate-300">
                Выдавайте боксы с подарками партнеров за чек от целевой суммы
              </p>
            </div>
          </div>

          {/* 3. ТРИ КЛЮЧЕВЫХ ПРЕИМУЩЕСТВА */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm">
                📈
              </div>
              <h4 className="font-extrabold text-slate-100 text-xs">Рост чека до +40%</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Гости охотно дозаказывают блюда и напитки, чтобы получить сюрприз-бокс.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-sm">
                👥
              </div>
              <h4 className="font-extrabold text-slate-100 text-xs">0$ На рекламу (CAC = 0)</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Бесплатный обмен постоянными клиентами с премиальными заведениями города.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-400 text-sm">
                🏆
              </div>
              <h4 className="font-extrabold text-slate-100 text-xs">Геймификация персонала</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Авто-турниры официантов и ежедневные отчеты выручки владельцу в Telegram.
              </p>
            </div>
          </div>

          {/* 4. ПРИМЕР РАСЧЁТА ПРИБЫЛЬНОСТИ (ПРИМЕР БЕЗ СЛАЙДЕРОВ) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3 relative z-10 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-amber-400 font-black text-sm">📊</span>
                <h3 className="font-black text-slate-100 text-sm">Пример расчёта прибыльности заведения:</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Модель роста выручки
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">Параметры заведения:</span>
                <p className="text-slate-200">• Средний чек до GiftX: <span className="font-bold text-amber-400">300,000 VND</span></p>
                <p className="text-slate-200">• Порог чека для бокса: <span className="font-bold text-emerald-400">600,000 VND</span></p>
                <p className="text-slate-200">• Чеков в день: <span className="font-bold">30 столов</span></p>
              </div>

              <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 block font-bold">Итоговый результат за 30 дней:</span>
                <div>
                  <h4 className="text-lg font-black text-emerald-400">+36,000,000 VND / мес</h4>
                  <p className="text-[11px] text-amber-400 font-bold">👥 +120 новых клиентов из сети</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. ПРИЗЫВ К ДЕЙСТВИЮ И QR КОД ДЛЯ РЕГИСТРАЦИИ */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-black text-slate-100">
                Подключите ваше заведение за 2 минуты
              </h3>
              <p className="text-xs text-slate-300 max-w-md">
                Наведите камеру смартфона на QR-код для мгновенного доступа к B2B платформе GiftX.
              </p>
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onClose();
                  onRegisterClick();
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Зарегистрировать заведение сейчас
              </button>
            </div>

            {/* Живой QR Код */}
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0 text-center">
              <QRCodeSVG
                value="https://gift-x.vercel.app/?page=business"
                size={110}
                level="H"
                includeMargin={false}
              />
              <span className="text-[9px] font-black text-slate-900 block mt-1.5">
                Сканируйте QR
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
