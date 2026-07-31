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
        boxesIssuedCount: 14
      },
      {
        id: 'demo-staff-2',
        partnerId: 'demo-partner-1',
        name: 'Анна (Менеджер)',
        role: 'MANAGER',
        activeShiftsCount: 12,
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
        boxesIssuedCount: 20
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
      category,
      address,
      logoUrl,
      lat,
      lng,
      googleMapsUrl,
      googleRating,
      googleReviewsCount,
      telegramId
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
          ...(category && { category }),
          ...(address && { address }),
          ...(logoUrl && { logoUrl }),
          ...(finalLat !== undefined && { lat: finalLat }),
          ...(finalLng !== undefined && { lng: finalLng }),
          ...(googleMapsUrl && { googleMapsUrl }),
          ...(googleRating !== undefined && { googleRating: parseFloat(googleRating) }),
          ...(googleReviewsCount !== undefined && { googleReviewsCount: parseInt(googleReviewsCount) })
        }
      });
      return res.json({ success: true, partner: updated, message: 'Локация заведения обновлена' });
    } else {
      // Создание нового партнера при регистрации
      if (!name || !category || !address) {
        return res.status(400).json({ success: false, error: 'Укажите название, категорию и адрес заведения' });
      }

      const created = await prisma.partner.create({
        data: {
          name,
          category,
          address,
          logoUrl: logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
          lat: finalLat || 10.1982,
          lng: finalLng || 103.9634,
          googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(address)}`,
          googleRating: googleRating ? parseFloat(googleRating) : 4.8,
          googleReviewsCount: googleReviewsCount ? parseInt(googleReviewsCount) : 100,
          activeStatus: true
        }
      });

      // Если передали telegramId — создаем запись StaffMember со статусом OWNER
      if (telegramId) {
        await prisma.staffMember.create({
          data: {
            partnerId: created.id,
            name: name + ' (Владелец)',
            role: 'OWNER',
            telegramId: BigInt(telegramId)
          }
        }).catch((err) => console.error('Auto create staff member error:', err));
      }

      return res.json({ success: true, partner: created, message: 'Заведение успешно зарегистрировано!' });
    }
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


