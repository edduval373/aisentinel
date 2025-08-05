import { db } from '../../../server/db.js';
import { aiProviders } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  console.log(`🌐 API Request: ${req.method} ${req.url} from ${req.headers['user-agent']?.substring(0, 50)}...`);

  const { id } = req.query;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Valid provider ID required' });
  }

  // Header-based authentication for super-users (1000+ level)
  const authHeader = req.headers.authorization;
  const sessionToken = req.headers['x-session-token'];
  
  let isAuthenticated = false;
  let userId = null;
  let roleLevel = 0;

  // Production token authentication
  const productionToken = 'prod-1754052835575-289kvxqgl42h';
  const extractedToken = authHeader?.replace('Bearer ', '') || sessionToken;
  
  if (extractedToken === productionToken) {
    console.log('✅ [AI-PROVIDERS] Production token authenticated for provider ' + id);
    isAuthenticated = true;
    userId = 42450602;
    roleLevel = 1000;
  } else {
    console.log('❌ [AI-PROVIDERS] Authentication failed for provider ' + id);
    return res.status(401).json({ 
      error: 'Authentication failed',
      details: {
        hasToken: !!extractedToken,
        requiredRole: '1000+ (Super-user)'
      }
    });
  }

  // Super-user access required (1000+)
  if (roleLevel < 1000) {
    return res.status(403).json({ 
      error: 'Super-user access required',
      currentRole: roleLevel,
      requiredRole: 1000
    });
  }

  console.log('✅ [AI-PROVIDERS] Header auth successful for provider ' + id + ': userId=' + userId + ', roleLevel=' + roleLevel);

  try {
    switch (req.method) {
      case 'PUT':
        console.log('✅ [AI-PROVIDERS] Updating provider ' + id + '...');
        const updateData = req.body;
        console.log('📝 [AI-PROVIDERS] Update data:', updateData);
        
        const [updatedProvider] = await db
          .update(aiProviders)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(aiProviders.id, parseInt(id)))
          .returning();
          
        if (!updatedProvider) {
          return res.status(404).json({ error: 'Provider not found' });
        }
        
        console.log('✅ [AI-PROVIDERS] Updated provider:', updatedProvider.displayName);
        return res.json(updatedProvider);

      case 'DELETE':
        console.log('✅ [AI-PROVIDERS] Deleting provider ' + id + '...');
        
        const [deletedProvider] = await db
          .delete(aiProviders)
          .where(eq(aiProviders.id, parseInt(id)))
          .returning();
          
        if (!deletedProvider) {
          return res.status(404).json({ error: 'Provider not found' });
        }
        
        console.log('✅ [AI-PROVIDERS] Deleted provider:', deletedProvider.displayName);
        return res.json({ message: 'Provider deleted successfully', provider: deletedProvider });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ [AI-PROVIDERS] Database error for provider ' + id + ':', error);
    return res.status(500).json({ 
      error: 'Database operation failed', 
      details: error.message 
    });
  }
}