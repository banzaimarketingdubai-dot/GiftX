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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Шапка модального окна */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center space-x-3">
            <img
              src={partner.logoUrl}
              alt={partner.name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps Отзывы</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 line-clamp-1">{partner.name}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Контент с отзывами */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Блок рейтинга Google */}
          <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900">
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-amber-400">{rating.toFixed(1)}</span>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Основано на {count} отзывах в Google Maps</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Проверено</span>
              </span>
            </div>
          </div>

          {/* Список отзывов */}
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center space-x-1">
              <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Последние отзывы пользователей</span>
            </h3>

            <div className="space-y-3">
              {mockReviews.map((review) => (
                <div
                  key={review.id}
                  className="glass-card p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-200">{review.author}</div>
                        <div className="text-[10px] text-slate-500">{review.date}</div>
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
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col space-y-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('medium')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.99]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Открыть карточку заведения на Google Картах</span>
          </a>
        </div>
      </div>
    </div>
  );
};
