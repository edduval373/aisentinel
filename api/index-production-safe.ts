// Production-safe Vercel serverless function entry point
// Enhanced with proper error handling and import safety
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.url || '';
    console.log(`API Request: ${req.method} ${path}`);

    // Health check - no dependencies
    if (path.includes('health') && req.method === 'GET') {
      return res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        hasDatabase: !!process.env.DATABASE_URL,
        version: '2025-07-23-PRODUCTION-SAFE-AUTHENTICATION',
        fixedIssues: 'Production-safe serverless function with proper error handling',
        buildSuccess: true
      });
    }

    // Authentication verification endpoint with enhanced error handling
    if (path.includes('auth/verify') && req.method === 'GET') {
      console.log('Processing verification request...');
      
      try {
        const token = req.query.token as string;
        
        if (!token) {
          console.error('No verification token provided');
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Error</h1>
              <p>No verification token provided. Please check your email for the correct verification link.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        console.log('Token received, attempting verification with imports...');
        
        // Try to import required services with error handling
        let storage, authService;
        try {
          const storageModule = await import('../server/storage');
          storage = storageModule.storage;
          
          const authServiceModule = await import('../server/services/authService');
          authService = authServiceModule.authService;
          
          console.log('Services imported successfully');
        } catch (importError: any) {
          console.error('Import error:', importError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Service Error</title></head>
            <body>
              <h1>Service Temporarily Unavailable</h1>
              <p>The authentication service is temporarily unavailable. Please try again in a few minutes.</p>
              <p>Error: ${importError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        // Get and validate verification token
        let verificationToken;
        try {
          verificationToken = await storage.getEmailVerificationToken(token);
        } catch (dbError: any) {
          console.error('Database error:', dbError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Database Error</title></head>
            <body>
              <h1>Database Connection Issue</h1>
              <p>Unable to connect to the database. Please try again later.</p>
              <p>Error: ${dbError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        if (!verificationToken || verificationToken.isUsed) {
          console.log('Token not found or already used');
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Failed</h1>
              <p>Invalid or expired verification token. Please request a new verification email.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        // Check if token expired (1 hour)
        const tokenAge = Date.now() - new Date(verificationToken.createdAt).getTime();
        if (tokenAge > 60 * 60 * 1000) {
          console.log('Token expired, age:', tokenAge);
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Verification Error</title></head>
            <body>
              <h1>Verification Expired</h1>
              <p>Verification token has expired. Please request a new verification email.</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }

        // Mark token as used and verify email
        try {
          await storage.markEmailVerificationTokenUsed(token);
          await storage.updateUserEmailVerified(verificationToken.email, true);
          console.log('Token marked as used and email verified');
        } catch (updateError: any) {
          console.error('Update error:', updateError.message);
          return res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Update Error</title></head>
            <body>
              <h1>Verification Update Failed</h1>
              <p>Could not complete email verification. Please try again.</p>
              <p>Error: ${updateError.message}</p>
              <a href="/">Return to AI Sentinel</a>
            </body>
            </html>
          `);
        }
        
        // Get user and create session
        try {
          const user = await storage.getUserByEmail(verificationToken.email);
          if (user) {
            const session = await authService.createSession(user);
            
            // Set session cookie with production-safe settings
            const cookieOptions = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
            res.setHeader('Set-Cookie', [
              `sessionToken=${session.sessionToken}; HttpOnly; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax; ${cookieOptions}`
            ]);
            
            console.log('Session created and cookie set for verified user:', verificationToken.email);
            
            // Redirect to frontend with success parameter
            const redirectUrl = `/?verified=true&email=${encodeURIComponent(verificationToken.email)}`;
            res.writeHead(302, { 'Location': redirectUrl });
            return res.end();
          }
        } catch (sessionError: any) {
          console.error('Session creation error:', sessionError.message);
          // Still show success to user even if session creation fails
          console.log('Email verified successfully for:', verificationToken.email);
        }
        
        // Success response if session creation fails but verification succeeded
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Email Verified</title></head>
          <body>
            <h1>Verification Successful!</h1>
            <p>Your email has been verified successfully. Redirecting to dashboard...</p>
            <script>
              setTimeout(() => {
                window.location.href = '/?verified=true&email=${encodeURIComponent(verificationToken.email)}';
              }, 2000);
            </script>
          </body>
          </html>
        `);
        
      } catch (error: any) {
        console.error("Verification error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Verification Error</title></head>
          <body>
            <h1>Verification Error</h1>
            <p>An unexpected error occurred during verification: ${error.message}</p>
            <a href="/">Return to AI Sentinel</a>
          </body>
          </html>
        `);
      }
    }

    // Auth me endpoint - matches frontend expectation
    if (path.includes('auth/me') && req.method === 'GET') {
      try {
        const sessionToken = req.headers.cookie?.match(/sessionToken=([^;]+)/)?.[1];
        
        if (!sessionToken) {
          return res.json({ authenticated: false });
        }

        // Try to import storage with error handling
        let storage;
        try {
          const storageModule = await import('../server/storage');
          storage = storageModule.storage;
        } catch (importError: any) {
          console.error('Storage import error:', importError.message);
          return res.json({ authenticated: false, error: 'Service unavailable' });
        }

        const session = await storage.getUserSession(sessionToken);
        
        if (!session) {
          return res.json({ authenticated: false });
        }

        const user = await storage.getUser(session.userId);
        
        if (!user) {
          return res.json({ authenticated: false });
        }

        let companyName = null;
        if (user.companyId) {
          try {
            const company = await storage.getCompanyById(user.companyId);
            companyName = company?.name;
          } catch (companyError) {
            console.error('Company lookup error:', companyError);
            // Continue without company name
          }
        }

        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            companyId: user.companyId,
            companyName,
            role: user.role,
            roleLevel: user.roleLevel
          }
        });
      } catch (error: any) {
        console.error("Auth me error:", error);
        return res.json({ authenticated: false, error: error.message });
      }
    }

    // Default response for unhandled routes
    return res.status(404).json({ 
      error: 'Not Found', 
      message: `Route ${path} not implemented`,
      availableRoutes: ['/api/health', '/api/auth/verify', '/api/auth/me']
    });

  } catch (topLevelError: any) {
    console.error('Top-level serverless function error:', topLevelError);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: topLevelError.message,
      timestamp: new Date().toISOString()
    });
  }
}