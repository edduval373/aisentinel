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
  logoSize?: number;
  companyNameSize?: number;
  showCompanyName?: boolean;
  showCompanyLogo?: boolean;
}

function CompanyInfoLarge() {
  const { user } = useAuth();
  
  // Check if we're in demo mode (only when explicitly accessing /demo or role level 0)
  const isDemoMode = window.location.pathname === '/demo';
  const userRoleLevel = user?.roleLevel || 1;
  const isLimitedAccess = userRoleLevel === 0;
  
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
  });

  if (!currentCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          backgroundColor: '#3b82f6', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 700
        }}>
          DEMO
        </div>
        <div>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>
            {isLimitedAccess ? 'Demo Company' : 'Loading...'}
          </div>
          {isLimitedAccess && (
            <div style={{ fontSize: '16px', color: '#3b82f6', fontWeight: 500, textAlign: 'center', marginTop: '8px' }}>
              Using AI Sentinel API Keys
            </div>
          )}
        </div>
      </div>
    );
  }

  // Use company settings from database
  const logoSize = currentCompany.logoSize || 100;
  const companyNameSize = currentCompany.companyNameSize || 28;
  const showCompanyName = currentCompany.showCompanyName !== false; // Default to true
  const showCompanyLogo = currentCompany.showCompanyLogo !== false; // Default to true

  // Don't show anything if both logo and name are disabled
  if (!showCompanyLogo && !showCompanyName) {
    return (
      <div style={{ color: '#9ca3af', fontSize: '16px', fontStyle: 'italic', textAlign: 'center' }}>
        Company branding hidden
      </div>
    );
  }

  // Calculate proper header constraints (max 56px for header height of 60px)
  const maxHeaderLogoSize = 56;
  const headerLogoSize = Math.min(logoSize, maxHeaderLogoSize);
  const headerNameSize = Math.min(companyNameSize, 18); // Cap at 18px for header

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0', padding: '0' }}>
      {showCompanyLogo && (
        <>
          {isLimitedAccess ? (
            <div style={{ 
              width: '36px', 
              height: '36px', 
              backgroundColor: '#3b82f6', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700
            }}>
              DEMO
            </div>
          ) : currentCompany.logo ? (
            <div style={{ position: 'relative', display: 'inline-block', margin: '0', padding: '0' }}>
              <img 
                src={currentCompany.logo} 
                alt={currentCompany.name}
                style={{ 
                  width: `${headerLogoSize}px`, 
                  height: `${headerLogoSize}px`, 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  display: 'block'
                }}
              />
            </div>
          ) : (
            <div 
              style={{ 
                width: `${headerLogoSize}px`, 
                height: `${headerLogoSize}px`, 
                backgroundColor: '#3b82f6', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: `${Math.floor(Math.min(logoSize, 48) * 0.4)}px`,
                fontWeight: 700,
                border: '1px solid transparent'
              }}
            >
              {currentCompany.name.charAt(0).toUpperCase()}
            </div>
          )}
        </>
      )}
      
      {showCompanyName && (
        <div style={{ margin: '0', padding: '0' }}>
          <div style={{ 
            fontSize: `${headerNameSize}px`, 
            fontWeight: 700, 
            color: '#1e293b', 
            textAlign: 'left',
            lineHeight: '1.1',
            margin: '0',
            padding: '0'
          }}>
            {isLimitedAccess ? 'Demo Company' : currentCompany.name}
          </div>
          {isLimitedAccess ? (
            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500, textAlign: 'left', marginTop: '2px', margin: '2px 0 0 0' }}>
              Using AI Sentinel API Keys
            </div>
          ) : currentCompany.description && (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'left', marginTop: '2px', margin: '2px 0 0 0' }}>
              {currentCompany.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompanyInfo() {
  const { user } = useAuth();
  
  // Check if we're in demo mode (only when explicitly accessing /demo or role level 0)
  const isDemoMode = window.location.pathname === '/demo';
  const userRoleLevel = user?.roleLevel || 1;
  const isLimitedAccess = userRoleLevel === 0;
  
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
  });

  if (!currentCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#3b82f6', 
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
            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
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
          backgroundColor: '#3b82f6', 
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
          <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 500 }}>
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
          backgroundColor: '#f1f5f9', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '8px 16px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          minHeight: '60px',
          position: 'relative'
        }}>
          {/* Menu Button - Positioned absolutely in top left */}
          <Button
            variant="ghost"
            size="sm"
            onClick={canAccessSidebar ? () => setSidebarOpen(!sidebarOpen) : undefined}
            disabled={!canAccessSidebar}
            style={{ 
              position: 'absolute',
              top: '8px',
              left: '12px',
              padding: '4px',
              minWidth: '48px',
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
                width: '40px', 
                height: '40px', 
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
              }}
            />
          </Button>

          {/* Sign Out Button - Positioned absolutely in top right */}
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '14px',
              color: '#64748b',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px'
            }}
          >
            Sign Out
          </button>
          
          {/* Centered Company Info - Large Screen Title */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            justifyContent: 'center',
            margin: '0',
            padding: '0'
          }}>
            <CompanyInfoLarge />
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
