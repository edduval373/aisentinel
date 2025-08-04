// Simple fallback for developer status
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simple fallback response for now
    res.json({ 
      isDeveloper: false,
      testRole: null,
      actualRole: 1,
      effectiveRole: 1
    });
  } catch (error) {
    console.error('Developer status error:', error);
    res.json({ isDeveloper: false });
  }
}