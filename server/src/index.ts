import http from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { initWebSocketServer } from './websocket.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Инициализация WebSocket
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚀 HappyBox Server running on http://localhost:${PORT}`);
});
