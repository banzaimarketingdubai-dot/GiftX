import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Shield, Users, Crown, UserCheck, Share2, Sparkles } from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface StaffInviteModalProps {
  partnerId: string;
  partnerName: string;
  onClose: () => void;
}

export const StaffInviteModal: React.FC<StaffInviteModalProps> = ({
  partnerId,
  partnerName,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'VENUE' | 'WAITER' | 'MANAGER' | 'OWNER'>('VENUE');
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [linksData, setLinksData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/staff/partner/invite-links/${partnerId}`);
        const data = await res.json();
        if (data.success && data.links) {
          setLinksData(data.links);
        } else {
          // Fallback links generator
          const botUsername = 'giftx2025_bot';
          const venueLink = `https://t.me/${botUsername}?start=venue_${partnerId}`;
          const ownerLink = `https://t.me/${botUsername}?start=join_owner_${partnerId}`;
          const adminLink = `https://t.me/${botUsername}?start=join_admin_${partnerId}`;
          const staffLink = `https://t.me/${botUsername}?start=join_staff_${partnerId}`;

          setLinksData({
            VENUE: { link: venueLink, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(venueLink)}`, label: '🌐 Единый Универсальный QR Заведения (для Всех)' },
            OWNER: { link: ownerLink, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(ownerLink)}`, label: 'Владелец (Full Access)' },
            MANAGER: { link: adminLink, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(adminLink)}`, label: 'Администратор (Управляющий)' },
            WAITER: { link: staffLink, qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(staffLink)}`, label: 'Официант / Персонал (Выдача боксов)' }
          });
        }
      } catch (err) {
        console.error('Failed to fetch invite links', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [partnerId]);

  const currentRoleData = linksData ? linksData[activeTab] : null;

  const handleCopyLink = (link: string, role: string) => {
    triggerHaptic('light');
    navigator.clipboard.writeText(link);
    setCopiedRole(role);
    triggerNotificationHaptic('success');
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const handleShareTelegram = (link: string, label: string) => {
    triggerHaptic('light');
    const shareText = `Единый QR-код заведения «${partnerName}» в GiftX:`;
    const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgShareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between max-h-[90vh]">
        {/* Фоновый свет */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Кнопка закрытия */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Шапка */}
        <div className="space-y-3 z-10 pr-8">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black tracking-widest px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full uppercase flex items-center space-x-1">
              <Users className="w-3 h-3 text-amber-400" />
              <span>ЕДИНЫЙ QR & СТАФ</span>
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-100">{partnerName}</h2>
          <p className="text-xs text-slate-400">Единый QR для клиентов, персонала и админов</p>
        </div>

        {/* Табы ролей */}
        <div className="grid grid-cols-4 gap-1.5 my-4 z-10 text-[10px]">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('VENUE');
            }}
            className={`py-2 px-1.5 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all border ${
              activeTab === 'VENUE'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span>Единый QR</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('WAITER');
            }}
            className={`py-2 px-1.5 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all border ${
              activeTab === 'WAITER'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Стаф</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('MANAGER');
            }}
            className={`py-2 px-1.5 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all border ${
              activeTab === 'MANAGER'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Админ</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('OWNER');
            }}
            className={`py-2 px-1.5 rounded-xl font-extrabold flex items-center justify-center space-x-1 transition-all border ${
              activeTab === 'OWNER'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Оунер</span>
          </button>
        </div>

        {/* Содержимое вкладки */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse z-10">
            Генерация перманентных QR-кодов...
          </div>
        ) : currentRoleData ? (
          <div className="space-y-4 z-10 overflow-y-auto">
            {/* Карточка QR-кода */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col items-center space-y-3 shadow-inner">
              <div className="w-48 h-48 bg-white p-2.5 rounded-2xl shadow-xl border-4 border-amber-500/30 flex items-center justify-center">
                <img
                  src={currentRoleData.qrUrl}
                  alt={`QR ${currentRoleData.label}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <span className="text-[11px] font-bold text-amber-400 text-center">
                {currentRoleData.label}
              </span>
            </div>

            {/* Ссылка и кнопки */}
            <div className="space-y-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300 truncate mr-2 select-all">
                  {currentRoleData.link}
                </span>
                <button
                  onClick={() => handleCopyLink(currentRoleData.link, activeTab)}
                  className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-all shrink-0"
                >
                  {copiedRole === activeTab ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyLink(currentRoleData.link, activeTab)}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  {copiedRole === activeTab ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Скопировать</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleShareTelegram(currentRoleData.link, currentRoleData.label)}
                  className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Поделиться</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
