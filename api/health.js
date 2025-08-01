export default async function handler(req, res) {
  try {
    const cookieHeader = req.headers.cookie || '';
    const sessionToken = cookieHeader.split(';')
      .find(c => c.trim().startsWith('sessionToken='))
      ?.split('=')[1];

    const healthCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
      domain: req.headers.host,
      protocol: req.headers['x-forwarded-proto'] || 'http',
      
      cookies: {
        raw: cookieHeader,
        sessionToken: sessionToken ? sessionToken.substring(0, 20) + '...' : null,
        sessionExists: !!sessionToken,
        sessionValid: sessionToken ? sessionToken.startsWith('prod-session-') : false,
        cookieCount: cookieHeader ? cookieHeader.split(';').length : 0
      },
      
      headers: {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
        forwarded: req.headers['x-forwarded-for']
      },
      
      vercel: {
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
        env: process.env.VERCEL_ENV,
        gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8)
      }
    };

    console.log('🔍 [VERCEL HEALTH CHECK]', JSON.stringify(healthCheck, null, 2));

    res.json({
      status: 'healthy',
      ...healthCheck
    });

  } catch (error) {
    console.error('❌ [VERCEL HEALTH CHECK] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}