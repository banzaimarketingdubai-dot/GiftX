// ==========================================
// БИБЛИОТЕКА СТОКОВЫХ ИЗОБРАЖЕНИЙ GIFTX
// Стоковые фото высокого качества под каждый вид подарка и категорию заведения
// ==========================================

export const STOCK_IMAGES = {
  // 🎁 1. Стоковые изображения под типы и виды ПОДАРКОВ
  vouchers: {
    TRAFFIC_MAGNET: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80', // Бесплатный приветственный напиток / коктейль
    LIFESTYLE: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',      // Массаж стоп / Релакс SPA
    ANCHOR: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',         // Аренда байка / Сертификат 300k VND
    COCKTAIL: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',       // Коктейль на закате
    SPA: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80',            // SPA комплексы
    MOTO: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80',           // Скоростной байк Honda
    DIVING: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80',         // Сноркелинг & Яхты
    DINNER: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',         // Гастрономический ужин
    DEFAULT: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80',        // Праздничный 3D подарок
  },

  // 🏬 2. Стоковые изображения под категории ЗАВЕДЕНИЙ (Аватар)
  venues: {
    HORECA: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',        // Sunset Beach Club & Рестораны
    BEAUTY_SPA: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80',    // Lotus Wellness & Spa
    AUTO_MOTO: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&q=80',     // Island Moto & Buggy Rental
    ENTERTAINMENT: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', // Deep Blue Diving Center
    SERVICES: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80',      // Услуги и Консьерж
    FITNESS: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',       // Фитнес & Спорт
    DEFAULT: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',       // Атмосферное заведение
  },

  // 🖼️ 3. Фоновые изображения по умолчанию для шапки заведений
  covers: {
    HORECA: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    BEAUTY_SPA: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80',
    AUTO_MOTO: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80',
    ENTERTAINMENT: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    SERVICES: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80',
    DEFAULT: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
  }
};

/**
 * Извлекает 1-2 буквы (инициалы) из названия заведения
 */
export const getVenueInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'GX';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
};

/**
 * Возвращает фоновое изображение по умолчанию для заведения
 */
export const getVenueCoverImage = (coverUrl?: string, category?: string): string => {
  if (coverUrl && coverUrl.trim().length > 5 && !coverUrl.includes('placeholder')) {
    return coverUrl;
  }
  if (category && (STOCK_IMAGES.covers as any)[category]) {
    return (STOCK_IMAGES.covers as any)[category];
  }
  return STOCK_IMAGES.covers.DEFAULT;
};

/**
 * Возвращает изображение ваучера с автоматическим переходом на сток при отсутствии фото
 */
export const getVoucherImage = (imageUrl?: string, category?: string): string => {
  if (imageUrl && imageUrl.trim().length > 5 && !imageUrl.includes('placeholder')) {
    return imageUrl;
  }
  if (category && (STOCK_IMAGES.vouchers as any)[category]) {
    return (STOCK_IMAGES.vouchers as any)[category];
  }
  return STOCK_IMAGES.vouchers.DEFAULT;
};

/**
 * Возвращает изображение заведения (из профиля Google Maps или стоковой библиотеки)
 */
export const getVenueImage = (logoUrl?: string, category?: string): string => {
  if (logoUrl && logoUrl.trim().length > 5 && !logoUrl.includes('placeholder')) {
    return logoUrl;
  }
  if (category && (STOCK_IMAGES.venues as any)[category]) {
    return (STOCK_IMAGES.venues as any)[category];
  }
  return STOCK_IMAGES.venues.DEFAULT;
};
