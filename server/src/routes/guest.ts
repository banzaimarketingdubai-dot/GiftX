import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { notifyTokenClaimed } from '../websocket.js';

export const guestRouter = Router();

// 1. Проверить валидность токена из URL перед распаковкой
guestRouter.get('/validate-token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const tokenRecord = await prisma.staffIssuanceToken.findUnique({
      where: { token },
      include: { partner: true }
    });

    if (!tokenRecord) {
      return res.status(404).json({ success: false, error: 'Токен не найден' });
    }

    if (tokenRecord.isUsed) {
      return res.status(400).json({
        success: false,
        errorCode: 'TOKEN_ALREADY_USED',
        error: 'Этот QR-код уже был использован гостем. Попросите официанта сгенерировать новый.'
      });
    }

    if (new Date() > tokenRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        errorCode: 'TOKEN_EXPIRED',
        error: 'Срок действия QR-кода (3 минуты) истёк. Попросите официанта сгенерировать новый.'
      });
    }

    return res.json({
      success: true,
      boxLevel: tokenRecord.boxLevel,
      donorPartnerName: tokenRecord.partner.name,
      donorCategory: tokenRecord.partner.category,
      expiresAt: tokenRecord.expiresAt
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Активация бокса и алгоритм матчинга 5 ваучеров
guestRouter.post('/claim-box', async (req: Request, res: Response) => {
  try {
    const { token, telegramId, firstName, lastName, username } = req.body;

    if (!token || !telegramId) {
      return res.status(400).json({ success: false, error: 'Укажите token и telegramId' });
    }

    // Поиск или создание пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(telegramId),
          firstName: firstName || 'Гость',
          lastName: lastName || '',
          username: username || ''
        }
      });
    }

    // Транзакционная проверка токена (Anti-Fraud)
    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.staffIssuanceToken.findUnique({
        where: { token },
        include: { partner: true }
      });

      if (!tokenRecord) {
        throw new Error('Токен не существует.');
      }
      if (tokenRecord.isUsed) {
        throw new Error('Данный QR-код уже активирован!');
      }
      if (new Date() > tokenRecord.expiresAt) {
        throw new Error('Время действия QR-кода истекло (3 минуты).');
      }

      // Помечаем токен как использованный
      await tx.staffIssuanceToken.update({
        where: { token },
        data: {
          isUsed: true,
          claimedByUserId: user.id
        }
      });

      const donorCategory = tokenRecord.partner.category;

      // КРИТИЧЕСКОЕ БИЗНЕС-ПРАВИЛО 1: Исключаем заведения с категорией донора!
      // Получаем все активные офферы партнеров из ДРУГИХ категорий
      const availableOffers = await tx.voucherOffer.findMany({
        where: {
          partner: {
            category: { not: donorCategory },
            activeStatus: true
          }
        },
        include: { partner: true }
      });

      // Фильтруем офферы по лимиту (claimedCount < totalLimit)
      const validOffers = availableOffers.filter(o => o.claimedCount < o.totalLimit);

      // Группируем по категориям ваучеров
      const magnets = validOffers.filter(o => o.category === 'TRAFFIC_MAGNET');
      const lifestyles = validOffers.filter(o => o.category === 'LIFESTYLE');
      const anchors = validOffers.filter(o => o.category === 'ANCHOR');

      // Алгоритм отбора: 2x TRAFFIC_MAGNET + 2x LIFESTYLE + 1x ANCHOR
      const selectedOffers: typeof validOffers = [];

      const pickRandom = (arr: typeof validOffers, count: number) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      };

      selectedOffers.push(...pickRandom(magnets, 2));
      selectedOffers.push(...pickRandom(lifestyles, 2));
      selectedOffers.push(...pickRandom(anchors, 1));

      // Если в каких-то категориях не хватило, добираем из общего пула validOffers
      if (selectedOffers.length < 5) {
        const pickedIds = new Set(selectedOffers.map(o => o.id));
        const remaining = validOffers.filter(o => !pickedIds.has(o.id));
        selectedOffers.push(...pickRandom(remaining, 5 - selectedOffers.length));
      }

      // Создаем записи ClaimedVoucher для пользователя
      const now = new Date();
      const claimedVouchers = [];

      for (const offer of selectedOffers) {
        const expiresAt = new Date(now.getTime() + offer.validityHours * 60 * 60 * 1000);

        const claimed = await tx.claimedVoucher.create({
          data: {
            userId: user.id,
            voucherOfferId: offer.id,
            status: 'ACTIVE',
            claimedAt: now,
            expiresAt
          },
          include: {
            voucherOffer: {
              include: { partner: true }
            }
          }
        });

        // Увеличиваем счетчик забранных ваучеров
        await tx.voucherOffer.update({
          where: { id: offer.id },
          data: { claimedCount: { increment: 1 } }
        });

        claimedVouchers.push(claimed);
      }

      return { tokenRecord, claimedVouchers };
    });

    // Оповещаем официанта через WebSocket о вручении бокса
    notifyTokenClaimed(token, user.firstName);

    return res.json({
      success: true,
      boxLevel: result.tokenRecord.boxLevel,
      donorPartnerName: result.tokenRecord.partner.name,
      vouchers: result.claimedVouchers
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

// 3. Получить кошелек пользователя "Мои Подарки"
guestRouter.get('/wallet/:telegramId', async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        wallet: {
          include: {
            voucherOffer: {
              include: { partner: true }
            }
          },
          orderBy: { claimedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.json({ success: true, wallet: [] });
    }

    return res.json({ success: true, wallet: user.wallet });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Погасить ваучер (Администратор заведения)
guestRouter.post('/redeem-voucher', async (req: Request, res: Response) => {
  try {
    const { qrCodeSecret, pinCode } = req.body;

    // В демо-режиме используем универсальный PIN '1234'
    if (pinCode && pinCode !== '1234') {
      return res.status(400).json({ success: false, error: 'Неверный PIN-код заведения' });
    }

    const voucher = await prisma.claimedVoucher.findUnique({
      where: { qrCodeSecret },
      include: { voucherOffer: { include: { partner: true } }, user: true }
    });

    if (!voucher) {
      return res.status(404).json({ success: false, error: 'Ваучер не найден' });
    }

    if (voucher.status === 'REDEEMED') {
      return res.status(400).json({ success: false, error: 'Ваучер уже был погашен ранее!' });
    }

    if (voucher.status === 'EXPIRED' || new Date() > voucher.expiresAt) {
      return res.status(400).json({ success: false, error: 'Срок действия ваучера истек.' });
    }

    const updatedVoucher = await prisma.claimedVoucher.update({
      where: { id: voucher.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date()
      },
      include: { voucherOffer: { include: { partner: true } }, user: true }
    });

    // Отправка уведомления пользователю в Telegram при гашении
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8958055788:AAF3QTtP5l2_CUfbjRFkz0N5brYkWoeE3Xs';
    if (botToken && updatedVoucher.user?.telegramId) {
      const partnerName = updatedVoucher.voucherOffer?.partner?.name || 'Партнер';
      const offerTitle = updatedVoucher.voucherOffer?.title || 'Ваучер';
      const mapsUrl = updatedVoucher.voucherOffer?.partner?.googleMapsUrl || 'https://maps.google.com';

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: updatedVoucher.user.telegramId.toString(),
          text: `🎉 *Ваучер успешно погашен!*\n\nВы только что использоваили подарок *${offerTitle}* в заведении *${partnerName}*!\n\n⭐️ Понравился сервис? Пожалуйста, оставьте отзыв заведению на Google Maps:`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '⭐ Оставить отзыв на Google Maps', url: mapsUrl }
              ]
            ]
          }
        })
      }).catch(err => console.error('Failed to send Telegram notification:', err));
    }

    return res.json({
      success: true,
      message: '🎉 Ваучер успешно погашен!',
      voucher: updatedVoucher
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Все партнеры на карте
guestRouter.get('/map-partners', async (_req: Request, res: Response) => {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        voucherOffers: true
      }
    });

    return res.json({
      success: true,
      partners
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Telegram Bot Webhook (Интерактивные диалоги и команды бота)
guestRouter.post('/telegram-webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;
    const message = update?.message;

    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '8958055788:AAF3QTtP5l2_CUfbjRFkz0N5brYkWoeE3Xs';
      const appUrl = process.env.CLIENT_URL || 'https://gift-x.vercel.app';

      const sendMessage = async (replyText: string, keyboardButtons?: any[]) => {
        if (!botToken) return;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown',
            reply_markup: keyboardButtons ? { inline_keyboard: keyboardButtons } : undefined
          })
        });
      };

      // 1. Команда /start
      if (text.startsWith('/start')) {
        const startParam = text.split(' ')[1] || '';
        const targetUrl = startParam ? `${appUrl}?claim=${startParam.replace(/^claim_/, '')}` : appUrl;

        await sendMessage(
          `🎉 *Добро пожаловать в GiftX!*\n\nCross-Marketing сеть подарочных сертификатов.\n\nПолучайте эксклюзивные подарки, бесплатные напитки и скидки в лучших заведениях города!`,
          [
            [{ text: '🎁 Открыть GiftX App', web_app: { url: targetUrl } }],
            [
              { text: '👛 Мои Ваучеры', web_app: { url: `${appUrl}?role=WALLET` } },
              { text: '📍 Карта Заведений', web_app: { url: `${appUrl}?role=MAP` } }
            ],
            [{ text: '⚙️ Панель Управляющего', web_app: { url: `${appUrl}?role=ADMIN` } }]
          ]
        );
      }

      // 2. Команда /wallet (Мои подарки прямо в чате бота)
      else if (text.startsWith('/wallet')) {
        const userWallet = await prisma.claimedVoucher.findMany({
          where: {
            user: { telegramId: BigInt(chatId) },
            status: 'ACTIVE'
          },
          include: { voucherOffer: { include: { partner: true } } },
          take: 5
        });

        if (userWallet.length === 0) {
          await sendMessage(
            `👛 *Ваш кошелек подарков пуст*\n\nПосещайте заведения-партнеры и сканируйте QR-коды у официантов, чтобы получать подарки!`,
            [[{ text: '📍 Посмотреть карту заведений', web_app: { url: appUrl } }]]
          );
        } else {
          let walletText = `🎁 *Ваши активные ваучеры (${userWallet.length}):*\n\n`;
          userWallet.forEach((v, index) => {
            walletText += `${index + 1}. *${v.voucherOffer.title}*\n`;
            walletText += `   🏢 Заведение: ${v.voucherOffer.partner.name}\n`;
            walletText += `   📍 Адрес: ${v.voucherOffer.partner.address}\n\n`;
          });

          await sendMessage(walletText, [
            [{ text: '📱 Показать QR для официанта в App', web_app: { url: appUrl } }]
          ]);
        }
      }

      // 3. Команда /map (Список заведений на карте)
      else if (text.startsWith('/map')) {
        const partners = await prisma.partner.findMany({ take: 5 });
        let mapText = `📍 *Лучшие заведения-партнеры GiftX:*\n\n`;
        partners.forEach((p, i) => {
          mapText += `${i + 1}. *${p.name}* (⭐️ ${(p.googleRating || 4.8).toFixed(1)})\n   📍 ${p.address}\n\n`;
        });

        await sendMessage(mapText, [
          [{ text: '🗺️ Открыть интерактивную карту', web_app: { url: `${appUrl}?role=MAP` } }]
        ]);
      }

      // 4. Команда /help (Инструкции)
      else if (text.startsWith('/help')) {
        await sendMessage(
          `ℹ️ *Инструкция GiftX*\n\n` +
          `**Для Гостей:**\n` +
          `1️⃣ Совершайте покупки в заведениях-партнерах.\n` +
          `2️⃣ Сканируйте QR-код официанта в чеке.\n` +
          `3️⃣ Открывайте подарочный HappyBox и получайте сертификат в другое заведение!\n\n` +
          `**Для Официантов & Персонала:**\n` +
          `Нажмите кнопку «Официант» в Mini App, чтобы генерировать QR-коды для гостей или гасить их ваучеры!`,
          [[{ text: '🚀 Запустить GiftX App', web_app: { url: appUrl } }]]
        );
      }
    }

    return res.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return res.json({ ok: true });
  }
});


