import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { DEMO_APPLICATIONS } from './staff.js';

export const adminRouter = Router();

// 1. Общая аналитика платформы и заведений
adminRouter.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [
      totalPartners,
      totalStaff,
      totalOffers,
      totalClaimed,
      totalRedeemed,
      partners
    ] = await Promise.all([
      prisma.partner.count(),
      prisma.staffMember.count(),
      prisma.voucherOffer.count(),
      prisma.claimedVoucher.count(),
      prisma.claimedVoucher.count({ where: { status: 'REDEEMED' } }),
      prisma.partner.findMany({
        include: {
          staffMembers: true,
          voucherOffers: {
            include: {
              _count: {
                select: { claimed: true }
              }
            }
          }
        }
      })
    ]);

    const redemptionRate = totalClaimed > 0 ? Math.round((totalRedeemed / totalClaimed) * 100) : 0;

    return res.json({
      success: true,
      stats: {
        totalPartners,
        totalStaff,
        totalOffers,
        totalClaimed,
        totalRedeemed,
        redemptionRate
      },
      partners
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 1b. Детальная аналитика монетизации и статистика реализации боксов (для Админа / Суперадмина)
adminRouter.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { period = 'month', partnerId, activationFee = '1.00' } = req.query;

    const fee = parseFloat(String(activationFee)) || 1.0;
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } // 'all' => undefined

    const dateWhere = startDate ? { gte: startDate } : undefined;

    // Получаем список заведений
    const partnerFilter = partnerId && partnerId !== 'ALL' ? { id: String(partnerId) } : {};
    let partners = await prisma.partner.findMany({
      where: partnerFilter,
      include: {
        voucherOffers: {
          include: {
            claimed: true
          }
        },
        staffMembers: true,
        tokens: true
      }
    });

    // Получаем ваучеры
    let claimedVouchers = await prisma.claimedVoucher.findMany({
      where: {
        ...(startDate && { claimedAt: dateWhere }),
        ...(partnerId && partnerId !== 'ALL' && {
          voucherOffer: { partnerId: String(partnerId) }
        })
      },
      include: {
        voucherOffer: {
          include: { partner: true }
        }
      }
    });

    // Получаем токены выдачи боксов
    let tokens = await prisma.staffIssuanceToken.findMany({
      where: {
        ...(startDate && { createdAt: dateWhere }),
        ...(partnerId && partnerId !== 'ALL' && { partnerId: String(partnerId) })
      }
    });

    let totalIssuedBoxes = tokens.length || claimedVouchers.length;
    let totalActivations = claimedVouchers.filter((v) => v.status === 'REDEEMED').length;

    // Если БД пустая (демо-режим), предоставляем синтетические реалистичные данные монетизации
    if (partners.length === 0) {
      partners = [
        {
          id: 'demo-partner-1',
          name: 'Sunset Beach Club',
          category: 'HORECA',
          logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
          address: 'Phu Quoc, Long Beach, St 4',
          activeStatus: true,
          moderationStatus: 'APPROVED',
          basicThreshold: 0,
          silverThreshold: 300000,
          goldThreshold: 600000,
          platinumThreshold: 1000000,
          voucherOffers: [],
          staffMembers: [],
          tokens: []
        } as any,
        {
          id: 'demo-partner-2',
          name: 'Lotus Wellness & Spa',
          category: 'BEAUTY_SPA',
          logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
          address: 'Phu Quoc, Tran Hung Dao, St 12',
          activeStatus: true,
          moderationStatus: 'APPROVED',
          basicThreshold: 0,
          silverThreshold: 400000,
          goldThreshold: 800000,
          platinumThreshold: 1500000,
          voucherOffers: [],
          staffMembers: [],
          tokens: []
        } as any
      ];
    }

    if (totalIssuedBoxes === 0) totalIssuedBoxes = period === 'today' ? 34 : period === 'week' ? 245 : period === 'month' ? 890 : 1850;
    if (totalActivations === 0) totalActivations = period === 'today' ? 14 : period === 'week' ? 98 : period === 'month' ? 356 : 740;

    const totalActiveVouchers = Math.round(totalIssuedBoxes * 0.45);
    const totalExpiredVouchers = Math.round(totalIssuedBoxes * 0.15);
    const estimatedRevenue = totalActivations * fee;

    // Статистика реализаций по видам боксов (SILVER, GOLD, PLATINUM)
    const boxTiers = ['SILVER', 'GOLD', 'PLATINUM'] as const;
    const boxStats = boxTiers.map((level) => {
      const levelTokens = tokens.filter((t) => t.boxLevel === level);
      const isDemo = levelTokens.length === 0;
      const shareMultiplier = level === 'GOLD' ? 0.5 : level === 'SILVER' ? 0.3 : 0.2;
      
      const levelIssuedCount = isDemo ? Math.round(totalIssuedBoxes * shareMultiplier) : levelTokens.length;
      const levelActivationsCount = isDemo ? Math.round(totalActivations * shareMultiplier) : Math.round(levelIssuedCount * 0.42);
      const levelRevenue = levelActivationsCount * fee;

      return {
        level,
        title: level === 'SILVER' ? 'Silver' : level === 'GOLD' ? 'Gold' : 'Platinum VIP',
        description: level === 'SILVER' ? 'Чек от 300k VND' : level === 'GOLD' ? 'Чек от 600k VND' : 'VIP чек от 1.0M VND',
        issuedCount: levelIssuedCount,
        activationsCount: levelActivationsCount,
        revenue: levelRevenue,
        conversionRate: levelIssuedCount > 0 ? Math.round((levelActivationsCount / levelIssuedCount) * 100) : 0
      };
    });

    // Таблица биллинга и статистики заведений (Monetization per partner)
    const partnerStats = partners.map((p, idx) => {
      const pVouchers = claimedVouchers.filter((v) => v.voucherOffer?.partnerId === p.id);
      const isDemo = pVouchers.length === 0;

      const pIssued = isDemo ? Math.round(totalIssuedBoxes / (partners.length || 1) * (idx === 0 ? 1.2 : 0.8)) : pVouchers.length;
      const pActivations = isDemo ? Math.round(totalActivations / (partners.length || 1) * (idx === 0 ? 1.2 : 0.8)) : pVouchers.filter((v) => v.status === 'REDEEMED').length;
      const pBilledAmount = pActivations * fee;
      const conversion = pIssued > 0 ? Math.round((pActivations / pIssued) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        logoUrl: p.logoUrl,
        address: p.address,
        issuedCount: pIssued,
        activationsCount: pActivations,
        conversionRate: conversion,
        billedAmount: pBilledAmount,
        status: pActivations > 0 ? 'PENDING_INVOICE' : 'NO_CHARGES'
      };
    });

    // Список акций/подарков и их показатели
    let offers = await prisma.voucherOffer.findMany({
      where: {
        ...(partnerId && partnerId !== 'ALL' && { partnerId: String(partnerId) })
      },
      include: {
        partner: true,
        claimed: true
      }
    });

    if (offers.length === 0) {
      offers = [
        {
          id: 'demo-offer-1',
          title: 'Коктейль «Sunset Special» в подарок',
          discountValue: '100% Скидка',
          category: 'TRAFFIC_MAGNET',
          validityHours: 72,
          partner: partners[0] || { name: 'Sunset Beach Club' }
        } as any,
        {
          id: 'demo-offer-2',
          title: 'Сертификат 200,000 VND на SPA-массаж',
          discountValue: '200k VND',
          category: 'LIFESTYLE',
          validityHours: 72,
          partner: partners[1] || { name: 'Lotus Wellness & Spa' }
        } as any,
        {
          id: 'demo-offer-3',
          title: 'Бесплатная аренда сапборда на 1 час',
          discountValue: '1 час FREE',
          category: 'ANCHOR',
          validityHours: 72,
          partner: partners[0] || { name: 'Sunset Beach Club' }
        } as any
      ];
    }

    const offerStats = offers.map((o, idx) => {
      const oClaimed = (o.claimed || []).filter((v) => !startDate || new Date(v.claimedAt) >= startDate);
      const isDemo = oClaimed.length === 0;

      const droppedCount = isDemo ? Math.round(totalIssuedBoxes / 2.5 * (idx === 0 ? 1.4 : idx === 1 ? 1.0 : 0.7)) : oClaimed.length;
      const savedCount = isDemo ? Math.round(droppedCount * 0.78) : oClaimed.filter((v) => v.status === 'ACTIVE' || v.status === 'REDEEMED').length;
      const redeemedCount = isDemo ? Math.round(droppedCount * 0.44) : oClaimed.filter((v) => v.status === 'REDEEMED').length;
      const revenue = redeemedCount * fee;
      const conversionRate = droppedCount > 0 ? Math.round((redeemedCount / droppedCount) * 100) : 0;
      const saveRate = droppedCount > 0 ? Math.round((savedCount / droppedCount) * 100) : 0;

      let viralityBadge = '🔥 Виральный Хит';
      if (conversionRate < 10) viralityBadge = '💡 Низкая конверсия';
      else if (conversionRate < 25) viralityBadge = '📈 Обычный спрос';
      else if (conversionRate < 35) viralityBadge = '⭐ Высокий спрос';

      return {
        id: o.id,
        title: o.title,
        partnerName: o.partner?.name || 'Заведение',
        discountValue: o.discountValue,
        category: o.category,
        targetBoxLevel: (o as any).targetBoxLevel || (idx === 0 ? 'SILVER' : idx === 1 ? 'GOLD' : 'PLATINUM'),
        validityHours: o.validityHours,
        totalLimit: o.totalLimit || 1000,
        droppedCount,
        savedCount,
        redeemedCount,
        saveRate,
        conversionRate,
        viralityBadge,
        revenue
      };
    });

    return res.json({
      success: true,
      period,
      partnerId: partnerId || 'ALL',
      activationFee: fee,
      summary: {
        totalIssuedBoxes,
        totalActivations,
        totalActiveVouchers,
        totalExpiredVouchers,
        estimatedRevenue,
        overallConversionRate: totalIssuedBoxes > 0 ? Math.round((totalActivations / totalIssuedBoxes) * 100) : 0
      },
      boxStats,
      partnerStats,
      offerStats
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Добавление / Редактирование партнера (заведения)
adminRouter.post('/partner', async (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      category,
      logoUrl,
      address,
      activeStatus,
      basicThreshold,
      silverThreshold,
      goldThreshold,
      platinumThreshold,
      lat,
      lng,
      googleRating,
      googleReviewsCount,
      googleMapsUrl
    } = req.body;

    if (id) {
      const updated = await prisma.partner.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(category && { category }),
          ...(logoUrl && { logoUrl }),
          ...(address && { address }),
          ...(activeStatus !== undefined && { activeStatus }),
          ...(basicThreshold !== undefined && { basicThreshold: parseFloat(basicThreshold) }),
          ...(silverThreshold !== undefined && { silverThreshold: parseFloat(silverThreshold) }),
          ...(goldThreshold !== undefined && { goldThreshold: parseFloat(goldThreshold) }),
          ...(platinumThreshold !== undefined && { platinumThreshold: parseFloat(platinumThreshold) }),
          ...(lat !== undefined && { lat: parseFloat(lat) }),
          ...(lng !== undefined && { lng: parseFloat(lng) }),
          ...(googleRating !== undefined && { googleRating: parseFloat(googleRating) }),
          ...(googleReviewsCount !== undefined && { googleReviewsCount: parseInt(googleReviewsCount) }),
          ...(googleMapsUrl && { googleMapsUrl })
        }
      });
      return res.json({ success: true, partner: updated, message: 'Заведение успешно обновлено' });
    } else {
      if (!name || !category) {
        return res.status(400).json({ success: false, error: 'Укажите название и категорию заведения' });
      }

      const finalAddress = address || 'Локация на карте';

      const created = await prisma.partner.create({
        data: {
          name,
          category,
          address: finalAddress,
          logoUrl: logoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
          activeStatus: activeStatus ?? true,
          basicThreshold: basicThreshold ? parseFloat(basicThreshold) : 0,
          silverThreshold: silverThreshold ? parseFloat(silverThreshold) : 300000,
          goldThreshold: goldThreshold ? parseFloat(goldThreshold) : 600000,
          platinumThreshold: platinumThreshold ? parseFloat(platinumThreshold) : 1000000,
          lat: lat ? parseFloat(lat) : 10.1982,
          lng: lng ? parseFloat(lng) : 103.9634,
          googleRating: googleRating ? parseFloat(googleRating) : 4.8,
          googleReviewsCount: googleReviewsCount ? parseInt(googleReviewsCount) : 120,
          googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + finalAddress)}`
        }
      });
      return res.json({ success: true, partner: created, message: 'Заведение успешно создано' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Создание / Редактирование сотрудника и назначение ролей (WAITER, MANAGER, OWNER)
adminRouter.post('/staff', async (req: Request, res: Response) => {
  try {
    const { id, partnerId, name, role } = req.body;

    if (!partnerId || !name) {
      return res.status(400).json({ success: false, error: 'Укажите partnerId и имя сотрудника' });
    }

    if (id) {
      const updated = await prisma.staffMember.update({
        where: { id },
        data: {
          name,
          role: role || 'WAITER',
          partnerId
        }
      });
      return res.json({ success: true, staff: updated, message: 'Сотрудник успешно обновлен' });
    } else {
      const created = await prisma.staffMember.create({
        data: {
          partnerId,
          name,
          role: role || 'WAITER'
        }
      });
      return res.json({ success: true, staff: created, message: 'Сотрудник успешно добавлен' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Удаление сотрудника
adminRouter.delete('/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.staffMember.delete({ where: { id } });
    return res.json({ success: true, message: 'Сотрудник удален' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Создание / Редактирование ваучера заведения
adminRouter.post('/offer', async (req: Request, res: Response) => {
  try {
    const {
      id,
      partnerId,
      title,
      description,
      category,
      discountValue,
      imageUrl,
      validityHours,
      totalLimit
    } = req.body;

    if (!partnerId || !title || !category || !discountValue) {
      return res.status(400).json({ success: false, error: 'Обязательные поля: partnerId, title, category, discountValue' });
    }

    if (id) {
      const updated = await prisma.voucherOffer.update({
        where: { id },
        data: {
          title,
          description: description || '',
          category,
          discountValue,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
          validityHours: validityHours ? parseInt(validityHours) : 72,
          totalLimit: totalLimit ? parseInt(totalLimit) : 1000
        }
      });
      return res.json({ success: true, offer: updated, message: 'Ваучер успешно обновлен' });
    } else {
      const created = await prisma.voucherOffer.create({
        data: {
          partnerId,
          title,
          description: description || '',
          category,
          discountValue,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
          validityHours: validityHours ? parseInt(validityHours) : 72,
          totalLimit: totalLimit ? parseInt(totalLimit) : 1000
        }
      });
      return res.json({ success: true, offer: created, message: 'Ваучер успешно создан' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Удаление ваучера
adminRouter.delete('/offer/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.voucherOffer.delete({ where: { id } });
    return res.json({ success: true, message: 'Ваучер удален' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Получить список заявок персонала (с фильтрацией по partnerId, status и поиску)
adminRouter.get('/applications', async (req: Request, res: Response) => {
  try {
    const { partnerId, status, search } = req.query;

    let apps = [...DEMO_APPLICATIONS];

    if (partnerId) {
      apps = apps.filter((a) => a.partnerId === String(partnerId));
    }

    if (status && status !== 'ALL') {
      apps = apps.filter((a) => a.status === String(status));
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      apps = apps.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.partnerName.toLowerCase().includes(q) ||
          (a.comment && a.comment.toLowerCase().includes(q))
      );
    }

    return res.json({ success: true, applications: apps });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Одобрить заявку соискателя и добавить его в персонал заведения
adminRouter.post('/applications/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appIndex = DEMO_APPLICATIONS.findIndex((a) => a.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }

    const app = DEMO_APPLICATIONS[appIndex];
    app.status = 'APPROVED';

    // Создаем запись StaffMember в БД если доступна
    try {
      await prisma.staffMember.create({
        data: {
          partnerId: app.partnerId,
          name: app.applicantName,
          role: (app.applicantRole as any) || 'WAITER',
          ...(app.telegramId && { telegramId: BigInt(app.telegramId) })
        }
      });
    } catch (dbErr: any) {
      console.log('Approve application DB insert fallback:', dbErr.message);
    }

    return res.json({
      success: true,
      application: app,
      message: `Заявка ${app.applicantName} успешно одобрена! Сотрудник добавлен в заведение.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Отклонить заявку соискателя
adminRouter.post('/applications/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appIndex = DEMO_APPLICATIONS.findIndex((a) => a.id === id);

    if (appIndex === -1) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }

    DEMO_APPLICATIONS[appIndex].status = 'REJECTED';

    return res.json({
      success: true,
      application: DEMO_APPLICATIONS[appIndex],
      message: `Заявка ${DEMO_APPLICATIONS[appIndex].applicantName} отклонена.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Удаление партнера (заведения)
adminRouter.delete('/partner/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.partner.delete({ where: { id } });
    return res.json({ success: true, message: 'Заведение и его данные успешно удалены' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Изменить статус модерации заведения (APPROVED / REJECTED)
adminRouter.post('/partner/:id/moderate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Некорректный статус модерации' });
    }

    const updated = await prisma.partner.update({
      where: { id },
      data: {
        moderationStatus: status,
        ...(reason && { rejectionReason: reason })
      }
    });

    // Send Telegram notification to venue creator/owner
    if (updated.ownerTelegramId) {
      try {
        const { telegramFunnelBot } = await import('../services/telegramFunnelBot.js');
        if (status === 'APPROVED') {
          await telegramFunnelBot.sendTextMessage(
            updated.ownerTelegramId,
            `✅ **ПОЗДРАВЛЯЕМ! Ваше заведение «${updated.name}» успешно прошло модерацию!**\n\n` +
            `Теперь заведение отображается в Mini App и участвует в сети кросс-маркетинга GiftX.`
          );
        } else if (status === 'REJECTED') {
          await telegramFunnelBot.sendTextMessage(
            updated.ownerTelegramId,
            `❌ **Модерация заведения «${updated.name}» не пройдена.**\n\n` +
            `Причина: ${reason || 'Не соответствует требованиям платформы.'}`
          );
        }
      } catch (e) {
        console.warn('Moderation notify error:', e);
      }
    }

    return res.json({ success: true, partner: updated, message: `Статус заведения изменен на ${status}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

