import express from "express";
import { createServer } from "http";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Essential demo API routes only
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/auth/me', (req, res) => res.json({ authenticated: false }));
app.get('/api/auth/user', (req, res) => res.json({ id: 'demo', email: 'demo@test.com', name: 'Demo' }));
app.get('/api/chat/sessions', (req, res) => res.json([]));
app.post('/api/chat/sessions', (req, res) => res.json({ id: 1, title: 'Demo', createdAt: new Date().toISOString() }));
app.get('/api/user/current-company', (req, res) => res.json({ id: 1, name: 'Demo Company', logo: null }));

const server = createServer(app);

(async () => {
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  server.listen({ port: 5000, host: "0.0.0.0" }, () => {
    log(`serving on port 5000`);
  });
})();