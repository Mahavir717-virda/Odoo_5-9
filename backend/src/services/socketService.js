import { WebSocketServer, WebSocket } from "ws";

let wss = null;

// Debounce timer — prevents broadcast storm when many attendance records change at once
let broadcastDebounceTimer = null;
const BROADCAST_DEBOUNCE_MS = 1500; // collapse bursts within 1.5s into one broadcast

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
 * Broadcast event to all connected dashboard and attendance clients.
 * Debounced: rapid successive calls within 1.5s collapse into a single broadcast.
 */
export const broadcastLeaderboardUpdate = (data = {}) => {
  if (!wss) return;

  // Cancel any pending broadcast and restart the timer
  if (broadcastDebounceTimer) clearTimeout(broadcastDebounceTimer);

  broadcastDebounceTimer = setTimeout(() => {
    broadcastDebounceTimer = null;
    const message = JSON.stringify({
      type: "LEADERBOARD_UPDATED",
      timestamp: Date.now(),
      ...data,
    });

    let sentCount = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (err) {
          // Safe ignore — client may have disconnected mid-send
        }
      }
    });

    if (sentCount > 0) {
      console.log(`⚡ Leaderboard broadcast sent to ${sentCount} client(s)`);
    }
  }, BROADCAST_DEBOUNCE_MS);
};

export default {
  initWebSocket,
  broadcastLeaderboardUpdate,
};
