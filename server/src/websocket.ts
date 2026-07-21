import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ExtendedWebSocket extends WebSocket {
  subscribedToken?: string;
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'SUBSCRIBE_TOKEN') {
          ws.subscribedToken = data.token;
        }
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    });
  });
}

export function notifyTokenClaimed(token: string, userName: string) {
  if (!wss) return;
  wss.clients.forEach((client: WebSocket) => {
    const extClient = client as ExtendedWebSocket;
    if (extClient.readyState === WebSocket.OPEN && extClient.subscribedToken === token) {
      extClient.send(
        JSON.stringify({
          type: 'TOKEN_CLAIMED',
          token,
          userName
        })
      );
    }
  });
}
