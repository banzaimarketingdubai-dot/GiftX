import { prisma } from '../db.js';

export interface AuditNotificationPayload {
  title: string;
  details: string;
  author?: string;
  source?: 'Revoo UI' | 'GiftX UI' | 'Telegram Bot' | 'System API';
  venueName?: string;
}

/**
 * Send real-time audit notifications to all System Admins & SuperAdmins in Telegram
 */
export async function notifyAdmins(payload: AuditNotificationPayload): Promise<void> {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.VITE_TELEGRAM_BOT_TOKEN ||
    '8958055788:AAF3QTtP5l2_CUfbjRFkz0N5brYkWoeE3Xs';

  const defaultAdminIds = ['260669598', '999888777'];
  const envAdminIdsStr = process.env.ADMIN_TELEGRAM_IDS || '';
  const envAdminIds = envAdminIdsStr.split(',').map((s) => s.trim()).filter(Boolean);

  const adminChatIdsSet = new Set<string>([...defaultAdminIds, ...envAdminIds]);

  // Query SuperAdmins from StaffMember table in DB
  try {
    const superAdmins = await prisma.staffMember.findMany({
      where: { role: 'SUPER_ADMIN' as any, telegramId: { not: null } },
      select: { telegramId: true }
    });
    superAdmins.forEach((sa) => {
      if (sa.telegramId) adminChatIdsSet.add(sa.telegramId.toString());
    });
  } catch (e) {
    // DB query fallback
  }

  const { title, details, author = 'Система / Администратор', source = 'System API', venueName } = payload;
  const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Ho_Chi_Minh' });

  const venueHeader = venueName ? `🏬 **Заведение:** ${venueName}\n` : '';

  const messageText =
    `🔔 **[АУДИТ ИЗМЕНЕНИЙ — ${source.toUpperCase()}]**\n\n` +
    `📌 **Событие:** ${title}\n` +
    venueHeader +
    `💬 **Детали:**\n${details}\n\n` +
    `👤 **Кто внес изменения:** ${author}\n` +
    `🕒 **Время:** \`${timestamp}\``;

  for (const chatId of adminChatIdsSet) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
    } catch (err: any) {
      console.warn(`[AdminNotifier] Failed to send notification to chat_id ${chatId}:`, err.message);
    }
  }
}
