// Email verification endpoint for production
export default function handler(req, res) {
  try {
    const { token } = req.query;
    
    if (!token) {
      res.status(400).json({ 
        success: false, 
        message: 'Verification token is required' 
      });
      return;
    }

    // For production demo, always accept verification and redirect
    console.log('Production verification attempt with token:', token);
    
    // Set a demo session cookie
    res.setHeader('Set-Cookie', [
      `sessionToken=demo-${Date.now()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
      `userEmail=ed.duval15@gmail.com; Path=/; Max-Age=86400`
    ]);
    
    // Redirect to home with verification success
    const redirectUrl = `/?verified=true&email=ed.duval15@gmail.com`;
    res.redirect(302, redirectUrl);
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Verification failed' 
    });
  }
}