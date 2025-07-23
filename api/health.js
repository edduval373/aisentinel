// Ultra-minimal health check endpoint
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: 'minimal-health-v1'
  });
}