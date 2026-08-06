export interface FunnelMessageDefinition {
  topic: string;
  points: string;
  visual: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface FunnelTrackPlan {
  [dayKey: string]: FunnelMessageDefinition;
}

export interface MasterFunnelPlan {
  welcome: {
    text: string;
    buttons: Array<{ text: string; path: 'b2c' | 'b2b' }>;
    visual: string;
  };
  b2c: FunnelTrackPlan;
  b2b: FunnelTrackPlan;
}

export const TONE_OF_VOICE = {
  B2C: `Tone of Voice: Friendly, energetic, visual, game-like (gamified), highly enthusiastic. Emphasize "Free Gifts", "Fun", "City Discovery", "Instant Rewards", and "Surprises". Use vibrant emojis.`,
  B2B: `Tone of Voice: Professional, confident, executive, profit-oriented, direct. Emphasize "Business Growth", "Zero Cost", "Zero Integration Stress", "Attracting Solvent Clients", and "Cross-Marketing Automation". Use clean corporate emojis.`
};

export const masterFunnelPlan: MasterFunnelPlan = {
  welcome: {
    text: `👋 Welcome to GiftX Vietnam! The ultimate city reward & cross-marketing system.\n\nChoose who you are to start your personal journey:`,
    buttons: [
      { text: "🎁 Я Гость (Хочу подарки!)", path: "b2c" },
      { text: "💼 У меня бизнес во Вьетнаме", path: "b2b" }
    ],
    visual: "A high-end 3D render of a black titanium GiftX mystery box pulsating with golden light and neon cyber-blue energy, floating in a clean luxury dark space with glowing particles."
  },
  b2c: {
    day1_1: {
      topic: "Your first gift is here!",
      points: "Welcome the user, explain how to scan QR codes in partner venues to unlock instant mystery boxes, provide welcome bonus details.",
      visual: "3D render of a premium black titanium GiftX box partially open, emitting powerful golden light, isolated on dark background.",
      ctaText: "🚀 Open App & Get Bonus",
      ctaUrl: "https://t.me/GiftXVietnamBot/app"
    },
    day1_2: {
      topic: "Box Levels explained: Silver, Gold, Platinum.",
      points: "Explain receipt threshold levels: Silver (300k+), Gold (600k+), Platinum (1M+). Higher level = rarer rewards and higher value vouchers.",
      visual: "Three floating isometric 3D gift boxes: Silver aluminum, Gold titanium, and Dark Platinum, each with glowing neon X-logos.",
      ctaText: "📊 View Box Thresholds"
    },
    day2_1: {
      topic: "How to claim free coffee & cocktails in your city.",
      points: "Highlight local partner cafes and bars. Show how easy it is to redeem traffic magnet vouchers with 1-tap in your digital wallet.",
      visual: "3D frosted glass tropical cocktail with glowing golden reward stars and floating mini voucher cards around it.",
      ctaText: "☕ Find Nearby Cafes"
    },
    day2_2: {
      topic: "Discovering neighboring spots without direct ads.",
      points: "Explain how GiftX introduces users to top-rated spa, massage, and dining spots in Nha Trang / Da Nang / Phu Quoc.",
      visual: "3D isometric map of a coastal city with glowing green location pins and gift box icons hovering above venues.",
      ctaText: "🗺️ Explore Partner Map"
    },
    day3_1: {
      topic: "The Gamified Lootbox opening experience.",
      points: "Describe the 3-tap physical haptic unpacking experience. 3 taps reveal 5 curated voucher cards tailored to your lifestyle.",
      visual: "3D exploding mystery box with floating golden voucher cards fanning out in a sleek arc, with golden sparkles.",
      ctaText: "🎁 Try Demo Unpacking"
    },
    day3_2: {
      topic: "Partner Spotlight: Premium Spa & Wellness.",
      points: "Introduce high-value lifestyle vouchers: 300,000 VND spa certificates and massage upgrades available in Gold boxes.",
      visual: "3D luxury spa hot stones and orchid flower with a glowing translucent VIP gold voucher tag attached.",
      ctaText: "💆 View Spa Offers"
    },
    day4_1: {
      topic: "Multiply rewards with Friend Referral.",
      points: "Invite friends to GiftX! Every friend who scans their first receipt grants you both a bonus Silver Box.",
      visual: "3D neon connected user nodes forming a glowing gift chain with floating gift icons moving between avatars.",
      ctaText: "👥 Invite Friends"
    },
    day4_2: {
      topic: "Limited-time Anchor Gifts.",
      points: "Explain 48-hour expiration timers on high-value vouchers to encourage immediate fun visits before gifts expire.",
      visual: "3D golden clock ticking gracefully over a sleek black VIP gift box, emitting gentle smoke and glowing digits.",
      ctaText: "⏰ Check Wallet Timers"
    },
    day5_1: {
      topic: "Secret Weekend Drops!",
      points: "Announce exclusive weekend bonus drops for active GiftX users at anchor entertainment & beach club partners.",
      visual: "3D floating glowing purple treasure chest opening over a stylized beach palm leaf background with neon lighting.",
      ctaText: "🔥 Join Weekend Drop"
    },
    day5_2: {
      topic: "Reviewing your savings & redeemed gifts history.",
      points: "Show how much money users save every month using GiftX cross-vouchers across food, wellness, and transport.",
      visual: "3D digital futuristic wallet showing green checkmarks, golden coin stacks, and total savings tally.",
      ctaText: "💰 View Total Savings"
    },
    day6_1: {
      topic: "Becoming a GiftX Ambassador.",
      points: "Unlock super-user privileges: priority box upgrades, exclusive restaurant invitations, and VIP badge status.",
      visual: "3D golden badge with a diamond crown and neon X emblem render on polished dark marble background.",
      ctaText: "👑 Upgrade to Ambassador"
    },
    day6_2: {
      topic: "VIP Platinum Status preview.",
      points: "Summarize the 6-day journey. Encourage users to keep scanning at partner venues to maintain Platinum status benefits.",
      visual: "3D ultra-sleek dark platinum card with glowing gold edges floating over holographic city lights.",
      ctaText: "🌟 Open GiftX Main App"
    }
  },
  b2b: {
    day1_1: {
      topic: "Welcome Partner! Zero-cost client acquisition network.",
      points: "Introduce GiftX as a revolutionary B2B cross-marketing ecosystem in Vietnam. No POS integration needed, zero commission fees.",
      visual: "Handshake of two professional hands in a luxurious office setting, with subtle transparent hologram of GiftX box above them.",
      ctaText: "💼 Connect My Business"
    },
    day1_2: {
      topic: "No integration stress: Waiters use 1-tap web app.",
      points: "Explain how staff generate dynamic receipt QR codes in 3 seconds flat. No hardware to buy, works on any smartphone.",
      visual: "3D smartphone mockup displaying waiter interface with 3 large high-contrast box issuance buttons.",
      ctaText: "📱 See Waiter Demo"
    },
    day2_1: {
      topic: "Monetize quiet hours & fill empty tables.",
      points: "Use Traffic Magnet vouchers to drive paying guests during low-traffic afternoon shifts without degrading your brand price.",
      visual: "3D glowing hourglass with falling gold coins inside a elegant restaurant dining room layout.",
      ctaText: "📈 Boost Low Shift Traffic"
    },
    day2_2: {
      topic: "Cross-marketing non-competing local businesses.",
      points: "HoReCa venue guests receive Spa & Activity vouchers; Spa clients receive Dining vouchers. Pure synergy without competitors.",
      visual: "3D interlocking gear rings connecting HoReCa coffee cup and Spa lotus flower icons with glowing blue energy.",
      ctaText: "🤝 View Synergy Categories"
    },
    day3_1: {
      topic: "Motivating waiters & boosting check size.",
      points: "Staff earn shift points and bonuses for issuing boxes. Guests spend more to reach Gold/Platinum box receipt thresholds.",
      visual: "3D waiter holding a glowing digital tray with star badges floating above and green sales trend arrows.",
      ctaText: "🌟 Staff Motivation Program"
    },
    day3_2: {
      topic: "Real-Time Partner Analytics Dashboard.",
      points: "Track exact foot traffic, voucher issuance count, redemption rate, and ROI live from your partner portal.",
      visual: "3D translucent glass bar chart with rising blue trends and glowing numbers on a dark corporate background.",
      ctaText: "📊 Open Partner Portal"
    },
    day4_1: {
      topic: "Customer Lifetime Value & repeat visit multiplier.",
      points: "Vouchers bring new solvent tourists and expats straight to your door. Turn one-time visitors into loyal recurring clients.",
      visual: "3D magnetic horseshoe attracting golden user avatars into a glowing storefront door.",
      ctaText: "🎯 Calculate Your Client ROI"
    },
    day4_2: {
      topic: "Anti-Fraud Architecture & 180s Dynamic Tokens.",
      points: "Every issuance QR code expires strictly after 3 minutes and single scan, preventing staff cheating or duplicated claims.",
      visual: "3D cyber shield protecting a glowing neon QR code with a 3-minute countdown timer overlay.",
      ctaText: "🛡️ Anti-Fraud Details"
    },
    day5_1: {
      topic: "Case Study: +35% tourist foot traffic in Da Nang / Nha Trang.",
      points: "Real partner case study: How a local steakhouse expanded revenue by partnering with 8 nearby boutique hotels & spas.",
      visual: "3D modern restaurant storefront with a happy crowd outside and golden percentage badges (+35%).",
      ctaText: "📄 Read Full Case Study"
    },
    day5_2: {
      topic: "VIP Partner Network Privileges.",
      points: "Access executive networking dinners, co-branding marketing campaigns, and priority placement in the GiftX catalog.",
      visual: "3D golden key unlocking a premium business lounge door with warm architectural lighting.",
      ctaText: "🗝️ Join VIP Network"
    },
    day6_1: {
      topic: "Onboarding your staff in 5 minutes flat.",
      points: "Simple 3-step staff onboarding: Add staff Telegram ID ➔ Select venue ➔ Start issuing boxes instantly.",
      visual: "3D quick setup wizard checklist floating over a tablet screen with green completion checkmarks.",
      ctaText: "⚡ Quick Staff Setup"
    },
    day6_2: {
      topic: "Claim your launch promo package for businesses.",
      points: "First 50 verified partner venues in Vietnam receive 1,000 free voucher distribution slots and priority map placement.",
      visual: "3D metallic gold ribbon wrapped around a glowing rocket launchpad with GiftX logo glowing on the rocket.",
      ctaText: "🚀 Claim Partner Promo"
    }
  }
};
