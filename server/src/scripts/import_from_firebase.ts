import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const firebaseConfig = {
  apiKey: "AIzaSyDYqvC0Ti6ChVnz5eMQhxms4hkgMUxF9PY",
  authDomain: "bot-lab-21910.firebaseapp.com",
  projectId: "bot-lab-21910",
  storageBucket: "bot-lab-21910.firebasestorage.app",
  messagingSenderId: "331010142763",
  appId: "1:331010142763:web:cfd9fa17ed9bf99a99f06e",
  databaseURL: "https://bot-lab-21910.firebaseio.com"
};

const fbApp = initializeApp(firebaseConfig);
const fbDb = getFirestore(fbApp);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function runImport() {
  console.log('===========================================================');
  console.log('🚀 ИМПОРТ ЗАВЕДЕНИЙ ИЗ FIREBASE (FIRESTORE) В SUPABASE (GIFTX)');
  console.log('===========================================================');

  const snap = await getDocs(collection(fbDb, 'venues'));
  console.log(`\n📥 Найдено заведений в Firestore: ${snap.size}`);

  let importedCount = 0;

  for (const doc of snap.docs) {
    const d = doc.data();
    const revooId = doc.id;
    const name = d.name || d.title || 'Без названия';
    const niche = d.category || d.niche || 'General';
    const address = d.address || null;
    const city = d.city || (address && address.includes(',') ? address.split(',').pop()?.trim() : null);
    const googleMapsUrl = d.googleMapsUrl || d.mapsUrl || null;
    const rating = d.rating ? parseFloat(String(d.rating).replace(',', '.')) : (d.googleRating ? parseFloat(String(d.googleRating)) : null);
    const reviewsCount = d.reviewsCount || d.googleReviewsCount || 0;
    const workingHours = d.workingHours || null;
    const phone = d.phone || null;
    const photoUrl = d.logoUrl || d.photoUrl || d.bannerUrl || null;

    console.log(`\n⏳ Импорт: "${name}" (${revooId})...`);

    // 1. Upsert into giftx_venues
    const venueResult: any = await prisma.$queryRawUnsafe(`
      INSERT INTO public.giftx_venues (
        revoo_venue_id, name, niche, city, address, 
        google_maps_url, rating, reviews_count, working_hours, phone, photo_url, is_active, raw_metadata, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, $9, $10, $11, true, $12::jsonb, NOW()
      )
      ON CONFLICT (revoo_venue_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        niche = EXCLUDED.niche,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        google_maps_url = EXCLUDED.google_maps_url,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        working_hours = EXCLUDED.working_hours,
        phone = EXCLUDED.phone,
        photo_url = EXCLUDED.photo_url,
        raw_metadata = EXCLUDED.raw_metadata,
        updated_at = NOW()
      RETURNING id;
    `,
      revooId,
      name,
      niche,
      city,
      address,
      googleMapsUrl,
      rating,
      reviewsCount,
      workingHours,
      phone,
      photoUrl,
      JSON.stringify(d)
    );

    const venueId = venueResult[0]?.id;

    if (venueId) {
      // 2. Add default / configured 3-tier offers (Silver, Gold, Platinum)
      const offersData = d.giftxOffers || (d.giftx && d.giftx.offers) || {};
      
      const silverDesc = offersData.silver || `Скидка 10% или комплимент при первом заказе в ${name}`;
      const goldDesc = offersData.gold || `Скидка 20% или фирменный напиток/десерт в подарок в ${name}`;
      const platinumDesc = offersData.platinum || `VIP подарок / Скидка 30% на все меню в ${name}`;

      // Clean existing offers for idempotency
      await prisma.$executeRawUnsafe(`DELETE FROM public.giftx_offers WHERE venue_id = $1::uuid;`, venueId);

      // Insert offers
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.giftx_offers (venue_id, tier, description, is_active)
        VALUES 
          ($1::uuid, 'silver', $2, true),
          ($1::uuid, 'gold', $3, true),
          ($1::uuid, 'platinum', $4, true);
      `, venueId, silverDesc, goldDesc, platinumDesc);

      // 3. Sync to GiftX Partner table as well
      const existingPartner = await prisma.partner.findFirst({
        where: { name: name }
      });

      if (!existingPartner) {
        let categoryEnum: any = 'HORECA';
        if (niche.toLowerCase().includes('beauty') || niche.toLowerCase().includes('spa')) categoryEnum = 'BEAUTY_SPA';
        else if (niche.toLowerCase().includes('auto')) categoryEnum = 'AUTO_MOTO';
        else if (niche.toLowerCase().includes('entertainment')) categoryEnum = 'ENTERTAINMENT';
        else if (niche.toLowerCase().includes('service')) categoryEnum = 'SERVICES';

        await prisma.partner.create({
          data: {
            name: name,
            description: `${niche} заведение в ${city || 'городе'}`,
            category: categoryEnum,
            logoUrl: photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60',
            address: address || 'Локация уточняется',
            googleRating: rating || 4.8,
            googleReviewsCount: reviewsCount || 50,
            googleMapsUrl: googleMapsUrl,
            activeStatus: true,
            moderationStatus: 'APPROVED',
            basicThreshold: 0,
            silverThreshold: 200000,
            goldThreshold: 500000,
            platinumThreshold: 1000000
          }
        });
      }

      importedCount++;
      console.log(`✅ Успешно импортировано: "${name}" (Supabase UUID: ${venueId})`);
    }
  }

  console.log('\n===========================================================');
  console.log(`🎉 ВСЕГО ИМПОРТИРОВАНО И СИНХРОНИЗИРОВАНО: ${importedCount} заведений!`);
  console.log('===========================================================');
}

runImport()
  .catch((e) => {
    console.error('❌ Ошибка импорта:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
