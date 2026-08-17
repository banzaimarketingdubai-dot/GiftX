import React from 'react';
import { Star, X, ExternalLink, MapPin, MessageSquare, ThumbsUp, ShieldCheck } from 'lucide-react';
import { Partner } from '../types';
import { triggerHaptic } from '../telegram';

interface GoogleReviewsModalProps {
  partner: Partner;
  onClose: () => void;
}

export const GoogleReviewsModal: React.FC<GoogleReviewsModalProps> = ({ partner, onClose }) => {
  const rating = partner.googleRating || 4.8;
  const count = partner.googleReviewsCount || 120;
  const mapsUrl = partner.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(partner.name + ' ' + partner.address)}`;

  // Моковые реалистичные отзывы Google для наглядности
  const mockReviews = [
    {
      id: '1',
      author: 'Алексей С.',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
      rating: 5,
      date: '3 дня назад',
      text: 'Великолепное место! Обслуживание на высшем уровне, очень приятная атмосфера. Также приятно удивили подарки по ваучеру HappyBox!',
    },
    {
      id: '2',
      author: 'Мария К.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      rating: 5,
      date: 'Неделю назад',
      text: 'Замечательный персонал и потрясающее качество. Обязательно вернемся снова.',
    },
    {
      id: '3',
      author: 'Дмитрий В.',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80',
      rating: 5,
      date: '2 недели назад',
      text: 'Очень классная локация, стильный интерьер и вежливые менеджеры. 10/10!',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0e1621]/85 backdrop-blur-md animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-[#17212b] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Шапка модального окна */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#17212b]">
          <div className="flex items-center space-x-3">
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#2aabee] font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps Отзывы</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-100 line-clamp-1">{partner.name}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-full bg-[#242f3d] text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Контент с отзывами */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Блок рейтинга Google */}
          <div className="bg-[#242f3d] p-4 rounded-xl border border-white/5 flex items-center justify-between shadow-sm">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-amber-400">{rating.toFixed(1)}</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Основано на {count} отзывах в Google Maps</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Проверено</span>
              </span>
            </div>
          </div>

          {/* Список отзывов */}
          <div>
            <h3 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
              <ThumbsUp className="w-3.5 h-3.5 text-[#2aabee]" />
              <span>Последние отзывы пользователей</span>
            </h3>

            <div className="space-y-2.5">
              {mockReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[#242f3d] p-3 rounded-xl border border-white/5 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-200">{review.author}</div>
                        <div className="text-[10px] text-slate-400">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Футер с кнопкой перехода на Google Maps */}
        <div className="p-4 border-t border-white/10 bg-[#17212b] flex flex-col space-y-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('medium')}
            className="w-full py-3 px-4 rounded-xl bg-[#2aabee] hover:bg-[#229ed9] text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md shadow-[#2aabee]/30 transition-all active:scale-[0.99] cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-white" />
            <span>Открыть карточку заведения на Google Картах</span>
          </a>
        </div>
      </div>
    </div>
  );
};
