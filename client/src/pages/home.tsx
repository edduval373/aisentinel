import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// import { isUnauthorizedError } from "@/lib/authUtils"; // Temporarily disabled
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Building2, LogOut, RotateCcw, Trash2, Star, ArrowLeft, Settings } from "lucide-react";
import TutorialArrow from "@/components/tutorial/TutorialArrow";
import { useTutorial } from "@/hooks/useTutorial";
import { DemoUsageBanner } from "@/components/demo/DemoUsageBanner";
import FeaturesBenefitsDialog from "@/components/FeaturesBenefitsDialog";
import DeveloperControls from "@/components/developer/DeveloperControls";
import { useFeaturesBenefits } from "@/hooks/useFeaturesBenefits";
import { useDeveloper } from "@/hooks/useDeveloper";
import AccountDropdown from "@/components/auth/AccountDropdown";

import { useCompanyContext } from "@/hooks/useCompanyContext";
import { validateAndFixBase64Image, getCompanyInitial, createFallbackImageStyle } from "../utils/imageUtils";



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
  
  // Check if we're in demo mode (role level 0) - but exclude developer test mode
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0 && user?.role === 'demo';
  
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
    // Always fetch company data, even for demo mode
  });

  if (!currentCompany) {
    return null; // Don't show anything during loading
  }

  // Use company settings from database
  const logoSize = currentCompany.logoSize || 100;
  const companyNameSize = currentCompany.companyNameSize || 28;
  const showCompanyName = currentCompany.showCompanyName !== false; // Default to true
  const showCompanyLogo = currentCompany.showCompanyLogo !== false; // Default to true
  
  // Debug logging
  console.log("🎨 CompanyInfoLarge - Logo settings:", { logoSize, companyNameSize, showCompanyName, showCompanyLogo });

  // Don't show anything if both logo and name are disabled
  if (!showCompanyLogo && !showCompanyName) {
    return null;
  }

  // Use the full logo size from database settings (no header constraint)
  const headerLogoSize = logoSize;
  const headerNameSize = Math.min(companyNameSize, 18); // Cap at 18px for header

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: '12px', 
      margin: '0', 
      padding: '0',
      width: '100%'
    }}>
      {showCompanyLogo && (
        <>
          {(() => {
            const validImageUrl = validateAndFixBase64Image(currentCompany.logo || '');
            const companyInitial = getCompanyInitial(currentCompany.name);
            
            if (validImageUrl) {
              return (
                <div style={{ position: 'relative', display: 'inline-block', margin: '0', padding: '0' }}>
                  <img 
                    src={validImageUrl} 
                    alt={currentCompany.name}
                    onError={(e) => {
                      // Fallback to company initial if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallbackDiv = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex';
                      }
                    }}
                    style={{ 
                      maxWidth: `${headerLogoSize}px`, 
                      maxHeight: `${headerLogoSize}px`, 
                      height: 'auto',
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      display: 'block'
                    }}
                  />
                  <div 
                    className="logo-fallback"
                    style={{ 
                      ...createFallbackImageStyle(headerLogoSize, companyInitial),
                      borderRadius: '6px',
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    {companyInitial}
                  </div>
                </div>
              );
            } else {
              return (
                <div style={{
                  ...createFallbackImageStyle(headerLogoSize, companyInitial),
                  borderRadius: '6px'
                }}>
                  {companyInitial}
                </div>
              );
            }
          })()}
        </>
      )}
      
      {showCompanyName && (
        <div style={{ margin: '0', padding: '0' }}>
          <div style={{ 
            fontSize: `${headerNameSize}px`, 
            fontWeight: 700, 
            color: '#1e293b', 
            textAlign: 'center',
            lineHeight: '1.1',
            margin: '0',
            padding: '0'
          }}>
            {currentCompany.name}
          </div>
          {currentCompany.description && (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginTop: '2px', margin: '2px 0 0 0' }}>
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
  
  // Check if we're in demo mode (role level 0) - but exclude developer test mode
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0 && user?.role === 'demo';
  
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
    // Always fetch company data, even for demo mode
  });

  if (!currentCompany) {
    return null; // Don't show anything during loading
  }

  // Use company settings from database
  const logoSize = currentCompany.logoSize || 100;
  const companyNameSize = currentCompany.companyNameSize || 28;
  const showCompanyName = currentCompany.showCompanyName !== false;
  const showCompanyLogo = currentCompany.showCompanyLogo !== false;
  
  // Use smaller logo size for header (cap at 56px but honor the database setting if smaller)
  const headerLogoSize = Math.min(logoSize, 56);
  
  console.log("🎨 CompanyInfo - Logo settings:", { logoSize, headerLogoSize, showCompanyName, showCompanyLogo });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showCompanyLogo && (
        <>
          {(() => {
            const validImageUrl = validateAndFixBase64Image(currentCompany.logo || '');
            const companyInitial = getCompanyInitial(currentCompany.name);
            
            if (validImageUrl) {
              return (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={validImageUrl} 
                    alt={currentCompany.name}
                    onError={(e) => {
                      // Fallback to company initial if logo fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallbackDiv = target.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                      if (fallbackDiv) {
                        fallbackDiv.style.display = 'flex';
                      }
                    }}
                    style={{ 
                      maxWidth: `${headerLogoSize}px`, 
                      maxHeight: `${headerLogoSize}px`, 
                      height: 'auto',
                      width: 'auto',
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }}
                  />
                  <div 
                    className="logo-fallback"
                    style={{ 
                      ...createFallbackImageStyle(headerLogoSize, companyInitial),
                      borderRadius: '6px',
                      display: 'none',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    {companyInitial}
                  </div>
                </div>
              );
            } else {
              return (
                <div style={{
                  ...createFallbackImageStyle(headerLogoSize, companyInitial),
                  borderRadius: '6px'
                }}>
                  {companyInitial}
                </div>
              );
            }
          })()}
        </>
      )}
      {showCompanyName && (
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            {currentCompany.name}
          </div>
          {currentCompany.description && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {currentCompany.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, user, isSuperUser, isOwner, isAdmin } = useAuth();
  const { currentCompanyId, setCurrentCompanyId } = useCompanyContext();
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showTutorial, completeTutorial } = useTutorial();
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  // Check if we're in demo mode (role level 0) - includes developer test mode
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0;
  
  // For developers: use effective role level that includes test role mapping
  const effectiveRoleLevel = userRoleLevel;
  
  // Features & Benefits dialog for demo users
  const { showDialog, openDialog, closeDialog } = useFeaturesBenefits(isDemoMode);
  const { isDeveloper } = useDeveloper();
  
  // Check if user is super-user (role level 1000+)
  const isSuperUserLevel = effectiveRoleLevel >= 1000;
  
  // Determine if sidebar access is allowed - super-users (1000+) should always have access
  const canAccessSidebar = isAuthenticated && (effectiveRoleLevel === 0 || effectiveRoleLevel >= 2 || effectiveRoleLevel >= 1000);
  
  console.log('🔧 [HOME] Sidebar access check:', {
    isAuthenticated,
    effectiveRoleLevel,
    canAccessSidebar,
    userRoleLevel: user?.roleLevel,
    isSuperUser: effectiveRoleLevel >= 1000
  });

  // Fetch all companies for super-user company switching
  const { data: allCompanies = [] } = useQuery<Array<{ id: number; name: string; description?: string }>>({
    queryKey: ['/api/admin/companies'],
    enabled: isSuperUserLevel || isDeveloper,
  });

  // Fetch company roles for developer testing
  const { data: companyRoles = [] } = useQuery<Array<{ id: number; name: string; level: number }>>({
    queryKey: ['/api/company/roles', currentCompanyId],
    enabled: isDeveloper && !!currentCompanyId
  });

  // Clear cookies function with server logout
  const handleClearCookies = async () => {
    console.log("Clearing all session data and returning to landing page");
    
    const currentEmail = user?.email || 'unknown';
    console.log(`Clearing session for user: ${currentEmail}`);
    
    try {
      // Call server logout endpoint first
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      console.log('Server logout successful');
    } catch (error) {
      console.error('Server logout failed:', error);
    }
    
    // Clear all cookies thoroughly
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      // Clear for multiple paths and domains
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.replit.dev`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.aisentinel.app`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      console.log(`Cleared cookie: ${name}`);
    }
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Set a flag to force landing page display after logout
    sessionStorage.setItem('forceLogout', 'true');
    
    console.log('All data cleared, redirecting to landing page...');
    
    // Force reload to landing page (this will clear the authentication state)
    window.location.href = '/?logout=true';
  };

  // Company switching function for super-users
  const handleCompanySwitch = (companyId: number) => {
    setCurrentCompanyId(companyId);
    setShowCompanySwitcher(false);
    
    const selectedCompany = allCompanies.find((c) => c.id === companyId);
    toast({
      title: "Company Switched",
      description: `Now viewing ${selectedCompany?.name || `Company ${companyId}`}`,
    });
    
    // Refresh the page to update all company-specific data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Handle developer modal submission
  const handleDeveloperSubmit = async () => {
    if (!selectedRole || !selectedCompanyId) {
      toast({ 
        title: "Missing Selection", 
        description: "Please select both a role and company.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      // Find the selected role to get its level
      const roleData = companyRoles.find(role => role.name.toLowerCase() === selectedRole);
      if (!roleData) {
        toast({ 
          title: "Invalid Role", 
          description: "Selected role not found.", 
          variant: "destructive" 
        });
        return;
      }

      // Map role level to testRole format expected by backend
      let testRole;
      if (roleData.level === 1000) testRole = 'super-user';
      else if (roleData.level === 999) testRole = 'owner';
      else if (roleData.level === 998) testRole = 'administrator';
      else if (roleData.level === 1) testRole = 'user';
      else if (roleData.level === 0) testRole = 'demo';
      else testRole = `custom-${roleData.level}`;

      // Note: Company switching will be handled after role switching with page refresh

      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testRole, 
          companyId: selectedCompanyId !== currentCompanyId ? selectedCompanyId : undefined 
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Developer role switch successful:', result);
        
        toast({ 
          title: "Role & Company Updated", 
          description: `Successfully switched to ${selectedRole}${selectedCompanyId !== currentCompanyId ? ` and company ${selectedCompanyId}` : ''}.` 
        });
        
        setShowDeveloperModal(false);
        
        // Refresh the page to update the UI
        setTimeout(() => window.location.reload(), 100);
      } else {
        throw new Error('Failed to switch role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
      toast({ 
        title: "Error", 
        description: "Failed to switch role and company.", 
        variant: "destructive" 
      });
    }
  };

  // Initialize modal selections with current values
  useEffect(() => {
    if (showDeveloperModal) {
      // Set current role based on user's effective role level
      const currentRoleLevel = userRoleLevel;
      const currentRole = companyRoles.find(role => role.level === currentRoleLevel);
      if (currentRole) {
        setSelectedRole(currentRole.name.toLowerCase());
      } else {
        setSelectedRole('');
      }
      setSelectedCompanyId(currentCompanyId);
    }
  }, [showDeveloperModal, currentCompanyId, userRoleLevel, companyRoles]);

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
        {/* Compact Header with Company Branding and Menu Controls */}
        <div style={{ 
          backgroundColor: '#f1f5f9', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '8px 16px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '80px',
          position: 'relative'
        }}>
          {/* Left side - Menu Button */}
          <Button
            id="ai-sentinel-menu-button"
            variant="ghost"
            size="sm"
            onClick={canAccessSidebar ? () => {
              setSidebarOpen(!sidebarOpen);
              if (showTutorial) {
                completeTutorial();
              }
            } : undefined}
            disabled={!canAccessSidebar}
            style={{ 
              padding: '4px',
              minWidth: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              cursor: canAccessSidebar ? 'pointer' : 'default',
              opacity: canAccessSidebar ? 1 : 0.6,
              flexShrink: 0,
              zIndex: 1
            }}
          >
            <img
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              style={{ 
                width: '42px', 
                height: '42px', 
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
              }}
            />
          </Button>

          {/* Center - Company Branding - Absolutely positioned to center on entire screen */}
          <div style={{ 
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 0
          }}>
            <CompanyInfoLarge />
          </div>

          {/* Right side - Developer Controls or Sign Out Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, zIndex: 1 }}>
            
            {/* Features & Benefits button for demo users */}
            {isDemoMode && (
              <Button
                onClick={openDialog}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                Features & Benefits
              </Button>
            )}
            
            {/* Developer Controls */}
            <DeveloperControls />

            {/* Account Dropdown */}
            <AccountDropdown />
          </div>
        </div>
        
        {/* Chat Interface Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DemoUsageBanner />
          <ChatInterface 
            currentSession={currentSession} 
            setCurrentSession={setCurrentSession}
          />
        </div>
      </div>

      {/* Tutorial Arrow for Demo Users */}
      {showTutorial && (
        <TutorialArrow
          targetId="ai-sentinel-menu-button"
          message="Admin Menu"
          onComplete={completeTutorial}
        />
      )}

      {/* Features & Benefits Dialog */}
      <FeaturesBenefitsDialog open={showDialog} onOpenChange={(open) => !open && closeDialog()} />

      {/* Developer Controls Modal */}
      {showDeveloperModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowDeveloperModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#1e2851',
              borderRadius: '12px',
              padding: '24px',
              width: '400px',
              maxWidth: '90vw',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Developer Controls
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px'
              }}>
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
                <option value="">Choose a role...</option>
                {companyRoles
                  .sort((a, b) => b.level - a.level)
                  .map((role) => (
                    <option key={role.id} value={role.name.toLowerCase()}>
                      {role.name} (Level {role.level})
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                display: 'block',
                marginBottom: '8px'
              }}>
                Select Company
              </label>
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
                <option value="">Choose a company...</option>
                {allCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} (ID: {company.id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeveloperModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeveloperSubmit}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'white',
                  color: '#1e2851',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
