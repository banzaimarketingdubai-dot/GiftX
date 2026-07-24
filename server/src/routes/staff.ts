import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { notifyTokenClaimed } from '../websocket.js';

export const staffRouter = Router();

// Получить список заведений и официантов (для выбора в демо-режиме B2B)
staffRouter.get('/partners', async (_req: Request, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        staffMembers: true,
        voucherOffers: true
      }
    });
    res.json({ success: true, partners });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
    });

    return res.json({
      success: true,
      token: issuanceToken.token,
      expiresAt: issuanceToken.expiresAt,
      boxLevel: issuanceToken.boxLevel
    });
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
      googleReviewsCount
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
      return res.json({ success: true, partner: created, message: 'Заведение успешно зарегистрировано!' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

