// ==========================================
// 1. ГЛОБАЛЬНЫЕ ТИПЫ И СТАТУСЫ
// ==========================================

export type BoxLevel = 'SILVER' | 'GOLD' | 'PLATINUM';

export type VoucherCategory = 
  | 'TRAFFIC_MAGNET' // Высокая частота, низкая стоимость (Кофе, десерт, шот)
  | 'LIFESTYLE'      // Средний чек (Скидка 15-20% на СПА, стрижку, ивент)
  | 'ANCHOR';        // Высокий чек, конкретная сумма (300k VND на депиляцию, аренда байка)

export type PartnerCategory = 
  | 'HORECA' 
  | 'BEAUTY_SPA' 
  | 'AUTO_MOTO' 
  | 'SERVICES' 
  | 'ENTERTAINMENT'
  | (string & {});

export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
  description?: string;
  workingHours?: string;
  category: PartnerCategory;
  logoUrl: string;
  coverUrl?: string;
  address: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  googleRating?: number;
  googleReviewsCount?: number;
  googleMapsUrl?: string;
  geoCoordinates?: { lat: number; lng: number };
  activeStatus?: boolean;
  moderationStatus?: ModerationStatus;
  rejectionReason?: string;
  ownerTelegramId?: number | string;
  balanceUsd?: number;
  costPerLeadUsd?: number;
  basicThreshold?: number;
  silverThreshold?: number;
  goldThreshold?: number;
  platinumThreshold?: number;
  boxThresholds?: {
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
  voucherOffers?: VoucherOffer[];
  staffMembers?: StaffMember[];
}

export interface StaffMember {
  id: string;
  partnerId: string;
  telegramId?: number;
  name: string;
  role: 'WAITER' | 'MANAGER' | 'OWNER' | 'SUPER_ADMIN';
  activeShiftsCount?: number;
  boxesIssuedCount: number;
  boxesIssuedToday?: number;
  boxesIssuedWeek?: number;
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
  targetBoxLevel?: BoxLevel; // Серебряный, Золотой, Платиновый VIP
  discountValue: string;  // "100%", "20%", "300,000 VND"
  imageUrl: string;
  validityHours: number;  // Время жизни после открытия бокса (3 дня / 72 часа)
  totalLimit: number;     // Лимит выставляемого количества подарков
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
