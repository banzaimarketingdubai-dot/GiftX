import { prisma } from '../db.js';
import { masterFunnelPlan } from './funnelContentPlan.js';
import { AIContentEngine } from './aiContentEngine.js';

export interface InlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface B2BWizardState {
  step: 'NAME' | 'DESCRIPTION' | 'LOCATION' | 'GOOGLE_REVIEWS' | 'HOURS' | 'ROLE';
  name?: string;
  description?: string;
  address?: string;
  googleMapsUrl?: string;
  googleReviewsUrl?: string;
  workingHours?: string;
  role?: 'OWNER' | 'MANAGER' | 'WAITER';
}

export class TelegramFunnelBot {
  private botToken: string;
  private apiBaseUrl: string;
  private isPolling = false;
  private pollOffset = 0;
  private b2bWizardStates: Map<string, B2BWizardState> = new Map();

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
    try {
      if (update.message) {
        const msg = update.message;
        const telegramId = BigInt(msg.from.id);
        const text = msg.text || '';
        const firstName = msg.from.first_name || 'Предприниматель';
        const lastName = msg.from.last_name || '';
        const username = msg.from.username || '';

        if (text.startsWith('/start')) {
          const parts = text.split(' ');
          const payload = parts.length > 1 ? parts[1] : '';
          await this.handleStartCommand(telegramId, firstName, lastName, username, payload);
        } else {
          await this.handleMessageText(telegramId, text, firstName);
        }
      } else if (update.callback_query) {
        const cb = update.callback_query;
        const telegramId = BigInt(cb.from.id);
        const data = cb.data || '';
        const firstName = cb.from.first_name || 'Предприниматель';

        await this.handleCallbackQuery(telegramId, data, cb.id, firstName);
      }
    } catch (err: any) {
      console.error('[TelegramBot] Update handling error:', err);
    }
  }

  /**
   * Handle /start command with deep link payload (e.g. b2b, join_owner_xxx, join_admin_xxx, join_staff_xxx)
   */
  public async handleStartCommand(
    telegramId: bigint,
    firstName: string,
    lastName?: string,
    username?: string,
    payload?: string
  ): Promise<void> {
    // Upsert FunnelUser record
    try {
      await prisma.funnelUser.upsert({
        where: { telegramId },
        update: { firstName, lastName, username, updatedAt: new Date() },
        create: { telegramId, firstName, lastName, username, status: 'PENDING', currentDay: 0 }
      });
    } catch (e) {
      console.warn('[TelegramBot] FunnelUser upsert fallback:', e);
    }

    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

    // 1. Staff Invitation Link: join_owner_..., join_admin_..., join_staff_...
    if (payload && payload.startsWith('join_')) {
      await this.handleStaffJoinDeepLink(telegramId, payload, firstName);
      return;
    }

    // 2. B2B Onboarding Deep Link: start=b2b
    if (payload === 'b2b' || payload?.startsWith('b2b')) {
      await this.sendB2BWelcomeMessage(telegramId, firstName);
      return;
    }

    // Default Day 0 welcome
    const welcome = masterFunnelPlan.welcome;
    const inlineButtons: InlineButton[][] = [
      welcome.buttons.map((b) => ({
        text: b.text,
        callback_data: `segment:${b.path}`
      }))
    ];

    const welcomePhoto = await AIContentEngine.generateVisualAsset(welcome.visual);
    await this.sendPhotoMessage(telegramId, welcomePhoto, welcome.text, inlineButtons);
    await this.sendPersistentB2BReplyKeyboard(telegramId);
  }

  /**
   * Deliver B2B Pitch & Onboarding Start
   */
  public async sendB2BWelcomeMessage(telegramId: bigint | number | string, firstName: string): Promise<void> {
    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

    const b2bText =
      `🚀 **Добро пожаловать в GiftX B2B, ${firstName}!**\n\n` +
      `**GiftX** — это инновационная кросс-маркетинговая платформа для ресторанов, СПА, отелей и сервисных бизнесов.\n\n` +
      `✨ **Почему это выгодно вашему заведению?**\n` +
      `• 📲 **0% Трения:** Вашим гостям НЕ нужно качать и устанавливать приложения! Вся механика работает прямо внутри **Telegram Mini App**.\n` +
      `• 💰 **0$ Расходов на рекламу (CAC = 0$):** Автоматический обмен целевыми платежеспособными гостями с лучшими партнерами города.\n` +
      `• 📊 **+40% к среднему чеку:** Мотивация гостей дозаказывать блюда для получения бокса с подарками!\n\n` +
      `👇 **Готовы привлечь новых клиентов уже сегодня?** Создайте заведение за 2 минуты!`;

    const inlineButtons: InlineButton[][] = [
      [{ text: '🏢 Создать заведение (2 мин)', callback_data: 'b2b_start_wizard' }],
      [
        { text: '📱 Открыть в Mini App', url: `${appUrl}?page=landing-business` },
        { text: '💬 Вопрос ИИ-агенту', callback_data: 'b2b_ask_ai' }
      ]
    ];

    await this.sendTextMessage(telegramId, b2bText, inlineButtons);
    await this.sendPersistentB2BReplyKeyboard(telegramId);
  }

  /**
   * Send persistent Bottom Reply Keyboard ("БИЗНЕС", "Сотрудники", "🎁 ДЕМО", "Mini App")
   */
  public async sendPersistentB2BReplyKeyboard(telegramId: bigint | number | string): Promise<void> {
    if (!this.isConfigured()) return;
    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

    try {
      const body = {
        chat_id: telegramId.toString(),
        text: '📍 *Главное меню GiftX Business active.* Выберите нужный раздел:',
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [
            [{ text: '🏢 БИЗНЕС' }, { text: '👥 Сотрудники' }],
            [{ text: '🎁 ДЕМО (Открытие бокса)' }, { text: '📱 Mini App' }],
            [{ text: 'ℹ️ О GiftX' }]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      };

      await fetch(`${this.apiBaseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (err) {
      console.warn('[TelegramBot] Reply keyboard send error:', err);
    }
  }

  /**
   * Deliver Demo Box opening message with WebApp button
   */
  public async sendDemoBoxMessage(telegramId: bigint | number | string): Promise<void> {
    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

    const text =
      `🎁 **ДЕМО-РАСПАКОВКА БОКСА GIFTX**\n\n` +
      `Интерактивный 3D-экран открытия сюрприз-бокса для презентации владельцам заведений, администраторам и клиентам.\n\n` +
      `👇 Нажмите кнопку ниже, чтобы запустить демо-открытие бокса:`;

    const inlineButtons: InlineButton[][] = [
      [
        { text: '🎁 Открыть ДЕМО-Бокс', url: `${appUrl}?page=demo-box` }
      ]
    ];

    await this.sendTextMessage(telegramId, text, inlineButtons);
  }

  /**
   * Handle incoming plain text messages (Wizard progression or Reply Menu clicks)
   */
  public async handleMessageText(telegramId: bigint, text: string, firstName: string): Promise<void> {
    const chatKey = telegramId.toString();
    const wizardState = this.b2bWizardStates.get(chatKey);

    // 1. Reply menu button handler
    const cleanText = text.trim().toLowerCase();

    if (cleanText.startsWith('/demo') || cleanText.includes('демо') || cleanText === '🎁 демо (открытие бокса)') {
      await this.sendDemoBoxMessage(telegramId);
      return;
    }

    if (cleanText === '🏢 бизнес' || cleanText === 'бизнес') {
      await this.showBusinessMenu(telegramId, firstName);
      return;
    }

    if (cleanText === '👥 сотрудники' || cleanText === 'сотрудники') {
      await this.showStaffSubmenu(telegramId);
      return;
    }

    if (cleanText === '📱 mini app' || cleanText === 'mini app') {
      const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';
      await this.sendTextMessage(telegramId, `📱 **Открыть GiftX Mini App:**\n${appUrl}`, [
        [{ text: 'Запустить Mini App', url: appUrl }]
      ]);
      return;
    }

    if (cleanText === 'ℹ️ о giftx' || cleanText === 'о giftx') {
      await this.sendB2BWelcomeMessage(telegramId, firstName);
      return;
    }

    // 2. Interactive Wizard step processing
    if (wizardState) {
      await this.processWizardStep(telegramId, text, wizardState, firstName);
      return;
    }

    // 3. Fallback AI response for queries
    const aiResponse = await import('./b2bAgentEngine.js').then((m) =>
      m.B2BAgentEngine.processMessage(telegramId.toString(), text, firstName)
    );

    await this.sendTextMessage(telegramId, aiResponse.text, aiResponse.buttons);
  }

  /**
   * Show "БИЗНЕС" menu options in bot
   */
  private async showBusinessMenu(telegramId: bigint | number | string, firstName: string): Promise<void> {
    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';
    const chatKey = telegramId.toString();

    // Check if user already owns a partner
    let partner: any = null;
    try {
      const staff = await prisma.staffMember.findFirst({
        where: { telegramId: BigInt(chatKey) },
        include: { partner: true }
      });
      if (staff && staff.partner) partner = staff.partner;
    } catch (e) {}

    if (partner) {
      const statusBadge =
        partner.moderationStatus === 'APPROVED'
          ? '✅ Одобрено'
          : partner.moderationStatus === 'REJECTED'
          ? '❌ Отклонено'
          : '⏳ На модерации';

      const text =
        `🏬 **Ваше заведение:** ${partner.name}\n` +
        `📊 **Статус модерации:** ${statusBadge}\n` +
        `📍 **Адрес:** ${partner.address}\n` +
        `⏰ **Часы работы:** ${partner.workingHours || 'Не указаны'}\n` +
        `⭐ **Google Рейтинг:** ${partner.googleRating || 4.8}\n\n` +
        `Выберите действие ниже:`;

      const buttons: InlineButton[][] = [
        [{ text: '👥 Ссылки и QR для Сотрудников', callback_data: `b2b_staff_links:${partner.id}` }],
        [{ text: '📊 Панель Управляющего в TMA', url: `${appUrl}?page=landing-business` }],
        [{ text: '➕ Зарегистрировать ещё заведение', callback_data: 'b2b_start_wizard' }]
      ];

      await this.sendTextMessage(telegramId, text, buttons);
    } else {
      const text =
        `🏢 **Раздел БИЗНЕС — GiftX Cross-Marketing**\n\n` +
        `У вас пока нет зарегистрированных заведений.\n` +
        `Создайте свое заведение за 2 минуты, чтобы начать получать клиентов от партнеров!`;

      const buttons: InlineButton[][] = [
        [{ text: '⚡ Создать заведение прямо сейчас', callback_data: 'b2b_start_wizard' }],
        [{ text: '📱 Открыть форма в Mini App', url: `${appUrl}?page=landing-business` }]
      ];

      await this.sendTextMessage(telegramId, text, buttons);
    }
  }

  /**
   * Show Staff invitation links & QR codes submenu
   */
  private async showStaffSubmenu(telegramId: bigint | number | string): Promise<void> {
    const chatKey = telegramId.toString();

    let staffMember: any = null;
    try {
      staffMember = await prisma.staffMember.findFirst({
        where: { telegramId: BigInt(chatKey) },
        include: { partner: true }
      });
    } catch (e) {}

    if (!staffMember || !staffMember.partner) {
      await this.sendTextMessage(
        telegramId,
        `⚠️ **Сначала создайте или привяжитесь к заведению!**\nНажмите «🏢 БИЗНЕС» в меню ниже, чтобы создать заведение.`
      );
      return;
    }

    await this.deliverStaffInviteLinks(telegramId, staffMember.partner.id, staffMember.partner.name);
  }

  /**
   * Deliver Deep Links & QR codes for Owner, Admin, and Staff
   */
  public async deliverStaffInviteLinks(
    telegramId: bigint | number | string,
    partnerId: string,
    partnerName: string
  ): Promise<void> {
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'giftx2025_bot';

    const ownerLink = `https://t.me/${botUsername}?start=join_owner_${partnerId}`;
    const adminLink = `https://t.me/${botUsername}?start=join_admin_${partnerId}`;
    const staffLink = `https://t.me/${botUsername}?start=join_staff_${partnerId}`;

    const qrStaffUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(staffLink)}`;

    const text =
      `👥 **ССЫЛКИ И QR-КОДЫ ДЛЯ СОТРУДНИКОВ**\n` +
      `🏬 **Заведение:** «${partnerName}»\n\n` +
      `Отправьте нужную ссылку сотруднику для подключения к системе:\n\n` +
      `👑 **Владелец (Full Access):**\n\`${ownerLink}\`\n\n` +
      `👔 **Администратор (Управляющий):**\n\`${adminLink}\`\n\n` +
      `👨‍🍳 **Официант / Персонал (Выдача боксов):**\n\`${staffLink}\`\n\n` +
      `📌 *Сканируйте QR-код ниже для быстрого добавления официантов:*`;

    const buttons: InlineButton[][] = [
      [{ text: '🔗 Скопировать ссылку для Официантов', callback_data: `copy_link:${staffLink}` }],
      [{ text: '📱 Открыть панель в Mini App', url: `${process.env.CLIENT_URL || 'https://gift-x.vercel.app'}?page=landing-business` }]
    ];

    await this.sendPhotoMessage(telegramId, qrStaffUrl, text, buttons);
  }

  /**
   * Handle interactive step-by-step Bot Wizard
   */
  private async processWizardStep(
    telegramId: bigint,
    input: string,
    state: B2BWizardState,
    firstName: string
  ): Promise<void> {
    const chatKey = telegramId.toString();

    switch (state.step) {
      case 'NAME':
        state.name = input.trim();
        state.step = 'DESCRIPTION';
        this.b2bWizardStates.set(chatKey, state);
        await this.sendTextMessage(
          telegramId,
          `📝 **Шаг 2/5: Описание заведения**\n\nУкажите краткое описание (например: *Уютный гриль-бар на берегу с авторскими коктейлями и морепродуктами*):`
        );
        break;

      case 'DESCRIPTION':
        state.description = input.trim();
        state.step = 'LOCATION';
        this.b2bWizardStates.set(chatKey, state);
        await this.sendTextMessage(
          telegramId,
          `📍 **Шаг 3/5: Локация и адрес**\n\nУкажите адрес заведения или вставьте ссылку на **Google Maps** (например: *Phu Quoc, Long Beach, St 4* или ` +
            `\`https://maps.google.com/?q=...\`):`
        );
        break;

      case 'LOCATION':
        state.address = input.trim();
        if (input.includes('http') || input.includes('maps')) {
          state.googleMapsUrl = input.trim();
        }
        state.step = 'GOOGLE_REVIEWS';
        this.b2bWizardStates.set(chatKey, state);
        await this.sendTextMessage(
          telegramId,
          `⭐ **Шаг 4/5: Ссылка на Google Отзывы**\n\nВставьте ссылку на отзывы вашей компании в Google Картах (или отправьте «-», если пока нет):`
        );
        break;

      case 'GOOGLE_REVIEWS':
        if (input.trim() !== '-') {
          state.googleReviewsUrl = input.trim();
        }
        state.step = 'HOURS';
        this.b2bWizardStates.set(chatKey, state);
        await this.sendTextMessage(
          telegramId,
          `⏰ **Шаг 5/5: Часы работы**\n\nУкажите время работы заведения (например: *Ежедневно с 10:00 до 23:00*):`
        );
        break;

      case 'HOURS':
        state.workingHours = input.trim();
        state.step = 'ROLE';
        this.b2bWizardStates.set(chatKey, state);

        const roleText =
          `👑 **Выберите вашу роль в заведении «${state.name}»:**\n\n` +
          `• **Владелец:** Полный доступ к финансовым отчетам и настройке порогов чеков.\n` +
          `• **Админ:** Управление сменами персонала и турнирами.\n` +
          `• **Стаф:** Выдача подарков и принятие гостей.`;

        const roleButtons: InlineButton[][] = [
          [
            { text: '👑 Владелец', callback_data: 'b2b_role:OWNER' },
            { text: '👔 Админ', callback_data: 'b2b_role:MANAGER' },
            { text: '👨‍🍳 Стаф', callback_data: 'b2b_role:WAITER' }
          ]
        ];

        await this.sendTextMessage(telegramId, roleText, roleButtons);
        break;

      default:
        break;
    }
  }

  /**
   * Handle Callback Queries
   */
  public async handleCallbackQuery(
    telegramId: bigint,
    data: string,
    callbackQueryId: string,
    firstName: string
  ): Promise<void> {
    const chatKey = telegramId.toString();

    if (data.startsWith('segment:')) {
      const path = data.split(':')[1] as 'b2c' | 'b2b';
      await this.handleSegmentChoice(telegramId, path, callbackQueryId);
      return;
    }

    if (data === 'b2b_start_wizard' || data === 'b2b_create_venue') {
      this.b2bWizardStates.set(chatKey, { step: 'NAME' });
      await this.answerCallbackQuery(callbackQueryId, 'Начало регистрации заведения');
      await this.sendTextMessage(
        telegramId,
        `🏢 **Регистрация заведения (Шаг 1/5)**\n\nВведите **официальное название** вашего заведения (например: *Sunset Beach Club*):`
      );
      return;
    }

    if (data.startsWith('b2b_role:')) {
      const selectedRole = data.split(':')[1] as 'OWNER' | 'MANAGER' | 'WAITER';
      const state = this.b2bWizardStates.get(chatKey);

      if (state) {
        state.role = selectedRole;
        await this.completeVenueRegistration(telegramId, state, firstName, callbackQueryId);
        this.b2bWizardStates.delete(chatKey);
      } else {
        await this.answerCallbackQuery(callbackQueryId, 'Сессия истекла. Начните заново.');
      }
      return;
    }

    if (data.startsWith('b2b_staff_links:')) {
      const partnerId = data.split(':')[1];
      await this.answerCallbackQuery(callbackQueryId, 'Генерация ссылок для сотрудников');
      await this.deliverStaffInviteLinks(telegramId, partnerId, 'Ваше заведение');
      return;
    }

    if (data.startsWith('mod_approve:') || data.startsWith('mod_reject:')) {
      await this.handleAdminModerationAction(telegramId, data, callbackQueryId);
      return;
    }

    if (data === 'b2b_ask_ai') {
      await this.answerCallbackQuery(callbackQueryId, 'Задайте вопрос в чат');
      await this.sendTextMessage(
        telegramId,
        `💬 Напишите любой вопрос в чат! ИИ-консультант GiftX расскажет про рост выручки, защиту от фрода и интеграции.`
      );
      return;
    }
  }

  /**
   * Complete Venue Registration & Submit for Admin Moderation
   */
  private async completeVenueRegistration(
    telegramId: bigint,
    state: B2BWizardState,
    firstName: string,
    callbackQueryId: string
  ): Promise<void> {
    await this.answerCallbackQuery(callbackQueryId, 'Заведение создано!');

    let partner: any = null;

    try {
      // Create Partner record in DB
      partner = await prisma.partner.create({
        data: {
          name: state.name || 'Мое Заведение',
          description: state.description || '',
          address: state.address || 'Центр города',
          googleMapsUrl: state.googleMapsUrl || '',
          workingHours: state.workingHours || '10:00 - 23:00',
          category: 'HORECA',
          logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
          moderationStatus: 'PENDING',
          ownerTelegramId: telegramId
        }
      });

      // Create StaffMember record for creator
      await prisma.staffMember.create({
        data: {
          partnerId: partner.id,
          name: `${firstName} (${state.role === 'OWNER' ? 'Владелец' : state.role === 'MANAGER' ? 'Админ' : 'Стаф'})`,
          role: state.role || 'OWNER',
          telegramId: telegramId
        }
      });
    } catch (err: any) {
      console.warn('[TelegramBot] DB creation fallback:', err.message);
      partner = {
        id: `partner_${Date.now()}`,
        name: state.name || 'Новое Заведение',
        address: state.address || 'Адрес',
        moderationStatus: 'PENDING'
      };
    }

    // Deliver Staff links & QR code
    await this.sendTextMessage(
      telegramId,
      `🎉 **Заведение «${partner.name}» успешно создано!**\n\n` +
      `⏳ **Статус:** \`НА МОДЕРАЦИИ\`\n` +
      `Заявка отправлена модераторам GiftX. Мы уведомим вас в этом боте сразу после одобрения!\n\n` +
      `👇 Ниже сгенерированы ваши перманентные ссылки и QR-коды для добавления сотрудников:`
    );

    await this.deliverStaffInviteLinks(telegramId, partner.id, partner.name);

    // Send Moderation Notification to GiftX Admins
    await this.sendAdminModerationNotification(partner, firstName);
  }

  /**
   * Send Moderation Request to GiftX Admins
   */
  private async sendAdminModerationNotification(partner: any, creatorName: string): Promise<void> {
    const adminIdsStr = process.env.ADMIN_TELEGRAM_IDS || '999000111';
    const adminIds = adminIdsStr.split(',').map((s) => s.trim()).filter(Boolean);

    const modText =
      `🆕 **НОВОЕ ЗАВЕДЕНИЕ НА МОДЕРАЦИИ!**\n\n` +
      `🏬 **Название:** ${partner.name}\n` +
      `📝 **Описание:** ${partner.description || 'Не указано'}\n` +
      `📍 **Адрес:** ${partner.address}\n` +
      `⏰ **Часы:** ${partner.workingHours || '10:00 - 23:00'}\n` +
      `👤 **Создатель:** ${creatorName} (ID: \`${partner.ownerTelegramId || 'bot'}\`)\n\n` +
      `Выберите действие:`;

    const modButtons: InlineButton[][] = [
      [
        { text: '✅ Одобрить', callback_data: `mod_approve:${partner.id}` },
        { text: '❌ Отклонить', callback_data: `mod_reject:${partner.id}` }
      ]
    ];

    for (const adminId of adminIds) {
      await this.sendTextMessage(adminId, modText, modButtons);
    }
  }

  /**
   * Handle Admin Moderation Decision Callback Query
   */
  private async handleAdminModerationAction(
    adminTelegramId: bigint,
    data: string,
    callbackQueryId: string
  ): Promise<void> {
    const isApprove = data.startsWith('mod_approve:');
    const partnerId = data.split(':')[1];
    const newStatus = isApprove ? 'APPROVED' : 'REJECTED';

    await this.answerCallbackQuery(
      callbackQueryId,
      isApprove ? 'Заведение одобрено ✅' : 'Заведение отклонено ❌'
    );

    let partnerName = 'Заведение';
    let ownerId: bigint | number | string | null = null;

    try {
      const updated = await prisma.partner.update({
        where: { id: partnerId },
        data: { moderationStatus: newStatus }
      });
      partnerName = updated.name;
      ownerId = updated.ownerTelegramId;
    } catch (err: any) {
      console.warn('[TelegramBot] Moderation update DB fallback:', err.message);
    }

    await this.sendTextMessage(
      adminTelegramId,
      `📋 **Решение по заведению «${partnerName}» принято:**\nСтатус изменен на: \`${newStatus}\``
    );

    // Notify Owner if ownerTelegramId present
    if (ownerId) {
      if (isApprove) {
        await this.sendTextMessage(
          ownerId,
          `✅ **ПОЗДРАВЛЯЕМ! Ваше заведение «${partnerName}» успешно прошло модерацию!**\n\n` +
          `Теперь вы полностью подключены к сети Cross-Marketing GiftX. Официанты могут генерировать боксы, а гости — получать ваши подарки!\n\n` +
          `🚀 Запустите Mini App для доступа к аналитике:`
        );
      } else {
        await this.sendTextMessage(
          ownerId,
          `❌ **Модерация заведения «${partnerName}» отклонена.**\n\n` +
          `Если вы считаете, что это ошибка, пожалуйста, свяжитесь с поддержкой или проверьте правильность введенного адреса и данных.`
        );
      }
    }
  }

  /**
   * Handle Deep Link Staff Joining
   */
  private async handleStaffJoinDeepLink(
    telegramId: bigint,
    payload: string,
    firstName: string
  ): Promise<void> {
    // Format: join_owner_partnerId, join_admin_partnerId, join_staff_partnerId
    const parts = payload.split('_');
    if (parts.length < 3) return;

    const roleKey = parts[1]; // owner | admin | staff
    const partnerId = parts.slice(2).join('_');
    const role: 'OWNER' | 'MANAGER' | 'WAITER' =
      roleKey === 'owner' ? 'OWNER' : roleKey === 'admin' ? 'MANAGER' : 'WAITER';

    let partnerName = 'Заведение';

    try {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
      if (partner) partnerName = partner.name;

      await prisma.staffMember.create({
        data: {
          partnerId,
          name: `${firstName} (${role === 'OWNER' ? 'Владелец' : role === 'MANAGER' ? 'Админ' : 'Официант'})`,
          role,
          telegramId
        }
      });
    } catch (err: any) {
      console.warn('[TelegramBot] Staff join DB fallback:', err.message);
    }

    const roleTitle = role === 'OWNER' ? 'Владелец' : role === 'MANAGER' ? 'Администратор' : 'Официант';

    await this.sendTextMessage(
      telegramId,
      `🎉 **Вы успешно привязаны к заведению «${partnerName}»!**\n\n` +
      `👔 **Ваша роль:** ${roleTitle}\n` +
      `Теперь вам доступны функции управления и выдачи сюрприз-боксов в Telegram Mini App.`
    );
    await this.sendPersistentB2BReplyKeyboard(telegramId);
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

    if (segment === 'B2B') {
      await this.answerCallbackQuery(callbackQueryId, 'Путь B2B активирован');
      await this.sendB2BWelcomeMessage(telegramId, 'Предприниматель');
      return;
    }

    // Update user segment & activate funnel track
    try {
      const funnelUser = await prisma.funnelUser.update({
        where: { telegramId },
        data: { segment, status: 'ACTIVE', currentDay: 1, lastSentAt: new Date() }
      });

      await this.answerCallbackQuery(callbackQueryId, `Selected path: ${segment}`);

      const day1MsgDef = masterFunnelPlan[path].day1_1;
      if (day1MsgDef) {
        const generated = await AIContentEngine.generateFullMessage(segment, 'day1_1', day1MsgDef);
        const buttons: InlineButton[][] = [];
        if (day1MsgDef.ctaText) {
          buttons.push([{ text: day1MsgDef.ctaText, url: day1MsgDef.ctaUrl || 'https://t.me/GiftXVietnamBot/app' }]);
        }

        await this.sendPhotoMessage(telegramId, generated.imageUrl || '', generated.text, buttons);
      }
    } catch (err) {
      console.warn('[TelegramBot] Segment choice fallback:', err);
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
      console.log(`[TelegramBot Mock SendPhoto] To ${telegramId}:`, { photoUrl, caption });
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
        body.reply_markup = { inline_keyboard: replyMarkupButtons };
      }

      const res = await fetch(`${this.apiBaseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
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
