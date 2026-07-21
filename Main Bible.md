Этот документ представляет собой \*\*Мастер-Спецификацию и Инженерный Промпт-Пак (System Blueprint)\*\* для передачи автономному ИИ-агенту в среде разработки (Google Project IDX, Cursor, Antigravity и др.).



Он составлен таким образом, чтобы ИИ-агент получил полный контекст: от бизнес-логики и дизайна до типов данных и пошагового плана спринтов.



\---



\# 🤖 МАСТЕР-ПРОМПТ ДЛЯ ИИ-АГЕНТА: ПРОЕКТ "GiftX"



> \*\*Инструкция для пользователя:\*\* Скопируй блок ниже (начиная со слов «ТВОЯ РОЛЬ И ЗАДАЧА») и вставь его в качестве системного промпта (System Prompt) или первого сообщения твоему ИИ-разработчику.



```text

ТВОЯ РОЛЬ И ЗАДАЧА:

Ты — Senior Full-Stack разработчик, Архитектор ПО и Моушн-дизайнер с глубокой экспертизой в разработке Telegram Mini Apps (TMA). Твоя задача — с нуля написать, протестировать и развернуть полноценное приложение "HappyBox" на основе предоставленной ниже технической спецификации.



ПРАВИЛА РАБОТЫ:

1\. Пиши чистый, строго типизированный код (TypeScript).

2\. Двигайся итеративно: реализуй архитектуру шаг за шагом согласно "Плану Спринтов" в конце документа. Не пытайся сгенерировать всё приложение в одном файле.

3\. Следуй принципу Mobile-First и оптимизируй вес фронтенда для мгновенной загрузки в Telegram.



```



\---



\## РАЗДЕЛ 1. ГЛОБАЛЬНАЯ АРХИТЕКТУРА И ТЕХНИЧЕСКИЙ СТЕК



\### 1.1 Концепция продукта



\*\*HappyBox\*\* — это геймифицированная B2B2C-платформа кросс-маркетинга в Telegram Mini Apps.



\* \*\*Суть:\*\* Локальные бизнесы (HoReCa, СПА, прокат) обмениваются платежеспособной аудиторией без пересечения прямых конкурентов и без интеграции с кассовыми аппаратами.

\* \*\*Механика:\*\* Официант генерирует одноразовый динамический QR-код в зависимости от суммы чека гостя. Гость сканирует код и получает в Telegram интерактивный лутбокс (HappyBox) с пакетом подарков от других заведений города.



\### 1.2 Рекомендуемый Технический Стек



\* \*\*Frontend:\*\* React 18, Vite, TypeScript, Tailwind CSS.

\* \*\*Анимации и UI:\*\* Framer Motion (для физики распаковки), Lucide React (иконки).

\* \*\*Telegram Integration:\*\* `@twa-dev/sdk` (Telegram WebApp API: Taptic Engine, MainButton, WebApp user data).

\* \*\*Backend / API:\*\* Node.js, Express (или NestJS), TypeScript, JWT (для валидации токенов официанта).

\* \*\*Database \& ORM:\*\* PostgreSQL, Prisma ORM (или Drizzle).

\* \*\*State Management:\*\* Zustand (для управления состоянием кошелька и сессии).



\---



\## РАЗДЕЛ 2. БАЗА ДАННЫХ И СТРОГАЯ ТИПИЗАЦИЯ (TYPESCRIPT INTERFACES)



ИИ-агент должен использовать эту схему данных как единый источник правды (Single Source of Truth) для фронтенда и бэкенда:



```typescript

// ==========================================

// 1. ГЛОБАЛЬНЫЕ ТИПЫ И СТАТУСЫ

// ==========================================



export type BoxLevel = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';



export type VoucherCategory = 

&#x20; | 'TRAFFIC\_MAGNET' // Высокая частота, низкая стоимость (Кофе, десерт, шот)

&#x20; | 'LIFESTYLE'      // Средний чек (Скидка 15-20% на СПА, стрижку, ивент)

&#x20; | 'ANCHOR';        // Высокий чек, конкретная сумма (300k VND на депиляцию, аренда байка)



export type PartnerCategory = 'HORECA' | 'BEAUTY\_SPA' | 'AUTO\_MOTO' | 'SERVICES' | 'ENTERTAINMENT';



// ==========================================

// 2. СХЕМА ПОЛЬЗОВАТЕЛЕЙ И ПАРТНЕРОВ

// ==========================================



export interface User {

&#x20; id: string;

&#x20; telegramId: number;

&#x20; username?: string;

&#x20; firstName: string;

&#x20; lastName?: string;

&#x20; createdAt: Date;

&#x20; wallet: ClaimedVoucher\[];

}



export interface Partner {

&#x20; id: string;

&#x20; name: string;

&#x20; category: PartnerCategory;

&#x20; logoUrl: string;

&#x20; address: string;

&#x20; geoCoordinates: { lat: number; lng: number };

&#x20; activeStatus: boolean;

&#x20; // Пороги чеков в местной валюте для выдачи боксов

&#x20; boxThresholds: {

&#x20;   BASIC: number;

&#x20;   SILVER: number;

&#x20;   GOLD: number;

&#x20;   PLATINUM: number;

&#x20; };

}



export interface StaffMember {

&#x20; id: string;

&#x20; partnerId: string;

&#x20; telegramId: number;

&#x20; name: string;

&#x20; role: 'WAITER' | 'MANAGER' | 'OWNER';

&#x20; activeShiftsCount: number;

&#x20; boxesIssuedCount: number;

}



// ==========================================

// 3. ВАУЧЕРЫ И БОКСЫ

// ==========================================



export interface VoucherOffer {

&#x20; id: string;

&#x20; partnerId: string;

&#x20; title: string;          // Например: "Бесплатный фирменный коктейль"

&#x20; description: string;    // Условия: "При заказе от 100k VND"

&#x20; category: VoucherCategory;

&#x20; discountValue: string;  // "100%", "20%", "300,000 VND"

&#x20; imageUrl: string;

&#x20; validityHours: number;  // Время жизни после открытия бокса (напр. 48 часов)

&#x20; totalLimit: number;     // Общий лимит выдач

&#x20; claimedCount: number;

}



export interface ClaimedVoucher {

&#x20; id: string;

&#x20; userId: string;

&#x20; voucherOfferId: string;

&#x20; voucherOffer?: VoucherOffer; // Populated data

&#x20; status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';

&#x20; claimedAt: Date;

&#x20; expiresAt: Date;

&#x20; redeemedAt?: Date;

&#x20; qrCodeSecret: string; // Уникальный токен для гашения в заведении

}



// ==========================================

// 4. ANTI-FRAUD СИСТЕМА (ТОКЕНЫ ОФИЦИАНТОВ)

// ==========================================



export interface StaffIssuanceToken {

&#x20; token: string;          // UUID или JWT

&#x20; staffId: string;

&#x20; partnerId: string;

&#x20; boxLevel: BoxLevel;

&#x20; checkAmount?: number;   // Опциональная сумма чека

&#x20; createdAt: Date;

&#x20; expiresAt: Date;        // Срок жизни ровно 3 минуты!

&#x20; isUsed: boolean;

}



```



\---



\## РАЗДЕЛ 3. ПУТИ КЛИЕНТА И ПЕРСОНАЛА (USER JOURNEY MAPS)



\### 3.1 B2B-Контур: Экран Персонала (Режим Официанта)



Интерфейс должен быть максимально контрастным, с крупными элементами для работы на ходу в шумном зале.



```

+--------------------------------------------------+

| 📍 \[Название Заведения]          👤 @waiter\_name |

| 🟢 Статус: На смене       📊 Выдано сегодня: 12  |

+--------------------------------------------------+

|                                                  |

|  +--------------------------------------------+  |

|  |           🎁 ВЫДАТЬ БАЗОВЫЙ БОКС           |  |

|  |              (Чек до 299k VND)             |  |

|  +--------------------------------------------+  |

|                                                  |

|  +--------------------------------------------+  |

|  |          🥈 ВЫДАТЬ СЕРЕБРЯНЫЙ БОКС         |  |

|  |            (Чек: 300k - 599k VND)          |  |

|  +--------------------------------------------+  |

|                                                  |

|  +--------------------------------------------+  |

|  |           🥇 ВЫДАТЬ ЗОЛОТОЙ БОКС           |  |

|  |             (Чек от 600k VND)              |  |

|  +--------------------------------------------+  |

|                                                  |

+--------------------------------------------------+



```



\* \*\*Шаг 1 (Клик):\*\* Официант нажимает кнопку соответствующего бокса.

\* \*\*Шаг 2 (API Request):\*\* Фронтенд запрашивает у бэкенда `StaffIssuanceToken`. Бэкенд генерирует токен со сроком жизни \*\*180 секунд\*\* и записывает его в БД с флагом `isUsed: false`.

\* \*\*Шаг 3 (Экран QR):\*\* На экране появляется крупный QR-код (ведет на `\[https://t.me/HappyBoxApp/app?startapp=claim](https://t.me/HappyBoxApp/app?startapp=claim)\_{token}`). Вверху экрана тикает обратный отсчет: `02:59`, `02:58`...

\* \*\*Шаг 4 (Успех):\*\* Как только гость отсканировал код, через WebSockets или Polling (раз в 2 сек) экран официанта меняется на зеленый: \*\*«🎉 Бокс успешно вручен гостю \[Имя]!»\*\*.



\### 3.2 B2C-Контур: Экран Гостя (Распаковка и Кошелек)



\* \*\*Шаг 1 (Вход):\*\* Гость сканирует QR-код. Открывается Telegram Mini App.

\* \*\*Шаг 2 (Валидация):\*\* Бэкенд проверяет токен:

\* Если токен истек (> 3 мин) или `isUsed === true` -> Экран ошибки: \*«Этот код уже использован или истек. Попросите официанта сгенерировать новый»\*.

\* Если токен валиден -> Токен помечается как `isUsed: true`. Работает алгоритм матчинга.





\* \*\*Шаг 3 (Алгоритм Матчинга):\*\*

\* Бэкенд определяет `PartnerCategory` заведения, выдавшего бокс (например, `HORECA`).

\* Из БД выбираются активные ваучеры в радиусе 5 км, \*\*исключая категорию `HORECA\*\*` (никаких конкурентов!).

\* Для Золотого Бокса отбираются ровно 5 ваучеров: `2x TRAFFIC\_MAGNET` + `2x LIFESTYLE` + `1x ANCHOR`.





\* \*\*Шаг 4 (Интерактивная Распаковка):\*\*

\* На экране появляется 3D-коробка с пульсирующим свечением.

\* Гость тангет (нажимает) на коробку 3 раза. На каждый тап срабатывает тактильная отдача телефона (`Telegram.WebApp.HapticFeedback.impactOccurred('medium')`).

\* На 3-й тап — анимация взрыва и веерный вылет 5 карточек-ваучеров.





\* \*\*Шаг 5 (Кошелек "Мои Подарки"):\*\*

\* Карточки сохраняются в кошелек. На каждой виден таймер обратного отсчета: `⏳ Сгорит через: 47ч 12м`.

\* При визите к партнеру гость открывает карточку и нажимает \*\*\[ Использовать подарок ]\*\*. Администратор заведения подтверждает списание нажатием на экране (или вводом 4-значного PIN-кода точки).







\---



\## РАЗДЕЛ 4. ПРОМПТЫ ДЛЯ ГЕНЕРАЦИИ ГРАФИКИ И АССЕТОВ



ИИ-агент должен использовать эти инструкции и тексты для генерации визуальных ассетов (через интеграцию с Midjourney / DALL-E / Stable Diffusion или для постановки ТЗ дизайнеру).



\### 4.1 Промпты для 3D Иконок Боксов (Изометрия, UI Assets)



\#### 🎁 Золотой Бокс (Gold Box - Для чеков от 600k VND)



```text

A premium 3D mystery gift box for a luxury mobile app UI, isometric view, made of matte black titanium with polished gold edges and glowing golden accents. The lid is slightly opened, with a magical, warm volumetric golden light emitting from inside the box. Small glowing golden dust particles floating around. Clean dark minimalist background, professional UI/UX icon asset, Octane Render, Unreal Engine 5, ray tracing, studio rim lighting, hyper-detailed, 8k resolution --ar 1:1 --v 6.0 --style raw



```



\#### 🥈 Серебряный Бокс (Silver Box - Для чеков от 300k VND)



```text

3D isometric loot box icon for a mobile app UI, made of sleek brushed silver aluminum and polished chrome, with subtle cyan and ice-blue neon glowing seams. The box is slightly open, emitting a cool, crisp cyber-blue volumetric light from inside. Floating holographic dust particles. Modern, futuristic, clean UI asset, rendered in Blender, Octane Render, sharp reflections, dark void background, 8k resolution --ar 1:1 --v 6.0



```



\#### 📦 Базовый Бокс (Basic Box - Для чеков до 299k VND)



```text

3D isometric gift box icon for mobile app UI, made of high-end smooth matte purple polycarbonate with vibrant orange glowing LED strips along the edges. Energetic, playful and friendly design, slightly cracked open with warm ambient light spilling out. Claymorphism and glassmorphism blend, clean studio lighting, dark background, 8k resolution --ar 1:1 --v 6.0



```



\### 4.2 Промпт для Премиум-Карточек Ваучеров (Voucher Cards)



```text

Sleek VIP membership credit card UI design for a mobile loyalty app, horizontal orientation, made of dark brushed carbon fiber and matte obsidian, with thin glowing gold geometric lines. Minimalist layout, typography placeholders for discount value and brand logo. Futuristic luxury aesthetic, 3D render, studio lighting, hyper-realistic, 8k resolution --ar 16:9 --v 6.0



```



\### 4.3 Спецификация для Моушн-Анимации (Framer Motion / CSS)



ИИ-агент обязан реализовать анимацию распаковки на фронтенде по следующим физическим параметрам:



| Фаза анимации | Длительность | Физика / Easing (Framer Motion) | Поведение UI-элементов |

| --- | --- | --- | --- |

| \*\*1. Замах (Anticipation)\*\* | 0.3s | `scale: \[1, 0.9, 1.05]`, `transition: { duration: 0.3, ease: "easeInOut" }` | При клике коробка сжимается вниз, пульсирует свечение. Срабатывает `HapticFeedback (light)`. |

| \*\*2. Взрыв (The Burst)\*\* | 0.2s | `y: -50`, `opacity: \[1, 0]`, `ease: "easeOut"` | Крышка коробки отлетает вверх с поворотом. Срабатывает `HapticFeedback (heavy)`. Вылетают частицы конфетти (CSS/Canvas). |

| \*\*3. Веерный Вылет (Card Spread)\*\* | 0.6s | `staggerChildren: 0.1`, `type: "spring", stiffness: 100, damping: 12` | 5 карточек ваучеров вылетают из центра по дуге Бетье, распределяясь веером от -30° до +30° относительно центральной оси. |

| \*\*4. Левитация (Idle Floating)\*\* | Бесконечно | `y: \[0, -6, 0]`, `transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }` | Раскрытые карточки плавно покачиваются в невесомости в ожидании клика пользователя. |



\---



\## РАЗДЕЛ 5. ПОШАГОВЫЙ ПЛАН ВЫПОЛНЕНИЯ (ROADMAPPED SPRINTS ДЛЯ ИИ-АГЕНТА)



ИИ-агент должен выполнять разработку строго последовательно по этим 4 спринтам:



1\. \*\*Спринт 1: Инициализация и БД:\*\* Базовый каркас.

1\. Инициализировать проект на React + Vite + Tailwind + TypeScript.

2\. Настроить Express/Node.js бэкенд с подключением к PostgreSQL.

3\. Создать схемы данных по TS-интерфейсам из Раздела 2 (через Prisma/Drizzle).

4\. Настроить базовую авторизацию через Telegram WebApp InitData (валидация хэша).





2\. \*\*Спринт 2: Anti-Fraud и Экран Официанта:\*\* B2B-Контур и Безопасность.

1\. Написать API для генерации одноразового `StaffIssuanceToken` с TTL = 180 секунд.

2\. Сверстать B2B-экран официанта с 3 кнопками боксов.

3\. Реализовать генератор QR-кодов на клиенте (`qrcode.react`) с живым обратным отсчетом таймера на 3 минуты.

4\. Настроить polling/вебсокет для автоматического переключения экрана официанта при успешном сканировании.





3\. \*\*Спринт 3: Алгоритм Матчинга и Анимация:\*\* B2C-Контур и Визуал.

1\. Написать бэкенд-алгоритм фильтрации ваучеров (исключение категории партнера-донора + сборка микса 2+2+1).

2\. Сверстать экран B2C-гостя: прием токена из URL, проверка его валидности в БД.

3\. Реализовать 3D-распаковку бокса на Framer Motion в точном соответствии с таблицей из Раздела 4.3.

4\. Создать кошелек "Мои Подарки" с тикающими таймерами сгорания (`setInterval` обратного отсчета).





4\. \*\*Спринт 4: Telegram SDK и Гашение Ваучеров:\*\* Продакшн.

1\. Подключить тактильную отдачу (`HapticFeedback`) на все клики, открытие бокса и успешные действия.

2\. Реализовать экран гашения ваучера (админ салона вводит 4-значный PIN-код или сканирует код клиента для смены статуса на `REDEEMED`).

3\. Провести финальный рефакторинг, обработку ошибок (Error Boundaries) и оптимизировать размер бандла для продакшн-деплоя.





\---



\## РАЗДЕЛ 6. КРИТИЧЕСКИЕ БИЗНЕС-ПРАВИЛА ДЛЯ ДЕБАГА



ИИ-агент обязан встроить следующие проверки в бизнес-логику бэкенда:



1\. \*\*Правило изоляции конкурентов:\*\* При запросе `SELECT` для сборки бокса \*\*КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО\*\* включать ваучеры от заведений с `PartnerCategory`, совпадающей с категорией заведения, выдавшего бокс.

2\. \*\*Правило одноразовости токена:\*\* В транзакции активации бокса сначала ставить блок на строку токена (`SELECT ... FOR UPDATE`), проверять `isUsed === false` и `expiresAt > NOW()`, менять на `isUsed = true`, и только после этого выдавать ваучеры.

3\. \*\*Правило лимитов:\*\* Не выдавать ваучер, если `claimedCount >= totalLimit`. В этом случае алгоритм должен брать следующий доступный ваучер в той же категории (`TRAFFIC\_MAGNET`, `LIFESTYLE` или `ANCHOR`).



\---

