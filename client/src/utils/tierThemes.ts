export type BoxTier = 'SILVER' | 'GOLD' | 'PLATINUM';

export function getVoucherTier(voucher: any, defaultBoxLevel?: string): BoxTier {
  if (defaultBoxLevel === 'SILVER' || defaultBoxLevel === 'GOLD' || defaultBoxLevel === 'PLATINUM') {
    return defaultBoxLevel;
  }
  if (voucher?.boxLevel === 'SILVER' || voucher?.boxLevel === 'GOLD' || voucher?.boxLevel === 'PLATINUM') {
    return voucher.boxLevel;
  }
  if (voucher?.voucherOffer?.targetBoxLevel === 'SILVER' || voucher?.voucherOffer?.targetBoxLevel === 'GOLD' || voucher?.voucherOffer?.targetBoxLevel === 'PLATINUM') {
    return voucher.voucherOffer.targetBoxLevel;
  }

  const category = voucher?.voucherOffer?.category || voucher?.category;
  if (category === 'TRAFFIC_MAGNET') return 'SILVER';
  if (category === 'LIFESTYLE') return 'GOLD';
  if (category === 'ANCHOR') return 'PLATINUM';

  const title = (voucher?.voucherOffer?.title || voucher?.title || '').toLowerCase();
  if (title.includes('silver') || title.includes('коктейль') || title.includes('кофе') || title.includes('напиток')) return 'SILVER';
  if (title.includes('platinum') || title.includes('vip') || title.includes('аренда') || title.includes('спа') || title.includes('массаж')) return 'PLATINUM';

  return 'GOLD';
}

export interface TierTheme {
  name: BoxTier;
  badgeLabel: string;
  cardBg: string;
  border: string;
  selectedBorder: string;
  topBar: string;
  badgeBg: string;
  accentText: string;
  accentIcon: string;
  tagBg: string;
  backBg: string;
  backAccent: string;
  backBoxIcon: string;
  walletBadge: string;
}

export function getTierTheme(tier: BoxTier): TierTheme {
  if (tier === 'SILVER') {
    return {
      name: 'SILVER',
      badgeLabel: '🥈 SILVER',
      cardBg: 'bg-gradient-to-br from-slate-900 via-[#192634] to-[#0c1926]',
      border: 'border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      selectedBorder: 'border-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.55)] scale-[1.02]',
      topBar: 'bg-gradient-to-r from-cyan-400 to-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.8)]',
      badgeBg: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300',
      accentText: 'text-cyan-300 font-extrabold',
      accentIcon: 'text-cyan-400',
      tagBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
      backBg: 'bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-950 border-cyan-400/70 shadow-[0_0_35px_rgba(34,211,238,0.4)]',
      backAccent: 'border-cyan-500/30 text-cyan-300',
      backBoxIcon: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
      walletBadge: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
    };
  }

  if (tier === 'PLATINUM') {
    return {
      name: 'PLATINUM',
      badgeLabel: '💎 PLATINUM VIP',
      cardBg: 'bg-gradient-to-br from-[#1c0c30] via-[#140824] to-[#0d041a]',
      border: 'border-purple-400/60 shadow-[0_0_25px_rgba(192,132,252,0.25)]',
      selectedBorder: 'border-purple-300 shadow-[0_0_40px_rgba(192,132,252,0.6)] scale-[1.02]',
      topBar: 'bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-200 shadow-[0_0_15px_rgba(192,132,252,0.9)]',
      badgeBg: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
      accentText: 'text-purple-300 font-extrabold',
      accentIcon: 'text-purple-400',
      tagBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      backBg: 'bg-gradient-to-br from-purple-950 via-slate-950 to-slate-950 border-purple-400/80 shadow-[0_0_40px_rgba(192,132,252,0.5)]',
      backAccent: 'border-purple-500/30 text-purple-300',
      backBoxIcon: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
      walletBadge: 'bg-purple-500/20 border-purple-400/40 text-purple-300'
    };
  }

  // GOLD (Default)
  return {
    name: 'GOLD',
    badgeLabel: '🥇 GOLD',
    cardBg: 'bg-gradient-to-br from-[#261c0a] via-[#1c1406] to-[#120c02]',
    border: 'border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.25)]',
    selectedBorder: 'border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.6)] scale-[1.02]',
    topBar: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.9)]',
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
    accentText: 'text-amber-300 font-extrabold',
    accentIcon: 'text-amber-400',
    tagBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
    backBg: 'bg-gradient-to-br from-amber-950 via-slate-950 to-slate-950 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.5)]',
    backAccent: 'border-amber-500/30 text-amber-300',
    backBoxIcon: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
    walletBadge: 'bg-amber-500/20 border-amber-400/40 text-amber-300'
  };
}
