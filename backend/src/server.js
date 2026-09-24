import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { connectDB } from './config/db.js';
import documentRoutes from './routes/documentRoutes.js';
import { attachSyncServer } from './sync/websocketServer.js';
import authRoutes from './routes/authRoutes.js';

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/syncdoc';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

async function main() {
  await connectDB(MONGO_URI);

  const app = express();
  app.use(cors({ origin: CLIENT_ORIGIN }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);

  const httpServer = http.createServer(app);

  // Same HTTP server handles both the REST API (Express) and the Yjs
  // CRDT sync WebSocket ("/sync") — this is the Week 2 "Message Broker
  // / Synchronization Engine" wiring.
  attachSyncServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] SyncDoc backend listening on http://localhost:${PORT}`);
    console.log(`[server] Yjs sync endpoint: ws://localhost:${PORT}/sync?doc=<documentId>`);
  });
}

main().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
