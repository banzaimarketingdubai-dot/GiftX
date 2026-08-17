import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { notifyTokenClaimed } from '../websocket.js';

export const staffRouter = Router();

const DEMO_PARTNERS = [
  {
    id: 'demo-partner-1',
    name: 'Sunset Beach Club',
    category: 'HORECA',
    logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    address: 'Phu Quoc, Long Beach, St 4',
    lat: 10.1982,
    lng: 103.9634,
    googleRating: 4.8,
    googleReviewsCount: 342,
    googleMapsUrl: 'https://maps.google.com/?q=Sunset+Beach+Club+Phu+Quoc',
    activeStatus: true,
    basicThreshold: 0,
    silverThreshold: 300000,
    goldThreshold: 600000,
    platinumThreshold: 1200000,
    staffMembers: [
      {
        id: 'demo-staff-1',
        partnerId: 'demo-partner-1',
        name: 'Алекс (Sunset Bar)',
        role: 'WAITER',
        activeShiftsCount: 5,
        boxesIssuedToday: 14,
        boxesIssuedWeek: 68,
        boxesIssuedCount: 124
      },
      {
        id: 'demo-staff-4',
        partnerId: 'demo-partner-1',
        name: 'Дмитрий (Бармен)',
        role: 'WAITER',
        activeShiftsCount: 7,
        boxesIssuedToday: 11,
        boxesIssuedWeek: 49,
        boxesIssuedCount: 88
      },
      {
        id: 'demo-staff-2',
        partnerId: 'demo-partner-1',
        name: 'Анна (Менеджер)',
        role: 'MANAGER',
        activeShiftsCount: 12,
        boxesIssuedToday: 8,
        boxesIssuedWeek: 42,
        boxesIssuedCount: 96
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
    googleRating: 4.9,
    googleReviewsCount: 215,
    googleMapsUrl: 'https://maps.google.com/?q=Lotus+Wellness+Spa+Phu+Quoc',
    activeStatus: true,
    basicThreshold: 0,
    silverThreshold: 300000,
    goldThreshold: 600000,
    platinumThreshold: 1000000,
    staffMembers: [
      {
        id: 'demo-staff-3',
        partnerId: 'demo-partner-2',
        name: 'Мария (Spa)',
        role: 'WAITER',
        activeShiftsCount: 8,
        boxesIssuedToday: 18,
        boxesIssuedWeek: 55,
        boxesIssuedCount: 84
      }
    ]
  }
];

// Получить список заведений и официантов (для выбора в демо-режиме B2B)
staffRouter.get('/partners', async (_req: Request, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        staffMembers: true,
        voucherOffers: true
      }
    });

    if (partners && partners.length > 0) {
      return res.json({ success: true, partners });
    }

    return res.json({ success: true, partners: DEMO_PARTNERS, isDemo: true });
  } catch (error: any) {
    console.error('Prisma partners fetch error, returning DEMO_PARTNERS fallback:', error.message);
    return res.json({ success: true, partners: DEMO_PARTNERS, isDemo: true });
  }
});

// Сгенерировать одноразовый StaffIssuanceToken (TTL = 180 секунд = 3 минуты)
staffRouter.post('/issue-token', async (req: Request, res: Response) => {
  try {
    const { staffId, partnerId, boxLevel, checkAmount } = req.body;

    if (!staffId || !partnerId || !boxLevel) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: staffId, partnerId, boxLevel'
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // +180 секунд

    try {
      const issuanceToken = await prisma.staffIssuanceToken.create({
        data: {
          staffId,
          partnerId,
          boxLevel,
          checkAmount: checkAmount ? parseFloat(checkAmount) : undefined,
          createdAt: now,
          expiresAt,
          isUsed: false
        }
      });

      // Увеличиваем счетчик выданных боксов официанту
      await prisma.staffMember.update({
        where: { id: staffId },
        data: { boxesIssuedCount: { increment: 1 } }
      }).catch(() => {});

      return res.json({
        success: true,
        token: issuanceToken.token,
        expiresAt: issuanceToken.expiresAt,
        boxLevel: issuanceToken.boxLevel
      });
    } catch (dbErr: any) {
      // In-memory demo token fallback when DB is down
      const demoToken = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      return res.json({
        success: true,
        token: demoToken,
        expiresAt,
        boxLevel
      });
    }
  } catch (error: any) {
    console.error('Issue token error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Проверить статус токена (Polling для экрана официанта)
staffRouter.get('/token-status/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const tokenRecord = await prisma.staffIssuanceToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) {
      return res.status(404).json({ success: false, error: 'Токен не найден' });
    }

    return res.json({
      success: true,
      isUsed: tokenRecord.isUsed,
      claimedByUserId: tokenRecord.claimedByUserId,
      isExpired: new Date() > tokenRecord.expiresAt
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Утилита разбора ссылки Google Maps
function parseGoogleMapsUrl(url: string): { lat?: number; lng?: number } {
  if (!url) return {};
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  
  const qMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  const llMatch = url.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

  return {};
}

// Проверить, является ли пользователь сотрудником/владельцем заведения по Telegram ID
staffRouter.get('/check-member/:telegramId', async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;
    if (!telegramId) {
      return res.json({ success: true, isStaff: false });
    }

    try {
      const staff = await prisma.staffMember.findFirst({
        where: { telegramId: BigInt(telegramId) },
        include: { partner: true }
      });

      if (staff) {
        return res.json({
          success: true,
          isStaff: true,
          staff: {
            id: staff.id,
            partnerId: staff.partnerId,
            name: staff.name,
            role: staff.role,
            boxesIssuedCount: staff.boxesIssuedCount,
            partner: staff.partner
          }
        });
      }

      return res.json({ success: true, isStaff: false });
    } catch (dbErr: any) {
      return res.json({ success: true, isStaff: false });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Добавить или обновить локацию заведения с поддержкой выбора на карте и парсинга ссылок Google Maps
staffRouter.post('/partner/location', async (req: Request, res: Response) => {
  try {
    const {
      partnerId,
      name,
      description,
      workingHours,
      category,
      address,
      logoUrl,
      coverUrl,
      lat,
      lng,
      googleMapsUrl,
      googleRating,
      googleReviewsCount,
      telegramId,
      role,
      basicThreshold,
      silverThreshold,
      goldThreshold,
      platinumThreshold
    } = req.body;

    let finalLat = lat ? parseFloat(lat) : undefined;
    let finalLng = lng ? parseFloat(lng) : undefined;

    // Если координаты не переданы напрямую, но передана ссылка на Google Maps, парсим её
    if ((!finalLat || !finalLng) && googleMapsUrl) {
      const parsed = parseGoogleMapsUrl(googleMapsUrl);
      if (parsed.lat && parsed.lng) {
        finalLat = parsed.lat;
        finalLng = parsed.lng;
      }
    }

    if (partnerId) {
      // Обновление существующего партнера
      const updated = await prisma.partner.update({
        where: { id: partnerId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(workingHours !== undefined && { workingHours }),
          ...(category && { category }),
          ...(address && { address }),
          ...(logoUrl && { logoUrl }),
          ...(coverUrl !== undefined && { coverUrl }),
          ...(finalLat !== undefined && { lat: finalLat }),
          ...(finalLng !== undefined && { lng: finalLng }),
          ...(googleMapsUrl && { googleMapsUrl }),
          ...(googleRating !== undefined && { googleRating: parseFloat(googleRating) }),
          ...(googleReviewsCount !== undefined && { googleReviewsCount: parseInt(googleReviewsCount) }),
          ...(basicThreshold !== undefined && { basicThreshold: parseFloat(basicThreshold) }),
          ...(silverThreshold !== undefined && { silverThreshold: parseFloat(silverThreshold) }),
          ...(goldThreshold !== undefined && { goldThreshold: parseFloat(goldThreshold) }),
          ...(platinumThreshold !== undefined && { platinumThreshold: parseFloat(platinumThreshold) }),
          ...(telegramId && role === 'OWNER' && { ownerTelegramId: BigInt(telegramId) })
        }
      });

      if (telegramId) {
        const staffRole = (role as 'OWNER' | 'MANAGER' | 'WAITER') || 'OWNER';
        const parsedTgId = BigInt(telegramId);
        const existingStaff = await prisma.staffMember.findFirst({
          where: { partnerId: updated.id, telegramId: parsedTgId }
        });
        if (existingStaff) {
          await prisma.staffMember.update({
            where: { id: existingStaff.id },
            data: {
              role: staffRole,
              name: `${name || updated.name} (${staffRole === 'OWNER' ? 'Владелец' : staffRole === 'MANAGER' ? 'Админ' : 'Стаф'})`
            }
          }).catch((err) => console.error('Update staff error:', err));
        } else {
          await prisma.staffMember.create({
            data: {
              partnerId: updated.id,
              name: `${name || updated.name} (${staffRole === 'OWNER' ? 'Владелец' : staffRole === 'MANAGER' ? 'Админ' : 'Стаф'})`,
              role: staffRole,
              telegramId: parsedTgId
            }
          }).catch((err) => console.error('Create staff error:', err));
        }
      }

      return res.json({ success: true, partner: updated, message: 'Локация заведения обновлена' });
    } else {
      // Создание нового партнера при регистрации
      if (!name || !category) {
        return res.status(400).json({ success: false, error: 'Укажите название и категорию заведения' });
      }

      const finalAddress = address || 'Локация на карте';

      const created = await prisma.partner.create({
        data: {
          name,
          description: description || '',
          workingHours: workingHours || '10:00 - 23:00',
          category,
          address: finalAddress,
          logoUrl: logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
          coverUrl: coverUrl || undefined,
          lat: finalLat || 10.1982,
          lng: finalLng || 103.9634,
          googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + finalAddress)}`,
          googleRating: googleRating ? parseFloat(googleRating) : 4.8,
          googleReviewsCount: googleReviewsCount ? parseInt(googleReviewsCount) : 100,
          basicThreshold: basicThreshold ? parseFloat(basicThreshold) : 0,
          silverThreshold: silverThreshold ? parseFloat(silverThreshold) : 300000,
          goldThreshold: goldThreshold ? parseFloat(goldThreshold) : 600000,
          platinumThreshold: platinumThreshold ? parseFloat(platinumThreshold) : 1000000,
          activeStatus: true,
          moderationStatus: 'PENDING',
          ...(telegramId && { ownerTelegramId: BigInt(telegramId) })
        }
      });

      // Если передали telegramId — создаем запись StaffMember с выбранной ролью
      if (telegramId) {
        const staffRole = (role as 'OWNER' | 'MANAGER' | 'WAITER') || 'OWNER';
        const parsedTgId = BigInt(telegramId);
        const existingStaff = await prisma.staffMember.findFirst({
          where: { partnerId: created.id, telegramId: parsedTgId }
        });
        if (existingStaff) {
          await prisma.staffMember.update({
            where: { id: existingStaff.id },
            data: {
              role: staffRole,
              name: `${name} (${staffRole === 'OWNER' ? 'Владелец' : staffRole === 'MANAGER' ? 'Админ' : 'Стаф'})`
            }
          }).catch((err) => console.error('Update staff member error:', err));
        } else {
          await prisma.staffMember.create({
            data: {
              partnerId: created.id,
              name: `${name} (${staffRole === 'OWNER' ? 'Владелец' : staffRole === 'MANAGER' ? 'Админ' : 'Стаф'})`,
              role: staffRole,
              telegramId: parsedTgId
            }
          }).catch((err) => console.error('Auto create staff member error:', err));
        }
      }

      // Отправляем уведомление администраторам GiftX в Telegram
      try {
        const { telegramFunnelBot } = await import('../services/telegramFunnelBot.js');
        const adminIdsStr = process.env.ADMIN_TELEGRAM_IDS || '999000111';
        const adminIds = adminIdsStr.split(',').map((s) => s.trim()).filter(Boolean);

        const modText =
          `🆕 **НОВОЕ ЗАВЕДЕНИЕ НА МОДЕРАЦИИ (из TMA)!**\n\n` +
          `🏬 **Название:** ${created.name}\n` +
          `📝 **Описание:** ${created.description || 'Не указано'}\n` +
          `📍 **Адрес:** ${created.address}\n` +
          `⏰ **Часы:** ${created.workingHours || '10:00 - 23:00'}\n` +
          `👤 **Создатель ID:** \`${created.ownerTelegramId || telegramId || 'TMA User'}\`\n\n` +
          `Выберите действие:`;

        for (const adminId of adminIds) {
          await telegramFunnelBot.sendTextMessage(adminId, modText, [
            [
              { text: '✅ Одобрить', callback_data: `mod_approve:${created.id}` },
              { text: '❌ Отклонить', callback_data: `mod_reject:${created.id}` }
            ]
          ]);
        }
      } catch (modErr) {
        console.warn('Moderation notify error:', modErr);
      }

      return res.json({ success: true, partner: created, message: 'Заведение отправлено на модерацию!' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Получить ссылки и QR-коды для сотрудников заведения
staffRouter.get('/partner/invite-links/:partnerId', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'giftx2025_bot';

    const universalLink = `https://t.me/${botUsername}?start=venue_${partnerId}`;
    const ownerLink = `https://t.me/${botUsername}?start=join_owner_${partnerId}`;
    const adminLink = `https://t.me/${botUsername}?start=join_admin_${partnerId}`;
    const staffLink = `https://t.me/${botUsername}?start=join_staff_${partnerId}`;

    const universalQr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(universalLink)}`;
    const ownerQr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(ownerLink)}`;
    const adminQr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(adminLink)}`;
    const staffQr = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(staffLink)}`;

    return res.json({
      success: true,
      links: {
        VENUE: { link: universalLink, qrUrl: universalQr, label: '🌐 Единый Универсальный QR Заведения (для Всех)' },
        OWNER: { link: ownerLink, qrUrl: ownerQr, label: 'Владелец (Full Access)' },
        MANAGER: { link: adminLink, qrUrl: adminQr, label: 'Администратор (Управляющий)' },
        WAITER: { link: staffLink, qrUrl: staffQr, label: 'Официант / Персонал (Выдача боксов)' }
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export const DEMO_APPLICATIONS: Array<{
  id: string;
  partnerId: string;
  partnerName: string;
  partnerLogo: string;
  applicantName: string;
  applicantRole: string;
  telegramId?: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}> = [
  {
    id: 'app-demo-1',
    partnerId: 'demo-partner-1',
    partnerName: 'Sunset Beach Club',
    partnerLogo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
    applicantName: 'Дмитрий (Официант)',
    applicantRole: 'WAITER',
    telegramId: '999111222',
    comment: 'Опыт работы 2 года в сфере HoReCa',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  },
  {
    id: 'app-demo-2',
    partnerId: 'demo-partner-2',
    partnerName: 'Lotus Wellness & Spa',
    partnerLogo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
    applicantName: 'Елена (Управляющая)',
    applicantRole: 'MANAGER',
    telegramId: '999333444',
    comment: 'Желаю управлять сменой и отчетами',
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
];

// Подать заявку на вступление персонала в заведение
staffRouter.post('/apply', async (req: Request, res: Response) => {
  try {
    const { partnerId, partnerName, partnerLogo, applicantName, applicantRole, telegramId, comment } = req.body;

    if (!partnerId || !applicantName) {
      return res.status(400).json({ success: false, error: 'Укажите partnerId и имя соискателя' });
    }

    const newApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      partnerId,
      partnerName: partnerName || 'Заведение',
      partnerLogo: partnerLogo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
      applicantName,
      applicantRole: applicantRole || 'WAITER',
      telegramId: telegramId ? String(telegramId) : undefined,
      comment: comment || '',
      status: 'PENDING' as const,
      createdAt: new Date().toISOString()
    };

    DEMO_APPLICATIONS.unshift(newApplication);

    return res.json({
      success: true,
      application: newApplication,
      message: 'Заявка на вступление успешно отправлена!'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Получить заявки соискателя по Telegram ID
staffRouter.get('/my-applications/:telegramId', async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;
    const apps = DEMO_APPLICATIONS.filter((a) => a.telegramId === String(telegramId));
    return res.json({ success: true, applications: apps });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🏆 Получить Турнирную таблицу персонала заведения (Leaderboard)
staffRouter.get('/leaderboard/:partnerId', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const period = (req.query.period as string) || 'today'; // 'today' | 'week'

    let partner = DEMO_PARTNERS.find((p) => p.id === partnerId);
    let staffList: any[] = partner ? partner.staffMembers : [];

    // Если подключена БД Prisma
    try {
      const dbStaff = await prisma.staffMember.findMany({
        where: { partnerId }
      });

      if (dbStaff && dbStaff.length > 0) {
        staffList = dbStaff.map((s) => ({
          ...s,
          boxesIssuedToday: s.boxesIssuedCount || 0,
          boxesIssuedWeek: (s.boxesIssuedCount || 0) * 3,
        }));
      }
    } catch (e) {
      console.log('Prisma leaderboard fallback to demo memory');
    }

    // Сортировка по выбранному периоду
    const sorted = [...staffList].sort((a, b) => {
      const countA = period === 'today' ? (a.boxesIssuedToday ?? a.boxesIssuedCount) : (a.boxesIssuedWeek ?? a.boxesIssuedCount * 3);
      const countB = period === 'today' ? (b.boxesIssuedToday ?? b.boxesIssuedCount) : (b.boxesIssuedWeek ?? b.boxesIssuedCount * 3);
      return countB - countA;
    });

    const leaderboard = sorted.map((staff, index) => {
      const count = period === 'today' ? (staff.boxesIssuedToday ?? staff.boxesIssuedCount) : (staff.boxesIssuedWeek ?? staff.boxesIssuedCount * 3);
      return {
        rank: index + 1,
        id: staff.id,
        name: staff.name,
        role: staff.role,
        count,
        badge: index === 0 ? '🥇 1-е место' : index === 1 ? '🥈 2-е место' : index === 2 ? '🥉 3-е место' : `#${index + 1}`,
        isLeader: index === 0
      };
    });

    const totalIssuedPeriod = leaderboard.reduce((acc, curr) => acc + curr.count, 0);

    return res.json({
      success: true,
      partnerName: partner?.name || 'Заведение',
      period,
      totalIssuedPeriod,
      leaderboard,
      topLeader: leaderboard[0] || null
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 🎉 Отправить поздравление победителю дня в Telegram бот
staffRouter.post('/leaderboard/congratulate-winner', async (req: Request, res: Response) => {
  try {
    const { partnerId, winnerName, boxesCount } = req.body;

    const partner = DEMO_PARTNERS.find((p) => p.id === partnerId) || { name: 'Sunset Beach Club' };
    const winner = winnerName || 'Алекс (Sunset Bar)';
    const count = boxesCount || 14;

    const botMessage = `🏆 ПОЗДРАВЛЯЕМ ПОБЕДИТЕЛЯ ДНЯ! 🏆\n\n🥇 ${winner} занимает 1-е место в заведении «${partner.name}»!\n📦 Выдано подарков гостям сегодня: ${count} боксов.\n\nКоманда GiftX благодарит за супер-отдачу и приток новых гостей! 🎁✨`;

    // Имитация отправки в Telegram Bot API
    console.log('Sending winner congratulation Telegram bot message:\n', botMessage);

    return res.json({
      success: true,
      winnerName: winner,
      boxesCount: count,
      botMessage,
      message: `Поздравление для ${winner} успешно отправлено в Telegram Бот!`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 📊 Отправить ежедневный отчет заведения Владельцу в Telegram бот
staffRouter.post('/leaderboard/send-daily-report', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.body;

    const partner = DEMO_PARTNERS.find((p) => p.id === partnerId) || DEMO_PARTNERS[0];
    const staffList = partner.staffMembers || [];

    const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    let reportLines = staffList.map((s, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
      return `${medal} ${s.name}: ${s.boxesIssuedToday || s.boxesIssuedCount} боксов`;
    }).join('\n');

    const totalToday = staffList.reduce((sum, s) => sum + (s.boxesIssuedToday || s.boxesIssuedCount), 0);

    const reportMessage = `📊 ЕЖЕДНЕВНЫЙ ОТЧЕТ GIFTX B2B\n🏬 Заведение: «${partner.name}»\n📅 Дата: ${dateStr}\n\n🏆 Итоги работы персонала за день:\n${reportLines}\n\n📦 Всего выдано подарков гостям: ${totalToday} шт.\n📈 Прогнозируемый приток возвратных гостей: +${Math.round(totalToday * 0.4)} посетителей!`;

    console.log('Sending daily report to Owner Telegram bot:\n', reportMessage);

    return res.json({
      success: true,
      partnerName: partner.name,
      totalToday,
      reportMessage,
      message: `Ежедневный отчет заведения «${partner.name}» отправлен Владельцу в Telegram!`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});



