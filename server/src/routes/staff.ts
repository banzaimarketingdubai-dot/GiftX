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
