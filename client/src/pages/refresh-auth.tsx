import { useEffect } from 'react';

export default function RefreshAuth() {
  useEffect(() => {
    const refreshSession = async () => {
      try {
        // Clear any existing cookies
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Get a fresh session from dev-login endpoint
        const response = await fetch('/api/auth/dev-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'ed.duval15@gmail.com' }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Fresh authentication successful:', data);
          
          // Wait a moment for cookie to be set, then redirect to company management
          setTimeout(() => {
            window.location.href = '/admin/company-management';
          }, 1000);
        } else {
          console.error('Failed to refresh authentication');
        }
      } catch (error) {
        console.error('Error refreshing authentication:', error);
      }
    };
    
    refreshSession();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        animation: 'spin 2s linear infinite'
      }}>
        <img 
          src="/ai-sentinel-logo.png" 
          alt="Loading..." 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
          }} 
        />
      </div>
      <p style={{ fontSize: '18px', color: '#1e293b', fontWeight: '600' }}>
        Refreshing authentication...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}