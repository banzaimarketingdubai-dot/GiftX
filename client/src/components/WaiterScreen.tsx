import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, QrCode, CheckCircle2, Clock, UserCheck, RefreshCw, ChevronRight, Search, PlusCircle, X, Send, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { triggerHaptic, triggerNotificationHaptic, getTelegramUserData } from '../telegram';

export const WaiterScreen: React.FC = () => {
  const { 
    partners, 
    selectedStaff, 
    setSelectedStaff, 
    activeQrToken, 
    tokenExpiresAt, 
    activeBoxLevel, 
    setActiveQrToken,
    claimedByGuestName,
    setClaimedByGuestName
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [checkAmountInput, setCheckAmountInput] = useState<string>('500000');

  // Авто-определение бокса по сумме чека
  const getAutoBoxLevel = (amount: number): 'SILVER' | 'GOLD' | 'PLATINUM' | null => {
    if (amount < 300000) return null;
    if (amount < 600000) return 'SILVER';
    if (amount < 1000000) return 'GOLD';
    return 'PLATINUM';
  };

  // Модалка подачи заявки персонала
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [selectedPartnerToApply, setSelectedPartnerToApply] = useState<any | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantRole, setApplicantRole] = useState<'WAITER' | 'MANAGER'>('WAITER');
  const [applicantComment, setApplicantComment] = useState('');
  const [myApplications, setMyApplications] = useState<any[]>([]);

  const tgUser = getTelegramUserData();

  const fetchMyApplications = async () => {
    if (!tgUser?.id) return;
    try {
      const res = await fetch(`/api/staff/my-applications/${tgUser.id}`);
      const data = await res.json();
      if (data.success) {
        setMyApplications(data.applications);
      }
    } catch (e) {
      console.error('Fetch my applications error', e);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerToApply || !applicantName.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/staff/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: selectedPartnerToApply.id,
          partnerName: selectedPartnerToApply.name,
          partnerLogo: selectedPartnerToApply.logoUrl,
          applicantName: applicantName.trim(),
          applicantRole,
          telegramId: tgUser?.id,
          comment: applicantComment.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        triggerNotificationHaptic('success');
        alert('Заявка успешно отправлена управляющему заведения!');
        setShowApplyModal(false);
        setApplicantComment('');
        setSelectedPartnerToApply(null);
        fetchMyApplications();
      } else {
        alert('Ошибка: ' + data.error);
      }
    } catch (err: any) {
      alert('Ошибка отправки заявки: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Обработка обратного отсчета
  useEffect(() => {
    if (!tokenExpiresAt || !activeQrToken) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(tokenExpiresAt).getTime() - new Date().getTime()) / 1000);
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenExpiresAt, activeQrToken]);

  // Polling статуса токена (каждые 2 секунды)
  useEffect(() => {
    if (!activeQrToken || claimedByGuestName || timeLeft <= 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/staff/token-status/${activeQrToken}`);
        const data = await res.json();
        if (data.success && data.isUsed) {
          triggerHaptic('heavy');
          setClaimedByGuestName('Гость');
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [activeQrToken, claimedByGuestName, timeLeft]);

  // Вызов API генерации токена
  const handleIssueBox = async (boxLevel: 'SILVER' | 'GOLD' | 'PLATINUM') => {
    if (!selectedStaff) return;
    triggerHaptic('medium');
    setLoading(true);

    try {
      const res = await fetch('/api/staff/issue-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          partnerId: selectedStaff.partnerId,
          boxLevel
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveQrToken(data.token, data.expiresAt, boxLevel);
      } else {
        alert('Ошибка генерации: ' + data.error);
      }
    } catch (e: any) {
      alert('Ошибка соединения с сервером: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const botUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'giftx2025_bot';
  const telegramAppUrl = `https://t.me/${botUsername}?start=claim_${activeQrToken}`;
  const appUrl = `${window.location.origin}/?claim=${activeQrToken}`;
  const qrCodeValue = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? appUrl : telegramAppUrl;

  const displayPartners = partners.length > 0 ? partners : [
    {
      id: 'demo-partner-1',
      name: 'Sunset Beach Club',
      category: 'HORECA',
      logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
      address: 'Phu Quoc, Long Beach, St 4',
      lat: 10.1982,
      lng: 103.9634,
      staffMembers: [
        {
          id: 'demo-staff-1',
          partnerId: 'demo-partner-1',
          name: 'Алекс (Sunset Bar)',
          role: 'WAITER',
          boxesIssuedCount: 14
        },
        {
          id: 'demo-staff-2',
          partnerId: 'demo-partner-1',
          name: 'Анна (Менеджер)',
          role: 'MANAGER',
          boxesIssuedCount: 42
        }
      ]
    },
    {
      id: 'demo-partner-2',
      name: 'Lotus Wellness & Spa',
      category: 'BEAUTY_SPA',
      logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
      address: 'Phu Quoc, Duong Dong, Main Rd 12',
      lat: 10.2175,
      lng: 103.9592,
      staffMembers: [
        {
          id: 'demo-staff-3',
          partnerId: 'demo-partner-2',
          name: 'Мария (Spa)',
          role: 'WAITER',
          boxesIssuedCount: 20
        }
      ]
    }
  ];

  const filteredSearchPartners = displayPartners.filter((p) =>
    p.name.toLowerCase().includes(venueSearchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(venueSearchQuery.toLowerCase())
  );

  if (!selectedStaff) {
    return (
      <div className="p-4 max-w-md mx-auto min-h-screen flex flex-col justify-center space-y-5 pb-20">
        <div className="text-center">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-3">
            <UserCheck className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">B2B Режим Официанта</h1>
          <p className="text-slate-400 text-xs mt-1">Выберите заведение или подайте заявку на вступление</p>
        </div>

        {/* Кнопка подачи заявки на вступление */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            setApplicantName(tgUser?.first_name ? `${tgUser.first_name} ${tgUser.last_name || ''}` : '');
            setShowApplyModal(true);
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/40 text-amber-300 font-extrabold text-xs flex items-center justify-between shadow-lg transition-all hover:bg-slate-800"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg shrink-0">
              📝
            </div>
            <div className="text-left">
              <span className="font-extrabold text-slate-100 text-xs block">Подать заявку на вступление в заведение</span>
              <span className="text-[10px] text-slate-400">Поиск ресторана/СПА по названию</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        {/* Мои отправленные заявки */}
        {myApplications.length > 0 && (
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">
              Ваши заявки на рассмотрении ({myApplications.length}):
            </div>
            <div className="space-y-1.5">
              {myApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 text-xs border border-slate-800">
                  <div>
                    <span className="font-bold text-slate-100 block">{app.partnerName}</span>
                    <span className="text-[10px] text-slate-400">Роль: {app.applicantRole}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    app.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    app.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {app.status === 'APPROVED' ? 'Одобрено' : app.status === 'REJECTED' ? 'Отклонено' : 'Ожидает'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Список действующих заведений */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Быстрый вход для сотрудников:
          </h3>
          {displayPartners.map((partner) => (
            <div key={partner.id} className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-3 mb-2">
                <img src={partner.logoUrl} alt={partner.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h3 className="font-bold text-slate-100 text-xs">{partner.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {partner.category}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                {/* @ts-ignore */}
                {partner.staffMembers?.map((staff: any) => (
                  <button
                    key={staff.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedStaff({ ...staff, partner });
                    }}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-800 transition-all text-xs font-medium"
                  >
                    <span>👤 {staff.name} ({staff.role})</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно подачи заявки соискателем */}
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-extrabold text-slate-100 text-sm flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Заявка на вступление</span>
                </h3>
                <button onClick={() => setShowApplyModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-3 text-xs">
                {/* Шаг 1: Поиск и выбор заведения */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    1. Найдите заведение по названию
                  </label>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={venueSearchQuery}
                      onChange={(e) => setVenueSearchQuery(e.target.value)}
                      placeholder="Название или адрес заведения..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl bg-slate-950 p-2 border border-slate-800/80">
                    {filteredSearchPartners.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPartnerToApply(p)}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                          selectedPartnerToApply?.id === p.id
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img src={p.logoUrl} alt={p.name} className="w-7 h-7 rounded-lg object-cover" />
                          <div>
                            <span className="font-bold block text-xs">{p.name}</span>
                            <span className="text-[9px] text-slate-500">{p.address}</span>
                          </div>
                        </div>
                        {selectedPartnerToApply?.id === p.id && <span className="text-xs font-bold text-amber-400">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Шаг 2: Ввод данных соискателя */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    2. Ваше имя и фамилия
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Дмитрий Петров"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    3. Должность / Роль
                  </label>
                  <select
                    value={applicantRole}
                    onChange={(e) => setApplicantRole(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                  >
                    <option value="WAITER">WAITER (Официант / Бармен)</option>
                    <option value="MANAGER">MANAGER (Управляющий / Администратор)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    4. Сообщение управляющему (необязательно)
                  </label>
                  <textarea
                    rows={2}
                    value={applicantComment}
                    onChange={(e) => setApplicantComment(e.target.value)}
                    placeholder="Опыт работы, смена..."
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedPartnerToApply || !applicantName.trim() || loading}
                  className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-extrabold text-slate-950 text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Отправить заявку Владельцу</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen flex flex-col justify-between pb-8">
      {/* Шапка персонала */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={selectedStaff.partner?.logoUrl} alt="Logo" className="w-11 h-11 rounded-xl object-cover border border-slate-700" />
          <div>
            <h2 className="font-bold text-slate-100 text-sm">{selectedStaff.partner?.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{selectedStaff.name}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setSelectedStaff(null)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold hover:text-white"
        >
          Сменить
        </button>
      </div>

      {/* Мотивационная карточка смены и место в турнирной таблице */}
      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
            🏆
          </div>
          <div>
            <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider block">
              Рейтинг смены заведения
            </span>
            <span className="text-xs font-black text-slate-100">
              Ваше место сегодня: <span className="text-emerald-400 font-extrabold">🥇 #1</span> ({selectedStaff.boxesIssuedToday || selectedStaff.boxesIssuedCount || 14} боксов)
            </span>
          </div>
        </div>

        <span className="px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
          🔥 Лидер
        </span>
      </div>

      {/* Экран показа QR-кода при нажатии */}
      {activeQrToken && (
        <div className="my-6">
          {claimedByGuestName ? (
            <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 text-center animate-bounce-short">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-emerald-300">🎉 Бокс успешно вручен!</h3>
              <p className="text-slate-300 text-sm mt-1">Гость отсканировал QR и получил подарки.</p>
              
              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-6 w-full py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Готово (Выдать еще)
              </button>
            </div>
          ) : timeLeft <= 0 ? (
            <div className="glass-card p-6 rounded-3xl border border-red-500/30 bg-red-950/20 text-center">
              <Clock className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-400">QR-код Истёк</h3>
              <p className="text-xs text-slate-400 mt-1">Время жизни токена (3 мин) прошло.</p>
              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-4 w-full py-3 bg-slate-800 text-white font-bold rounded-2xl"
              >
                Сгенерировать новый
              </button>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 bg-slate-900/90 text-center shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                  Уровень: {activeBoxLevel}
                </span>
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-mono font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mb-4">
                <QRCodeSVG value={qrCodeValue} size={210} level="H" includeMargin={false} />
              </div>

              <p className="text-slate-300 text-xs font-medium">
                Попросите гостя навести камеру смартфона или отсканировать в Telegram
              </p>

              {/* Быстрая кнопка симуляции сканирования для тестирования */}
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center space-x-1.5 py-2 px-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Открыть как гость (Симуляция сканирования QR)</span>
              </a>

              <button
                onClick={() => setActiveQrToken(null, null, null)}
                className="mt-5 text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ввод суммы счёта для официанта (Авто-определение бокса) */}
      {!activeQrToken && (
        <div className="space-y-4 my-auto py-4 animate-fadeIn">
          <div className="glass-card p-5 rounded-3xl border border-amber-500/30 bg-slate-900/90 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
                Авто-выдача подарка
              </span>
              <h3 className="text-lg font-black text-slate-100">Введите сумму счёта гостя</h3>
              <p className="text-xs text-slate-400">Система сама определит уровень бокса на основании суммы</p>
            </div>

            {/* Поле ввода суммы */}
            <div className="relative">
              <input
                type="number"
                value={checkAmountInput}
                onChange={(e) => setCheckAmountInput(e.target.value)}
                placeholder="450000"
                className="w-full p-4 pl-4 pr-16 rounded-2xl bg-slate-950 border-2 border-amber-500/40 text-amber-300 font-mono font-black text-xl text-center focus:border-amber-400 outline-none shadow-inner"
              />
              <span className="absolute right-4 top-4 font-black text-xs text-amber-400/80">VND</span>
            </div>

            {/* Быстрые кнопки пресетов сумм */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCheckAmountInput('350000');
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-500/20 transition-all text-center"
              >
                🥈 350k VND
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCheckAmountInput('650000');
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/20 transition-all text-center"
              >
                🥇 650k VND
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCheckAmountInput('1200000');
                }}
                className="py-2 px-1 rounded-xl bg-slate-950 border border-purple-500/40 text-purple-300 font-bold hover:bg-purple-500/20 transition-all text-center"
              >
                💎 1.2M VND
              </button>
            </div>

            {/* Динамическая карточка определенного бокса */}
            {(() => {
              const numVal = parseFloat(checkAmountInput) || 0;
              const level = getAutoBoxLevel(numVal);

              if (!level) {
                return (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-amber-300 font-bold">
                    ⚠️ Порог выдачи подарка — от 300,000 VND
                  </div>
                );
              }

              const isSilver = level === 'SILVER';
              const isGold = level === 'GOLD';

              return (
                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isSilver ? 'glass-silver border-cyan-500/50' :
                  isGold ? 'glass-gold border-amber-500/50' : 'bg-purple-950/40 border-purple-400/50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{isSilver ? '🥈' : isGold ? '🥇' : '💎'}</span>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block text-slate-100">
                        {isSilver ? 'СЕРЕБРЯНЫЙ БОКС' : isGold ? 'ЗОЛОТОЙ БОКС' : 'ПЛАТИНОВЫЙ VIP БОКС'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium">
                        Рассчитано по чеку {numVal.toLocaleString()} VND
                      </span>
                    </div>
                  </div>
                  <Sparkles className={`w-5 h-5 ${isSilver ? 'text-cyan-400' : isGold ? 'text-amber-400' : 'text-purple-400'} animate-pulse`} />
                </div>
              );
            })()}

            {/* Главная кнопка генерации QR */}
            <button
              disabled={loading || !getAutoBoxLevel(parseFloat(checkAmountInput) || 0)}
              onClick={() => {
                const level = getAutoBoxLevel(parseFloat(checkAmountInput) || 0);
                if (level) {
                  handleIssueBox(level);
                }
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 font-black text-slate-950 text-sm flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/25 disabled:opacity-40 transition-all active:scale-95"
            >
              <QrCode className="w-5 h-5 text-slate-950" />
              <span>Показать QR-код гостю</span>
            </button>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-900">
        Выдано за смену: <span className="text-slate-300 font-bold">{selectedStaff.boxesIssuedCount} боксов</span>
      </div>
    </div>
  );
};
