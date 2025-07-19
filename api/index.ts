// Vercel serverless function entry point
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Set CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// API routes for demo mode
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    deployment: 'vercel-serverless'
  });
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

// Demo chat sessions
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

// Catch-all API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found', path: req.path });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

