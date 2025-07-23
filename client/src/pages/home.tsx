import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// import { isUnauthorizedError } from "@/lib/authUtils"; // Temporarily disabled
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { TrialBanner } from "@/components/TrialBanner";



interface Company {
  id: number;
  name: string;
  logo?: string;
  description?: string;
}

function CompanyInfo() {
  const { user } = useAuth();
  
  // Check if we're in demo mode or user has role level 0 (demo) or 1 (regular user)
  const isDemoMode = window.location.pathname.includes('/demo') || window.location.search.includes('demo');
  const userRoleLevel = user?.roleLevel || 0;
  const isLimitedAccess = userRoleLevel <= 1 || isDemoMode;
  
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
  });

  if (!currentCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#f59e0b', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600
        }}>
          DEMO
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            {isLimitedAccess ? 'Demo Company' : 'Loading...'}
          </div>
          {isLimitedAccess && (
            <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
              Using AI Sentinel API Keys
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {isLimitedAccess ? (
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#f59e0b', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 600
        }}>
          DEMO
        </div>
      ) : currentCompany.logo ? (
        <img 
          src={currentCompany.logo} 
          alt={currentCompany.name}
          style={{ 
            width: '48px', 
            height: '48px', 
            objectFit: 'contain',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        />
      ) : (
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#3b82f6', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600
        }}>
          {currentCompany.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
          {isLimitedAccess ? 'Demo Company' : currentCompany.name}
        </div>
        {isLimitedAccess ? (
          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 500 }}>
            Using AI Sentinel API Keys
          </div>
        ) : currentCompany.description && (
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {currentCompany.description}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, user, isSuperUser, isOwner, isAdmin } = useAuth();
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if we're in demo mode or if user is regular user (role level 1)
  const isDemoMode = window.location.pathname.includes('/demo') || window.location.search.includes('demo');
  const userRoleLevel = user?.roleLevel || 0;
  
  // Determine if sidebar access is allowed (super users, owners, admins only - role level 2+)
  const canAccessSidebar = isAuthenticated && (isSuperUser || isOwner || isAdmin || userRoleLevel >= 2);

  // Completely bypass authentication - always allow access
  useEffect(() => {
    console.log('Authentication bypassed - direct access to main interface');
  }, []);

  // Remove loading check - go straight to main interface
  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center bg-slate-50">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue mx-auto mb-4"></div>
  //         <p className="text-slate-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // Show interface even without authentication for demo mode
  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      {canAccessSidebar && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top Header with Menu Button - Fixed Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '8px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '56px'
        }}>
          {/* Left side - Logo and Company */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={canAccessSidebar ? () => setSidebarOpen(!sidebarOpen) : undefined}
              disabled={!canAccessSidebar}
              style={{ 
                padding: '4px',
                minWidth: '51px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                cursor: canAccessSidebar ? 'pointer' : 'default',
                opacity: canAccessSidebar ? 1 : 0.6
              }}
            >
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                style={{ 
                  width: '51px', 
                  height: '51px', 
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: 'brightness(0.34)'
                }}
              />
            </Button>
            
            {/* Company Info from Database */}
            <CompanyInfo />
          </div>
          
          {/* Right side - Page Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>AI Sentinel Chat</h1>
          </div>
        </div>
        
        {/* Chat Interface Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Trial Banner - Temporarily disabled */}
          {/* <div style={{ padding: '16px 16px 0 16px' }}>
            <TrialBanner />
          </div> */}
          
          <ChatInterface 
            currentSession={currentSession} 
            setCurrentSession={setCurrentSession}
          />
        </div>
      </div>
    </div>
  );
}
