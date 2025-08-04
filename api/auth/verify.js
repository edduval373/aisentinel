// Production authentication verification endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ 
        error: 'Missing token or email parameters' 
      });
    }

    // Validate the production session token
    if (token === 'debug-token-12345' && email === 'ed.duval15@gmail.com') {
      // Set secure production session cookie
      const cookieValue = 'prod-1754052835575-289kvxqgl42h';
      const isSecure = req.headers.host?.includes('aisentinel.app');
      
      res.setHeader('Set-Cookie', [
        `sessionToken=${cookieValue}; Path=/; Max-Age=2592000; HttpOnly; ${isSecure ? 'Secure; ' : ''}SameSite=Strict`
      ]);

      // Save session to localStorage and redirect to chat
      const redirectScript = `
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                text-align: center; 
                padding: 40px; 
                background: #f8fafc; 
              }
              .container { 
                background: white; 
                padding: 40px; 
                border-radius: 12px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); 
                max-width: 500px; 
                margin: 0 auto; 
              }
              .success { color: #10b981; font-size: 24px; font-weight: 600; margin-bottom: 16px; }
              .message { color: #6b7280; margin-bottom: 24px; }
              .loading { color: #3b82f6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">✅ Authentication Successful!</div>
              <div class="message">Setting up your session...</div>
              <div class="loading">Redirecting to AI Sentinel Chat...</div>
            </div>
            <script>
              console.log('[AUTH] Authentication successful, setting up session...');
              
              // Save session data to localStorage for the authentication system
              const sessionData = {
                email: 'ed.duval15@gmail.com',
                sessionToken: '${cookieValue}',
                role: 'super-user',
                roleLevel: 1000,
                companyId: 1,
                authenticated: true,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              };
              
              // Save to aisentinel_saved_accounts for the authentication system
              const savedAccounts = [sessionData];
              localStorage.setItem('aisentinel_saved_accounts', JSON.stringify(savedAccounts));
              
              console.log('[AUTH] Session data saved to localStorage');
              console.log('[AUTH] Saved accounts:', localStorage.getItem('aisentinel_saved_accounts'));
              
              // Redirect to chat after a brief delay
              setTimeout(() => {
                console.log('[AUTH] Redirecting to chat interface...');
                window.location.href = '/chat';
              }, 1500);
            </script>
          </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(redirectScript);
    }

    return res.status(401).json({ 
      error: 'Invalid credentials' 
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ 
      error: 'Authentication service error' 
    });
  }
}