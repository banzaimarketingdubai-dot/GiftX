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
      if (!name || !category || !address) {
        return res.status(400).json({ success: false, error: 'Укажите название, категорию и адрес заведения' });
      }

      const created = await prisma.partner.create({
        data: {
          name,
          category,
          address,
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
          googleMapsUrl: googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(address)}`
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
          validityHours: validityHours ? parseInt(validityHours) : 48,
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
          validityHours: validityHours ? parseInt(validityHours) : 48,
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

