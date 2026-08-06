import { prisma } from '../db.js';
import { masterFunnelPlan } from './funnelContentPlan.js';
import { AIContentEngine } from './aiContentEngine.js';

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export class TelegramFunnelBot {
  private botToken: string;
  private apiBaseUrl: string;
  private isPolling = false;
  private pollOffset = 0;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Check if Telegram bot token is configured
   */
  public isConfigured(): boolean {
    return Boolean(this.botToken && this.botToken.length > 10);
  }

  /**
   * Start long polling loop if token is configured
   */
  public async startPolling(): Promise<void> {
    if (!this.isConfigured()) {
      console.log('[TelegramBot] TELEGRAM_BOT_TOKEN not provided. Bot updates disabled. HTTP endpoints active.');
      return;
    }

    if (this.isPolling) return;
    this.isPolling = true;
    console.log('[TelegramBot] Bot service started polling...');

    // Asynchronous polling loop
    const pollLoop = async () => {
      while (this.isPolling) {
        try {
          const res = await fetch(`${this.apiBaseUrl}/getUpdates?offset=${this.pollOffset}&timeout=10`, {
            method: 'GET'
          });

          if (res.ok) {
            const data = (await res.json()) as any;
            if (data.ok && Array.isArray(data.result)) {
              for (const update of data.result) {
                this.pollOffset = update.update_id + 1;
                await this.handleUpdate(update);
              }
            }
          }
        } catch (err) {
          console.error('[TelegramBot] Polling error:', err);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    };

    pollLoop().catch((err) => console.error('[TelegramBot] Fatal poll loop error:', err));
  }

  /**
   * Stop polling
   */
  public stopPolling(): void {
    this.isPolling = false;
  }

  /**
   * Process incoming update from Telegram (Webhook or Polling)
   */
  public async handleUpdate(update: any): Promise<void> {
    if (update.message) {
      const msg = update.message;
      const telegramId = BigInt(msg.from.id);
      const text = msg.text || '';
      const firstName = msg.from.first_name || '';
      const lastName = msg.from.last_name || '';
      const username = msg.from.username || '';

      if (text.startsWith('/start')) {
        await this.handleStartCommand(telegramId, firstName, lastName, username);
      }
    } else if (update.callback_query) {
      const cb = update.callback_query;
      const telegramId = BigInt(cb.from.id);
      const data = cb.data || '';

      if (data.startsWith('segment:')) {
        const path = data.split(':')[1] as 'b2c' | 'b2b';
        await this.handleSegmentChoice(telegramId, path, cb.id);
      }
    }
  }

  /**
   * Handle Day 0 /start Command
   */
  public async handleStartCommand(
    telegramId: bigint,
    firstName: string,
    lastName?: string,
    username?: string
  ): Promise<void> {
    // Upsert FunnelUser record in Database
    await prisma.funnelUser.upsert({
      where: { telegramId },
      update: {
        firstName,
        lastName,
        username,
        updatedAt: new Date()
      },
      create: {
        telegramId,
        firstName,
        lastName,
        username,
        status: 'PENDING',
        currentDay: 0
      }
    });

    const welcome = masterFunnelPlan.welcome;
    const buttons: InlineButton[][] = [
      welcome.buttons.map((b) => ({
        text: b.text,
        callback_data: `segment:${b.path}`
      }))
    ];

    const welcomePhoto = await AIContentEngine.generateVisualAsset(welcome.visual);

    await this.sendPhotoMessage(
      telegramId,
      welcomePhoto,
      welcome.text,
      buttons
    );
  }

  /**
   * Handle User Segmentation Choice (Day 0 Inline Buttons)
   */
  public async handleSegmentChoice(
    telegramId: bigint,
    path: 'b2c' | 'b2b',
    callbackQueryId: string
  ): Promise<void> {
    const segment = path.toUpperCase() as 'B2C' | 'B2B';

    // Update user segment & activate funnel track
    const funnelUser = await prisma.funnelUser.update({
      where: { telegramId },
      data: {
        segment,
        status: 'ACTIVE',
        currentDay: 1,
        lastSentAt: new Date()
      }
    });

    // Answer Callback Query
    await this.answerCallbackQuery(callbackQueryId, `Selected path: ${segment}`);

    // Deliver Day 1 Message 1 immediately
    const day1MsgDef = masterFunnelPlan[path].day1_1;
    if (day1MsgDef) {
      const generated = await AIContentEngine.generateFullMessage(segment, 'day1_1', day1MsgDef);

      const buttons: InlineButton[][] = [];
      if (day1MsgDef.ctaText) {
        buttons.push([
          {
            text: day1MsgDef.ctaText,
            url: day1MsgDef.ctaUrl || 'https://t.me/GiftXVietnamBot/app'
          }
        ]);
      }

      await this.sendPhotoMessage(telegramId, generated.imageUrl || '', generated.text, buttons);

      // Log message delivery
      await prisma.funnelMessageLog.create({
        data: {
          funnelUserId: funnelUser.id,
          segment,
          dayKey: 'day1_1',
          generatedText: generated.text,
          imageUrl: generated.imageUrl
        }
      });
    }
  }

  /**
   * Send Photo message with caption & dynamic inline keyboard via Telegram API
   */
  public async sendPhotoMessage(
    telegramId: bigint | number | string,
    photoUrl: string,
    caption: string,
    replyMarkupButtons?: InlineButton[][]
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[TelegramBot Mock Send] To ${telegramId}:`, { photoUrl, caption });
      return true;
    }

    try {
      const body: any = {
        chat_id: telegramId.toString(),
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown'
      };

      if (replyMarkupButtons && replyMarkupButtons.length > 0) {
        body.reply_markup = {
          inline_keyboard: replyMarkupButtons
        };
      }

      const res = await fetch(`${this.apiBaseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        // Fallback to text sendMessage if sendPhoto fails with mock/invalid URL
        return await this.sendTextMessage(telegramId, caption, replyMarkupButtons);
      }

      return true;
    } catch (err) {
      console.error('[TelegramBot] Error sending photo message:', err);
      return await this.sendTextMessage(telegramId, caption, replyMarkupButtons);
    }
  }

  /**
   * Send text message via Telegram API
   */
  public async sendTextMessage(
    telegramId: bigint | number | string,
    text: string,
    replyMarkupButtons?: InlineButton[][]
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log(`[TelegramBot Mock SendText] To ${telegramId}:`, text);
      return true;
    }

    try {
      const body: any = {
        chat_id: telegramId.toString(),
        text: text,
        parse_mode: 'Markdown'
      };

      if (replyMarkupButtons && replyMarkupButtons.length > 0) {
        body.reply_markup = { inline_keyboard: replyMarkupButtons };
      }

      const res = await fetch(`${this.apiBaseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      return res.ok;
    } catch (err) {
      console.error('[TelegramBot] Error sending text message:', err);
      return false;
    }
  }

  /**
   * Answer Callback Query UI feedback
   */
  private async answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await fetch(`${this.apiBaseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text })
      });
    } catch (err) {
      console.warn('[TelegramBot] Answer callback query error:', err);
    }
  }
}

export const telegramFunnelBot = new TelegramFunnelBot();
