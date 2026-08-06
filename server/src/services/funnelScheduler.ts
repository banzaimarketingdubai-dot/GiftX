import { prisma } from '../db.js';
import { masterFunnelPlan } from './funnelContentPlan.js';
import { AIContentEngine } from './aiContentEngine.js';
import { telegramFunnelBot, InlineButton } from './telegramFunnelBot.js';

export class FunnelScheduler {
  private static isRunning = false;
  private static timerHandle: NodeJS.Timeout | null = null;

  /**
   * Start periodic scheduler execution loop
   * Runs check every 15 minutes (or on startup)
   */
  public static startScheduler(intervalMinutes = 15): void {
    if (this.timerHandle) return;

    console.log(`[FunnelScheduler] Started automated scheduler (interval: ${intervalMinutes} mins)`);
    
    // Initial run on boot after 10 seconds
    setTimeout(() => {
      this.runSchedulerCycle().catch((err) =>
        console.error('[FunnelScheduler] Execution cycle error:', err)
      );
    }, 10000);

    // Cron-like periodic interval
    this.timerHandle = setInterval(
      () => {
        this.runSchedulerCycle().catch((err) =>
          console.error('[FunnelScheduler] Scheduled execution error:', err)
        );
      },
      intervalMinutes * 60 * 1000
    );
  }

  public static stopScheduler(): void {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
      console.log('[FunnelScheduler] Scheduler stopped.');
    }
  }

  /**
   * Run one complete scheduler dispatch cycle across active funnel users
   */
  public static async runSchedulerCycle(): Promise<{ processedCount: number; sentCount: number }> {
    if (this.isRunning) {
      console.log('[FunnelScheduler] Cycle already in progress, skipping...');
      return { processedCount: 0, sentCount: 0 };
    }

    this.isRunning = true;
    let processedCount = 0;
    let sentCount = 0;

    try {
      // Find all active users with a chosen segment (B2C or B2B)
      const activeUsers = await prisma.funnelUser.findMany({
        where: {
          status: 'ACTIVE',
          segment: { in: ['B2C', 'B2B'] },
          currentDay: { gte: 1, lte: 6 }
        },
        include: {
          logs: true
        }
      });

      processedCount = activeUsers.length;

      for (const user of activeUsers) {
        if (!user.segment) continue;

        const pathKey = user.segment.toLowerCase() as 'b2c' | 'b2b';
        const day = user.currentDay;
        const trackPlan = masterFunnelPlan[pathKey];

        // Keys for current day (e.g. day1_1, day1_2)
        const possibleKeys = [`day${day}_1`, `day${day}_2`].filter((k) => trackPlan[k]);

        let sentForThisUser = 0;

        for (const dayKey of possibleKeys) {
          const alreadyLogged = user.logs.some((l) => l.dayKey === dayKey);
          if (alreadyLogged) continue;

          const msgDef = trackPlan[dayKey];
          if (!msgDef) continue;

          console.log(`[FunnelScheduler] Dispatching ${user.segment} ${dayKey} to user ${user.telegramId}...`);

          // 1. Synthesize copy and 3D visual photo via AI Engine
          const generated = await AIContentEngine.generateFullMessage(
            user.segment,
            dayKey,
            msgDef
          );

          // 2. Build CTA buttons
          const buttons: InlineButton[][] = [];
          if (msgDef.ctaText) {
            buttons.push([
              {
                text: msgDef.ctaText,
                url: msgDef.ctaUrl || 'https://t.me/GiftXVietnamBot/app'
              }
            ]);
          }

          // 3. Send photo message via Telegram API
          const success = await telegramFunnelBot.sendPhotoMessage(
            user.telegramId,
            generated.imageUrl || '',
            generated.text,
            buttons
          );

          if (success) {
            // 4. Record log entry in Database
            await prisma.funnelMessageLog.create({
              data: {
                funnelUserId: user.id,
                segment: user.segment,
                dayKey: dayKey,
                generatedText: generated.text,
                imageUrl: generated.imageUrl
              }
            });

            await prisma.funnelUser.update({
              where: { id: user.id },
              data: { lastSentAt: new Date() }
            });

            sentCount++;
            sentForThisUser++;
            break; // Send max 1 pending message per cycle per user to space out campaign messages
          }
        }

        // Check if all messages for currentDay are completed
        const allLoggedForDay = possibleKeys.every((k) =>
          user.logs.some((l) => l.dayKey === k) || sentForThisUser > 0
        );

        if (allLoggedForDay && day < 6) {
          // Progress user to next day for tomorrow
          const updatedLogsCount = user.logs.length + sentForThisUser;
          if (updatedLogsCount >= day * 2) {
            await prisma.funnelUser.update({
              where: { id: user.id },
              data: { currentDay: day + 1 }
            });
          }
        } else if (day >= 6 && allLoggedForDay) {
          await prisma.funnelUser.update({
            where: { id: user.id },
            data: { status: 'COMPLETED' }
          });
        }
      }
    } catch (err) {
      console.error('[FunnelScheduler] Error during execution cycle:', err);
    } finally {
      this.isRunning = false;
    }

    return { processedCount, sentCount };
  }
}
