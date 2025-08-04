// Production session creation endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email || email !== 'ed.duval15@gmail.com') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }

    // Set secure production session cookie for Vercel
    const cookieValue = 'prod-1754052835575-289kvxqgl42h';
    const isVercel = req.headers.host?.includes('vercel.app') || req.headers.host?.includes('aisentinel.app');
    
    console.log('🍪 Setting cookie for host:', req.headers.host, 'isVercel:', isVercel);
    
    // Force secure settings for Vercel production
    res.setHeader('Set-Cookie', [
      `sessionToken=${cookieValue}; Path=/; Max-Age=2592000; Secure; SameSite=Lax`
    ]);

    console.log('🚀 Production session created for:', email);

    return res.status(200).json({
      success: true,
      message: 'Production session created successfully',
      sessionToken: cookieValue,
      user: {
        email: 'ed.duval15@gmail.com',
        role: 'super-user',
        roleLevel: 1000,
        authenticated: true
      }
    });

  } catch (error) {
    console.error('❌ Production session creation failed:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Session creation failed' 
    });
  }
}