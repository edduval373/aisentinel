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
      gap: '16px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 2s linear infinite'
      }}></div>
      <p style={{ fontSize: '18px', color: '#333' }}>
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