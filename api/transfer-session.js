export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken || !sessionToken.startsWith('prod-session-')) {
      return res.status(400).json({ success: false, message: 'Invalid session token' });
    }

    console.log('🔄 [VERCEL SESSION TRANSFER] Processing session token:', sessionToken.substring(0, 20) + '...');

    // Set cookie with Vercel-optimized settings
    const isProduction = process.env.VERCEL_ENV === 'production';
    
    res.setHeader('Set-Cookie', [
      `sessionToken=${sessionToken}; Path=/; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
    ]);

    console.log('✅ [VERCEL SESSION TRANSFER] Cookie set successfully');
    
    res.json({
      success: true,
      message: 'Session transferred successfully',
      environment: process.env.VERCEL_ENV || 'development',
      secure: isProduction
    });

  } catch (error) {
    console.error('❌ [VERCEL SESSION TRANSFER] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Session transfer failed',
      error: error.message 
    });
  }
}