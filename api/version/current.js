// Vercel serverless function for version endpoint
export default async function handler(req, res) {
  // Import storage dynamically for Vercel compatibility
  let storage;
  try {
    const storageModule = await import('../../server/storage.js');
    storage = storageModule.storage;
  } catch (error) {
    console.error('Failed to import storage:', error);
    return res.status(500).json({ error: 'Server configuration error' });
  }
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("🔧 [VERCEL] Fetching current version...");
    const version = await storage.getCurrentVersion();
    console.log("✅ [VERCEL] Found current version:", version?.version || 'unknown');
    res.json(version);
  } catch (error) {
    console.error('🚨 [VERCEL] Error fetching current version:', error);
    res.status(500).json({ error: 'Failed to fetch current version' });
  }
}