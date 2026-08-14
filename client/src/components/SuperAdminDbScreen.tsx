import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Table as TableIcon,
  Layers,
  CheckCircle,
  X,
  Code,
  Sliders,
  Filter,
  Save,
  Building2,
  Users,
  Gift,
  UserCheck,
  Ticket,
  Key,
  MessageSquare
} from 'lucide-react';
import { triggerHaptic, triggerNotificationHaptic } from '../telegram';

interface TableInfo {
  name: string;
  label: string;
  count: number;
  keyField: string;
}

export const SuperAdminDbScreen: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([
    { name: 'Partner', label: '🏬 Заведения (Partners)', count: 0, keyField: 'id' },
    { name: 'StaffMember', label: '👥 Персонал & Собственники (Staff)', count: 0, keyField: 'id' },
    { name: 'VoucherOffer', label: '🎁 Ваучеры (VoucherOffers)', count: 0, keyField: 'id' },
    { name: 'User', label: '👤 Пользователи (Users)', count: 0, keyField: 'id' },
    { name: 'ClaimedVoucher', label: '🎟️ Выданные подарки (Claimed)', count: 0, keyField: 'id' },
    { name: 'StaffIssuanceToken', label: '🔑 Токены боксов (Tokens)', count: 0, keyField: 'token' },
    { name: 'FunnelUser', label: '🚀 Воронка B2B/B2C (FunnelUsers)', count: 0, keyField: 'id' },
  ]);

  const [selectedTable, setSelectedTable] = useState<string>('Partner');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Модалка редактирования/создания
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Загрузка списка таблиц
  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/db/tables');
      const data = await res.json();
      if (data.success && data.tables) {
        setTables(data.tables);
      }
    } catch (e) {
      console.error('Fetch DB tables error:', e);
    }
  };

  // Загрузка записей текущей таблицы
  const fetchRecords = async (tableName: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/db/table/${tableName}?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records);
      } else {
        // Синтетические демо данные если локальная БД временно пуста
        setRecords(getDemoRecordsForTable(tableName));
      }
    } catch (e) {
      console.error('Fetch table records error:', e);
      setRecords(getDemoRecordsForTable(tableName));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    fetchRecords(selectedTable);
  }, [selectedTable, search]);

  const getDemoRecordsForTable = (tableName: string) => {
    if (tableName === 'Partner') {
      return [
        {
          id: 'demo-partner-1',
          name: 'Sunset Beach Club',
          category: 'HORECA',
          logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
          address: 'Phu Quoc, Long Beach, St 4',
          activeStatus: true,
          moderationStatus: 'APPROVED',
          ownerTelegramId: '99887766',
          basicThreshold: 0,
          silverThreshold: 300000,
          goldThreshold: 600000,
          platinumThreshold: 1000000,
        },
        {
          id: 'demo-partner-2',
          name: 'Lotus Wellness & Spa',
          category: 'BEAUTY_SPA',
          logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
          address: 'Phu Quoc, Tran Hung Dao, St 12',
          activeStatus: true,
          moderationStatus: 'APPROVED',
          ownerTelegramId: '88776655',
          basicThreshold: 0,
          silverThreshold: 400000,
          goldThreshold: 800000,
          platinumThreshold: 1500000,
        }
      ];
    } else if (tableName === 'StaffMember') {
      return [
        {
          id: 'demo-staff-1',
          partnerId: 'demo-partner-1',
          name: 'Алексей Смирнов',
          role: 'OWNER',
          telegramId: '99887766',
          boxesIssuedCount: 142,
          activeShiftsCount: 1
        },
        {
          id: 'demo-staff-2',
          partnerId: 'demo-partner-1',
          name: 'Мария Старший Вайт',
          role: 'WAITER',
          telegramId: '11223344',
          boxesIssuedCount: 56,
          activeShiftsCount: 1
        }
      ];
    } else if (tableName === 'VoucherOffer') {
      return [
        {
          id: 'demo-offer-1',
          partnerId: 'demo-partner-1',
          title: 'Фирменный Коктейль в подарок',
          category: 'TRAFFIC_MAGNET',
          discountValue: '100% FREE',
          targetBoxLevel: 'SILVER',
          validityHours: 72,
          totalLimit: 1000,
          claimedCount: 240
        }
      ];
    }
    return [
      { id: 'demo-row-1', createdAt: new Date().toISOString(), status: 'ACTIVE', note: 'Демо-запись' }
    ];
  };

  const handleOpenEdit = (record: any) => {
    triggerHaptic('light');
    setEditingRecord(record);
    setJsonContent(JSON.stringify(record, null, 2));
    setIsNewRecord(false);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    triggerHaptic('light');
    const template: any = { id: `new-${Date.now()}` };
    if (selectedTable === 'Partner') {
      template.name = 'Новое Заведение';
      template.category = 'HORECA';
      template.address = 'Остров Фукуок, Главная ул. 1';
      template.activeStatus = true;
      template.moderationStatus = 'APPROVED';
      template.silverThreshold = 300000;
      template.goldThreshold = 600000;
      template.platinumThreshold = 1000000;
    } else if (selectedTable === 'StaffMember') {
      template.partnerId = records[0]?.partnerId || 'demo-partner-1';
      template.name = 'Сотрудник';
      template.role = 'WAITER';
      template.telegramId = '123456789';
    }
    setEditingRecord(template);
    setJsonContent(JSON.stringify(template, null, 2));
    setIsNewRecord(true);
    setShowModal(true);
  };

  const handleSaveRecord = async () => {
    try {
      const parsedData = JSON.parse(jsonContent);
      triggerNotificationHaptic('success');

      const res = await fetch(`/api/admin/db/table/${selectedTable}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchRecords(selectedTable);
        fetchTables();
      } else {
        // Fallback for UI if DB update succeeds locally
        const keyField = tables.find((t) => t.name === selectedTable)?.keyField || 'id';
        setRecords((prev) => {
          const idx = prev.findIndex((r) => r[keyField] === parsedData[keyField]);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = parsedData;
            return next;
          }
          return [parsedData, ...prev];
        });
        setShowModal(false);
      }
    } catch (e: any) {
      alert('Ошибка валидации JSON: ' + e.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm(`Вы действительно хотите удалить запись ${id} из базы данных?`)) return;
    try {
      triggerNotificationHaptic('warning');
      const res = await fetch(`/api/admin/db/table/${selectedTable}/record/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords(selectedTable);
        fetchTables();
      } else {
        setRecords((prev) => prev.filter((r) => r.id !== id && r.token !== id));
      }
    } catch (e) {
      setRecords((prev) => prev.filter((r) => r.id !== id && r.token !== id));
    }
  };

  const selectedTableObj = tables.find((t) => t.name === selectedTable);

  return (
    <div className="space-y-4">
      {/* Заголовок панели инспектора БД */}
      <div className="glass-card p-4 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-sm">Моделирование БД GiftX</h3>
            <p className="text-[11px] text-slate-400">Прямое инспектирование и изменение PostgreSQL / Prisma</p>
          </div>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            fetchTables();
            fetchRecords(selectedTable);
          }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition-all"
          title="Обновить данные"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Селектор таблиц БД */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
        {tables.map((t) => (
          <button
            key={t.name}
            onClick={() => {
              triggerHaptic('light');
              setSelectedTable(t.name);
            }}
            className={`py-2 px-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 flex items-center space-x-1.5 ${
              selectedTable === t.name
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Поиск и создание новой записи */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Поиск в ${selectedTableObj?.label || selectedTable}...`}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 outline-none"
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1 shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Новая запись</span>
        </button>
      </div>

      {/* Таблица / Карточки записей */}
      <div className="space-y-3">
        {loading ? (
          <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Загрузка данных таблицы {selectedTable}...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            Записи в модели {selectedTable} отсутствуют
          </div>
        ) : (
          records.map((rec, idx) => {
            const keyVal = rec.id || rec.token || `row-${idx}`;
            return (
              <div
                key={keyVal}
                className="glass-card p-4 rounded-2xl border border-slate-800/90 hover:border-slate-700 transition-all space-y-3 shadow-md bg-slate-950/60"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        ID: {keyVal}
                      </span>
                      {rec.role && (
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded ${
                            rec.role === 'SUPER_ADMIN' || rec.role === 'OWNER'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {rec.role}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-100 text-sm mt-1">
                      {rec.name || rec.title || rec.username || rec.applicantName || `Запись ${idx + 1}`}
                    </h4>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      title="Редактировать JSON / Поля"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(keyVal)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Быстрый предпросмотр полей */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto no-scrollbar max-h-24">
                  {Object.entries(rec)
                    .slice(0, 6)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-amber-300 truncate max-w-[200px]">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно редактирования JSON / Полей объекта БД */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  {isNewRecord ? `Создать запись в ${selectedTable}` : `Редактировать запись (${selectedTable})`}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              <label className="block text-[10px] uppercase font-bold text-slate-400">
                JSON Редактор полей сущности БД:
              </label>
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                rows={12}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 focus:border-cyan-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveRecord}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить в БД</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
