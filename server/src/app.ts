import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { staffRouter } from './routes/staff.js';
import { guestRouter } from './routes/guest.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Маршруты (с префиксом /api и без для Vercel)
app.use('/api/staff', staffRouter);
app.use('/api/guest', guestRouter);
app.use('/api/admin', adminRouter);

app.use('/staff', staffRouter);
app.use('/guest', guestRouter);
app.use('/admin', adminRouter);

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', service: 'HappyBox API', timestamp: new Date() });
});
