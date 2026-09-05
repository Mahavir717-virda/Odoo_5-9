import { WebSocketServer, WebSocket } from "ws";

let wss = null;

/**
 * Initialize WebSocket Server attached to existing HTTP Server
 */
export const initWebSocket = (httpServer) => {
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "CONNECTED", message: "Live Leaderboard WebSocket Connected" }));

    ws.on("error", (err) => {
      console.warn("WebSocket client error:", err.message);
    });
  });

  console.log("⚡ Real-time WebSocket Server initialized on path: /ws");
  return wss;
};

/**
 * Broadcast event to all connected dashboard and attendance clients
 */
export const broadcastLeaderboardUpdate = (data = {}) => {
  if (!wss) return;
  const message = JSON.stringify({
    type: "LEADERBOARD_UPDATED",
    timestamp: Date.now(),
    ...data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        // Safe ignore
      }
    }
  });
};

export default {
  initWebSocket,
  broadcastLeaderboardUpdate,
};
