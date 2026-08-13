import { PrismaClient, PartnerCategory, VoucherCategory, StaffRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем сидирование базы данных HappyBox...');

  // Очистка старых данных
  await prisma.claimedVoucher.deleteMany({});
  await prisma.staffIssuanceToken.deleteMany({});
  await prisma.voucherOffer.deleteMany({});
  await prisma.staffMember.deleteMany({});
  await prisma.partner.deleteMany({});

  // 1. Создаем партнеров
  const barBeach = await prisma.partner.create({
    data: {
      name: 'Sunset Beach Club',
      category: PartnerCategory.HORECA,
      logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&q=80',
      address: 'Phu Quoc, Long Beach, St 4',
      lat: 10.1982,
      lng: 103.9634,
      googleRating: 4.8,
      googleReviewsCount: 342,
      googleMapsUrl: 'https://maps.google.com/?q=Sunset+Beach+Club+Phu+Quoc',
      activeStatus: true,
      basicThreshold: 0,
      silverThreshold: 300000,
      goldThreshold: 600000,
      platinumThreshold: 1200000
    }
  });

  const spaLuxury = await prisma.partner.create({
    data: {
      name: 'Lotus Wellness & Spa',
      category: PartnerCategory.BEAUTY_SPA,
      logoUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=200&q=80',
      address: 'Phu Quoc, Duong Dong, Main Rd 12',
      lat: 10.2175,
      lng: 103.9592,
      googleRating: 4.9,
      googleReviewsCount: 215,
      googleMapsUrl: 'https://maps.google.com/?q=Lotus+Wellness+Spa+Phu+Quoc',
      activeStatus: true,
      basicThreshold: 0,
      silverThreshold: 300000,
      goldThreshold: 600000,
      platinumThreshold: 1000000
    }
  });

  const motoRental = await prisma.partner.create({
    data: {
      name: 'Island Moto & Buggy Rental',
      category: PartnerCategory.AUTO_MOTO,
      logoUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&q=80',
      address: 'Phu Quoc, An Thoi Town',
      lat: 10.0321,
      lng: 104.0152,
      googleRating: 4.7,
      googleReviewsCount: 189,
      googleMapsUrl: 'https://maps.google.com/?q=Island+Moto+Rental+Phu+Quoc',
      activeStatus: true,
      basicThreshold: 0,
      silverThreshold: 300000,
      goldThreshold: 600000,
      platinumThreshold: 1000000
    }
  });

  const divingCenter = await prisma.partner.create({
    data: {
      name: 'Deep Blue Diving & Snorkeling',
      category: PartnerCategory.ENTERTAINMENT,
      logoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80',
      address: 'Phu Quoc, Pier Harbor 8',
      lat: 10.0210,
      lng: 104.0105,
      googleRating: 4.9,
      googleReviewsCount: 412,
      googleMapsUrl: 'https://maps.google.com/?q=Deep+Blue+Diving+Phu+Quoc',
      activeStatus: true,
      basicThreshold: 0,
      silverThreshold: 300000,
      goldThreshold: 600000,
      platinumThreshold: 1000000
    }
  });

  // 2. Создаем персонажа (Официанта)
  const waiterAlex = await prisma.staffMember.create({
    data: {
      partnerId: barBeach.id,
      name: 'Алекс (Sunset Bar)',
      role: StaffRole.WAITER,
      activeShiftsCount: 5,
      boxesIssuedCount: 14
    }
  });

  // 3. Создаем Ваучеры

  // SPA Ваучеры (BEAUTY_SPA)
  await prisma.voucherOffer.createMany({
    data: [
      {
        partnerId: spaLuxury.id,
        title: 'Бесплатный массаж стоп 30 мин',
        description: 'При заказе любого массажа тела от 60 мин',
        category: VoucherCategory.TRAFFIC_MAGNET,
        discountValue: 'FREE (100%)',
        imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&q=80',
        validityHours: 72,
        totalLimit: 500
      },
      {
        partnerId: spaLuxury.id,
        title: 'Скидка 25% на СПА-ритуал для двоих',
        description: 'Действительно на всё вечернее меню',
        category: VoucherCategory.LIFESTYLE,
        discountValue: '-25%',
        imageUrl: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&q=80',
        validityHours: 72,
        totalLimit: 300
      },
      {
        partnerId: spaLuxury.id,
        title: 'Сертификат на 300,000 VND на депиляцию',
        description: 'Скидка 300,000 VND на любые косметологические услуги',
        category: VoucherCategory.ANCHOR,
        discountValue: '300,000 VND',
        imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&q=80',
        validityHours: 72,
        totalLimit: 150
      }
    ]
  });

  // AUTO_MOTO Ваучеры
  await prisma.voucherOffer.createMany({
    data: [
      {
        partnerId: motoRental.id,
        title: 'Бесплатный шлем и держатель смартфона',
        description: 'При аренде любого байка на сутки',
        category: VoucherCategory.TRAFFIC_MAGNET,
        discountValue: 'FREE GIFT',
        imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&q=80',
        validityHours: 72,
        totalLimit: 400
      },
      {
        partnerId: motoRental.id,
        title: 'Скидка 20% на аренду байка Premium',
        description: 'Действует на Honda SH / NVX при аренде от 2 дней',
        category: VoucherCategory.LIFESTYLE,
        discountValue: '-20%',
        imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&q=80',
        validityHours: 72,
        totalLimit: 250
      },
      {
        partnerId: motoRental.id,
        title: 'День бесплатной аренды багги на острове',
        description: 'При бронировании экскурсионного тура на 3 дня',
        category: VoucherCategory.ANCHOR,
        discountValue: '1 DAY FREE',
        imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80',
        validityHours: 72,
        totalLimit: 100
      }
    ]
  });

  // ENTERTAINMENT Ваучеры
  await prisma.voucherOffer.createMany({
    data: [
      {
        partnerId: divingCenter.id,
        title: 'Бесплатный приветственный коктейль на яхте',
        description: 'При выходе на сноркелинг-тур',
        category: VoucherCategory.TRAFFIC_MAGNET,
        discountValue: 'FREE DRINK',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80',
        validityHours: 72,
        totalLimit: 500
      },
      {
        partnerId: divingCenter.id,
        title: 'Скидка 30% на пробное погружение с аквалангом',
        description: 'Обучение с сертифицированным инструктором PADI',
        category: VoucherCategory.LIFESTYLE,
        discountValue: '-30%',
        imageUrl: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=500&q=80',
        validityHours: 72,
        totalLimit: 200
      },
      {
        partnerId: divingCenter.id,
        title: 'Сертификат 500,000 VND на приватную аренду яхты',
        description: 'Скидка на закатную прогулку вокруг южных островов',
        category: VoucherCategory.ANCHOR,
        discountValue: '500,000 VND',
        imageUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=500&q=80',
        validityHours: 72,
        totalLimit: 80
      }
    ]
  });

  console.log('✅ Данные успешно засидированы!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
