export type BoxLevel = 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';

export type VoucherCategory = 'TRAFFIC_MAGNET' | 'LIFESTYLE' | 'ANCHOR';

export type PartnerCategory = 'HORECA' | 'BEAUTY_SPA' | 'AUTO_MOTO' | 'SERVICES' | 'ENTERTAINMENT';

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  logoUrl: string;
  address: string;
  activeStatus: boolean;
}

export interface StaffMember {
  id: string;
  partnerId: string;
  name: string;
  role: 'WAITER' | 'MANAGER' | 'OWNER';
  activeShiftsCount: number;
  boxesIssuedCount: number;
  partner?: Partner;
}

export interface VoucherOffer {
  id: string;
  partnerId: string;
  partner?: Partner;
  title: string;
  description: string;
  category: VoucherCategory;
  discountValue: string;
  imageUrl: string;
  validityHours: number;
  totalLimit: number;
  claimedCount: number;
}

export interface ClaimedVoucher {
  id: string;
  userId: string;
  voucherOfferId: string;
  voucherOffer?: VoucherOffer;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
  claimedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  qrCodeSecret: string;
}
