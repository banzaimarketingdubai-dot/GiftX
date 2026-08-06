import { prisma } from '../db.js';

export interface InlineButton {
  text: string;
  url?: string;
  web_app?: { url: string };
  callback_data?: string;
}

export interface AgentResponse {
  text: string;
  buttons?: InlineButton[][];
  isHighIntent?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export class B2BAgentEngine {
  private static geminiApiKey = process.env.GEMINI_API_KEY || '';
  private static geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  private static conversationHistory: Map<string, ChatMessage[]> = new Map();

  private static SYSTEM_PROMPT = `
You are the lead B2B AI Onboarding Agent and Business Advisor for GiftX Vietnam (a gamified B2B2C cross-marketing gift network in Telegram).
Your goal: Engage in natural, professional dialogue with restaurant, bar, spa, hotel, motorcycle rental, and salon owners/managers. Explain the zero-cost marketing benefits of GiftX, answer technical questions, address security/anti-fraud concerns, and lead them to register their venue in 2 minutes.

KEY GIFTX FACTS & VALUE PROPOSITION:
1. What is GiftX? A cross-marketing ecosystem where local businesses exchange target customer traffic for FREE (0$ advertising budget). A restaurant gives a customer a digital GiftX Box with spa/car wash vouchers. A spa & rental shop give their customers vouchers to this restaurant.
2. Financial Benefits: Average check increases up to +40%, return guest frequency up to +35%, staff gamification (waiter leaderboards).
3. 0$ Marketing Costs: Venues do not pay for ads. They only provide gift certificates / discounts to incoming guests.
4. Anti-Fraud & Security (Double-scan protection):
   - Waiter QR codes are single-use with a 3-minute TTL (180 seconds).
   - Atomic 'isUsed' database flag ensures a QR code cannot be claimed twice or forwarded to friends.
   - Voucher redemption uses unique UUID secrets requiring waiter confirmation or a 4-digit venue PIN.
   - Cross-Category Matching: Venues NEVER issue vouchers to competing businesses in the same category.
5. Onboarding: Registration takes 2 minutes in Telegram Mini App. No complex POS integrations required.

TONE & STYLE RULES:
- Write in Russian. Keep answers punchy, expert, structured with bullet points and tasteful emojis (🏢, 🚀, 📊, ⚡).
- Length: 2 to 4 concise paragraphs. Always conclude with a helpful follow-up question or a call-to-action.
- Do NOT use markdown headers like '# Header'. Use bold text and clean bullet points suitable for Telegram messages.
`.trim();

  /**
   * Process incoming partner message and generate intelligent AI response
   */
  public static async processMessage(
    chatId: string | number,
    text: string,
    senderName?: string
  ): Promise<AgentResponse> {
    const chatKey = chatId.toString();
    const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

    // Retrieve or initialize conversation history (capped at last 10 turns)
    let history = this.conversationHistory.get(chatKey) || [];
    history.push({ role: 'user', parts: [{ text }] });
    if (history.length > 10) {
      history = history.slice(history.length - 10);
    }
    this.conversationHistory.set(chatKey, history);

    let replyText = '';

    // Attempt Gemini LLM response if API key is present
    if (this.geminiApiKey) {
      const candidateModels = Array.from(
        new Set([
          process.env.GEMINI_MODEL,
          'gemini-3.6-flash',
          'gemini-3.5-flash',
          'gemini-2.0-flash',
          'gemini-1.5-flash'
        ].filter(Boolean) as string[])
      );

      const contents = [
        { role: 'user', parts: [{ text: `[System Context]\n${this.SYSTEM_PROMPT}` }] },
        { role: 'model', parts: [{ text: 'Понял! Я готов консультировать владельцев бизнеса по возможностям и безопасности GiftX B2B.' }] },
        ...history
      ];

      for (const modelName of candidateModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents })
            }
          );

          if (res.ok) {
            const data = (await res.json()) as any;
            const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generated) {
              replyText = generated.trim();
              break;
            }
          }
        } catch (err: any) {
          console.warn(`[B2BAgentEngine] Gemini model ${modelName} API warning:`, err.message);
        }
      }
    }

    // Fallback Smart Contextual Synthesizer if Gemini is unreachable or no key set
    if (!replyText) {
      replyText = this.smartSynthesize(text, senderName);
    }

    // Append AI response to conversation history
    history.push({ role: 'model', parts: [{ text: replyText }] });

    // Detect intent to register or request demo
    const lowerText = text.toLowerCase();
    const isHighIntent =
      lowerText.includes('регистри') ||
      lowerText.includes('подключ') ||
      lowerText.includes('хочу') ||
      lowerText.includes('демо') ||
      lowerText.includes('начать') ||
      lowerText.includes('попробоват');

    // Build adaptive inline action buttons
    const buttons: InlineButton[][] = [
      [{ text: '🏢 Подключить Заведение (2 мин)', web_app: { url: `${appUrl}?page=landing-business` } }],
      [
        { text: '📊 Демо Панель Управляющего', web_app: { url: `${appUrl}?role=ADMIN` } },
        { text: '💬 Связаться с основателем', callback_data: 'b2b_contact_founder' }
      ]
    ];

    return {
      text: replyText,
      buttons,
      isHighIntent
    };
  }

  /**
   * Smart rule-based contextual synthesizer for offline/demo modes
   */
  private static smartSynthesize(userMessage: string, senderName?: string): string {
    const lower = userMessage.toLowerCase();
    const nameStr = senderName ? `, ${senderName}` : '';

    if (lower.includes('защит') || lower.includes('сканиров') || lower.includes('абуз') || lower.includes('лут') || lower.includes('обман')) {
      return (
        `🛡️ **Защита от фрода и повторного сканирования в GiftX:**\n\n` +
        `Система защищена на уровне атомарных транзакций:\n` +
        `• **Одноразовый QR официанта:** Действует ровно 3 минуты (TTL 180 сек). После первой активации статус меняется на \`isUsed\`, повторное сканирование блокируется.\n` +
        `• **Гашение ваучера:** Каждая карточка имеет уникальный UUID secret. Заведение гасит её через PIN-код сотрудника.\n` +
        `• **Кросс-категорийный матчинг:** Клиенты вашего ресторана получают подарки в СПА или автомойку, но НЕ получат сертификат в конкурентный ресторан.\n\n` +
        `Хотите посмотреть, как это выглядит в демо-панели?`
      );
    }

    if (lower.includes('стоим') || lower.includes('цена') || lower.includes('скольк') || lower.includes('тариф') || lower.includes('платно')) {
      return (
        `💰 **Стоимость подключения GiftX B2B:**\n\n` +
        `• **0$ за рекламу:** Вы не платите фиксированный бюджет за показы или клики.\n` +
        `• **Модель обмена:** Вы отдаете только подарки/скидки реальным клиентам, которые пришли к вам от партнеров.\n` +
        `• **Результат:** Рост среднего чека до +40% и приток целевых гостей из лучших заведений города.\n\n` +
        `Подключение занимает ровно 2 минуты без интеграции с POS-системами!`
      );
    }

    if (lower.includes('официант') || lower.includes('персонал') || lower.includes('смена') || lower.includes('работа')) {
      return (
        `👨‍🍳 **Работа персонала и официантов:**\n\n` +
        `• Для официанта процесс занимает 3 секунды в Telegram Mini App.\n` +
        `• Встроенная геймификация: официанты участвуют в дневном рейтинге (Leaderboard) за количество выданных подарков.\n` +
        `• Владелец получает ежедневный отчёт в Telegram об успехах каждого сотрудника.\n\n` +
        `Готовы подключить ваше заведение и попробовать демо-смену?`
      );
    }

    return (
      `🏢 **Добро пожаловать в GiftX B2B${nameStr}!**\n\n` +
      `Я ИИ-консультант системы Cross-Marketing. Помогаю ресторанам, СПА, отелям и сервисам привлекать целевых гостей без рекламного бюджета.\n\n` +
      `🚀 **Чем я могу вам помочь?**\n` +
      `• Рассказать, как получить +40% к среднему чеку\n` +
      `• Объяснить защиту от абуза и работу QR-кодов\n` +
      `• Показать, как зарегистрировать заведение за 2 минуты\n\n` +
      `Задайте любой вопрос или нажмите кнопку ниже для начала!`
    );
  }
}
