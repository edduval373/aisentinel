import express from "express";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const port = 5000;

// Minimal middleware
app.use(express.json());

// Simple demo API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ authenticated: false });
});

app.get('/api/auth/user', (req, res) => {
  res.json({ 
    id: 'demo-user', 
    email: 'demo@aisentinel.com', 
    name: 'Demo User' 
  });
});

app.get('/api/chat/sessions', (req, res) => {
  res.json([]);
});

app.post('/api/chat/sessions', (req, res) => {
  res.json({ 
    id: 1, 
    title: 'Demo Session',
    createdAt: new Date().toISOString(),
    messageCount: 0
  });
});

app.get('/api/user/current-company', (req, res) => {
  res.json({
    id: 1,
    name: 'Demo Company',
    logo: null
  });
});

// Create HTTP server
import { createServer } from "http";
const server = createServer(app);

(async () => {
  try {
    // Setup development
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });
    
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();