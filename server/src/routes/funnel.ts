import { Router } from 'express';
import { prisma } from '../db.js';
import { masterFunnelPlan } from '../services/funnelContentPlan.js';
import { telegramFunnelBot } from '../services/telegramFunnelBot.js';
import { FunnelScheduler } from '../services/funnelScheduler.js';
import { AIContentEngine } from '../services/aiContentEngine.js';

export const funnelRouter = Router();

/**
 * GET /api/funnel/plan
 * Returns the entire 6-day master content plan for B2C & B2B
 */
funnelRouter.get('/plan', (_req, res) => {
  res.json({
    status: 'ok',
    plan: masterFunnelPlan
  });
});

/**
 * POST /api/funnel/webhook
 * Telegram Bot Webhook endpoint
 */
funnelRouter.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    if (update) {
      await telegramFunnelBot.handleUpdate(update);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[FunnelRouter] Webhook handling error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/funnel/users
 * Returns list of funnel users and their progress
 */
funnelRouter.get('/users', async (_req, res) => {
  try {
    const users = await prisma.funnelUser.findMany({
      include: {
        logs: {
          orderBy: { sentAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // BigInt serialization fix
    const sanitizedUsers = users.map((u) => ({
      ...u,
      telegramId: u.telegramId.toString()
    }));

    res.json({
      status: 'ok',
      count: sanitizedUsers.length,
      users: sanitizedUsers
    });
  } catch (err) {
    console.error('[FunnelRouter] Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch funnel users' });
  }
});

/**
 * POST /api/funnel/start-test
 * Simulate user starting funnel or force sending Day 0 Welcome
 */
funnelRouter.post('/start-test', async (req, res) => {
  try {
    const { telegramId = '123456789', firstName = 'TestUser' } = req.body;
    const tId = BigInt(telegramId);

    await telegramFunnelBot.handleStartCommand(tId, firstName);

    res.json({
      status: 'ok',
      message: `Welcome message sent to Telegram ID ${telegramId}`
    });
  } catch (err) {
    console.error('[FunnelRouter] Start test error:', err);
    res.status(500).json({ error: 'Start test failed' });
  }
});

/**
 * POST /api/funnel/send-message-test
 * Manually trigger AI text + 3D image generation & send for a specific day key
 */
funnelRouter.post('/send-message-test', async (req, res) => {
  try {
    const { telegramId = '123456789', segment = 'B2C', dayKey = 'day1_1' } = req.body;
    const pathKey = segment.toLowerCase() as 'b2c' | 'b2b';
    const msgDef = masterFunnelPlan[pathKey]?.[dayKey];

    if (!msgDef) {
      return res.status(400).json({ error: `Message definition not found for ${segment} ${dayKey}` });
    }

    const generated = await AIContentEngine.generateFullMessage(segment, dayKey, msgDef);

    await telegramFunnelBot.sendPhotoMessage(
      telegramId,
      generated.imageUrl || '',
      generated.text,
      msgDef.ctaText ? [[{ text: msgDef.ctaText, url: msgDef.ctaUrl || 'https://t.me/GiftXVietnamBot/app' }]] : undefined
    );

    res.json({
      status: 'ok',
      segment,
      dayKey,
      generated
    });
  } catch (err) {
    console.error('[FunnelRouter] Send message test error:', err);
    res.status(500).json({ error: 'Failed to generate and send test message' });
  }
});

/**
 * POST /api/funnel/trigger-scheduler
 * Manually run the scheduler cycle
 */
funnelRouter.post('/trigger-scheduler', async (_req, res) => {
  try {
    const result = await FunnelScheduler.runSchedulerCycle();
    res.json({
      status: 'ok',
      result
    });
  } catch (err) {
    console.error('[FunnelRouter] Trigger scheduler error:', err);
    res.status(500).json({ error: 'Scheduler run failed' });
  }
});
