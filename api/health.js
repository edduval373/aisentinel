
// Enhanced health check with cookie debugging
export default function handler(req, res) {
  const cookies = req.headers.cookie || '';
  const sessionToken = cookies.split(';')
    .find(c => c.trim().startsWith('sessionToken='))
    ?.split('=')[1];

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: 'vercel-cookie-debug-v1',
    environment: process.env.NODE_ENV || 'development',
    cookies: {
      present: !!cookies,
      sessionToken: !!sessionToken,
      count: cookies ? cookies.split(';').length : 0
    },
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
      origin: req.headers.origin
    }
  });
}
