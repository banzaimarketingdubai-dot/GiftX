// ==========================================
// 1. ГЛОБАЛЬНЫЕ ТИПЫ И СТАТУСЫ
// ==========================================

export type BoxLevel = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type VoucherCategory = 
  | 'TRAFFIC_MAGNET' // Высокая частота, низкая стоимость (Кофе, десерт, шот)
  | 'LIFESTYLE'      // Средний чек (Скидка 15-20% на СПА, стрижку, ивент)
  | 'ANCHOR';        // Высокий чек, конкретная сумма (300k VND на депиляцию, аренда байка)

export type PartnerCategory = 'HORECA' | 'BEAUTY_SPA' | 'AUTO_MOTO' | 'SERVICES' | 'ENTERTAINMENT';

// ==========================================
// 2. СХЕМА ПОЛЬЗОВАТЕЛЕЙ И ПАРТНЕРОВ
// ==========================================

export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  createdAt: Date;
  wallet?: ClaimedVoucher[];
}

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  address: string;
  geoCoordinates?: { lat: number; lng: number };
  activeStatus: boolean;
  boxThresholds: {
    BASIC: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
}

export interface StaffMember {
  id: string;
  partnerId: string;
  telegramId?: number;
  name: string;
  role: 'WAITER' | 'MANAGER' | 'OWNER';
  activeShiftsCount: number;
  boxesIssuedCount: number;
  partner?: Partner;
}

// ==========================================
// 3. ВАУЧЕРЫ И БОКСЫ
// ==========================================

export interface VoucherOffer {
  id: string;
  partnerId: string;
  partner?: Partner;
  title: string;          // Например: "Бесплатный фирменный коктейль"
  description: string;    // Условия: "При заказе от 100k VND"
  category: VoucherCategory;
  discountValue: string;  // "100%", "20%", "300,000 VND"
  imageUrl: string;
  validityHours: number;  // Время жизни после открытия бокса (напр. 48 часов)
  totalLimit: number;     // Общий лимит выдач
  claimedCount: number;
}

export interface ClaimedVoucher {
  id: string;
  userId: string;
  voucherOfferId: string;
  voucherOffer?: VoucherOffer;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  claimedAt: Date;
  expiresAt: Date;
  redeemedAt?: Date;
  qrCodeSecret: string; // Уникальный токен для гашения в заведении
}

// ==========================================
// 4. ANTI-FRAUD СИСТЕМА (ТОКЕНЫ ОФИЦИАНТОВ)
// ==========================================

export interface StaffIssuanceToken {
  token: string;          // UUID или токен
  staffId: string;
  partnerId: string;
  boxLevel: BoxLevel;
  checkAmount?: number;   // Опциональная сумма чека
  createdAt: Date;
  expiresAt: Date;        // Срок жизни ровно 3 минуты (180s)
  isUsed: boolean;
  claimedByUserId?: string;
}
