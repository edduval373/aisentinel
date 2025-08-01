
// Session transfer endpoint for Vercel serverless
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token required' });
    }

    // Set the session cookie with Vercel-optimized settings
    res.setHeader('Set-Cookie', [
      `sessionToken=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    ]);

    res.status(200).json({ 
      success: true, 
      message: 'Session transferred successfully',
      redirectTo: '/chat'
    });
  } catch (error) {
    console.error('Session transfer error:', error);
    res.status(500).json({ error: 'Session transfer failed' });
  }
}
