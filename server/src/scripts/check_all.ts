import { prisma } from '../db.js';

async function run() {
  console.log('=== PRISMA ORM MODELS CHECK ===');
  console.log('Partner count:', await prisma.partner.count());
  console.log('User count:', await prisma.user.count());
  console.log('VoucherOffer count:', await prisma.voucherOffer.count());
  console.log('ClaimedVoucher count:', await prisma.claimedVoucher.count());
  console.log('FunnelUser count:', await prisma.funnelUser.count());
  
  console.log('\n=== RAW GIFTX TABLES CHECK (SQL) ===');
  const venues: any[] = await prisma.$queryRaw`SELECT count(*) FROM giftx_venues`;
  const offers: any[] = await prisma.$queryRaw`SELECT count(*) FROM giftx_offers`;
  const contacts: any[] = await prisma.$queryRaw`SELECT count(*) FROM giftx_contacts`;
  console.log('giftx_venues count:', venues[0].count.toString());
  console.log('giftx_offers count:', offers[0].count.toString());
  console.log('giftx_contacts count:', contacts[0].count.toString());

  const venueList: any[] = await prisma.$queryRaw`SELECT id, revoo_venue_id, name, city FROM giftx_venues LIMIT 10`;
  console.log('\n=== SAMPLE GIFTX VENUES IN POSTGRESQL ===');
  venueList.forEach(v => console.log(`- [${v.id}] ${v.name} (${v.city || 'No City'}) | RevooID: ${v.revoo_venue_id}`));
}

run().then(() => process.exit(0)).catch(e => { console.error('Check Error:', e); process.exit(1); });
