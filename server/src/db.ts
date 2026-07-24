import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.xlcaxlntaxpbajzcjebk:vL%40!D.J%2BS%3FU*G9U@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  }
});
