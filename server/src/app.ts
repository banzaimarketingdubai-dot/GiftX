import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { staffRouter } from './routes/staff.js';
import { guestRouter } from './routes/guest.js';

dotenv.config();

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Маршруты
app.use('/api/staff', staffRouter);
app.use('/api/guest', guestRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'HappyBox API', timestamp: new Date() });
});
