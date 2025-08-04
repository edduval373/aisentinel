// Vercel serverless function for company owners
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const companyId = parseInt(id);

    // Return mock owner data for now
    const owners = [
      {
        id: 1,
        userId: 1,
        companyId: companyId,
        roleLevel: 999,
        role: 'owner',
        email: 'owner@company.com',
        isActive: true
      }
    ];

    console.log(`Returning owners for company ${companyId}:`, owners.length, 'owners');
    return res.json(owners);
  } catch (error) {
    console.error("Error fetching company owners:", error);
    res.status(500).json({ message: "Failed to fetch company owners", error: error.message });
  }
}