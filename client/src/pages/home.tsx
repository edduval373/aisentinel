import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
// import { isUnauthorizedError } from "@/lib/authUtils"; // Temporarily disabled
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Building2, LogOut, RotateCcw, Trash2, Star } from "lucide-react";
import TutorialArrow from "@/components/tutorial/TutorialArrow";
import { useTutorial } from "@/hooks/useTutorial";
import { DemoUsageBanner } from "@/components/demo/DemoUsageBanner";
import FeaturesBenefitsDialog from "@/components/FeaturesBenefitsDialog";
import { useFeaturesBenefits } from "@/hooks/useFeaturesBenefits";

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
  
  // Check if we're in demo mode (role level 0)
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0;
  
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0', padding: '0' }}>
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
            textAlign: 'left',
            lineHeight: '1.1',
            margin: '0',
            padding: '0'
          }}>
            {currentCompany.name}
          </div>
          {currentCompany.description && (
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
  
  // Check if we're in demo mode (role level 0)
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0;
  
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
  
  // Check if we're in demo mode (role level 0)
  const userRoleLevel = user?.roleLevel || 0;
  const isDemoMode = userRoleLevel === 0;
  
  // Features & Benefits dialog for demo users
  const { showDialog, openDialog, closeDialog } = useFeaturesBenefits(isDemoMode);
  
  // Check if user is super-user (role level 100+)
  const isSuperUserLevel = (user?.roleLevel ?? 0) >= 100;
  
  // Determine if sidebar access is allowed (demo users always have access, plus super users, owners, admins)
  const canAccessSidebar = isDemoMode || (isAuthenticated && (isSuperUser || isOwner || isAdmin || userRoleLevel >= 2));

  // Fetch all companies for super-user company switching
  const { data: allCompanies = [] } = useQuery<Array<{ id: number; name: string; description?: string }>>({
    queryKey: ['/api/admin/companies'],
    enabled: isSuperUserLevel,
  });

  // Clear cookies function for super-users
  const handleClearCookies = () => {
    console.log("Super-user clearing all cookies and session data");
    
    // Get current user email for tracking
    const currentEmail = user?.email || 'unknown';
    console.log(`Clearing session for user: ${currentEmail}`);
    
    // Clear all cookies more thoroughly
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
    
    // Clear all storage with email tracking
    const storageKeys = Object.keys(localStorage);
    console.log(`Clearing ${storageKeys.length} localStorage items`);
    localStorage.clear();
    sessionStorage.clear();
    
    // Store the email for future reference
    localStorage.setItem('lastClearedUser', currentEmail);
    localStorage.setItem('lastClearedTime', new Date().toISOString());
    
    toast({
      title: "Session Reset Complete",
      description: `All data cleared for ${currentEmail}. Returning to landing page...`,
    });
    
    // Force complete page replacement to ensure clean state
    setTimeout(() => {
      window.location.replace('/');
    }, 1500);
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
          minHeight: '54px'
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
              flexShrink: 0
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

          {/* Center - Company Branding */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            justifyContent: 'center',
            margin: '0',
            padding: '0',
            flex: 1
          }}>
            <CompanyInfoLarge />
          </div>

          {/* Right side - Super User Controls or Sign Out Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isSuperUserLevel && !isDemoMode && userRoleLevel !== 0 && (
              <>
                {/* Company Switcher */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowCompanySwitcher(!showCompanySwitcher)}
                    style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Building2 size={14} />
                    Switch Company
                  </button>
                  
                  {showCompanySwitcher && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      minWidth: '200px',
                      maxHeight: '300px',
                      overflow: 'auto'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                          Select Company (Current: {currentCompanyId})
                        </div>
                      </div>
                      {allCompanies.map((company) => (
                        <button
                          key={company.id}
                          onClick={() => handleCompanySwitch(company.id)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px',
                            fontSize: '14px',
                            color: company.id === currentCompanyId ? '#3b82f6' : '#374151',
                            backgroundColor: company.id === currentCompanyId ? '#f0f9ff' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseOver={(e) => {
                            if (company.id !== currentCompanyId) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (company.id !== currentCompanyId) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '500' }}>{company.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {company.id}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Clear Cookies Button */}
                <button
                  onClick={handleClearCookies}
                  style={{
                    fontSize: '12px',
                    color: '#dc2626',
                    background: 'white',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} />
                  Clear Cookies
                </button>
              </>
            )}
            
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
            
            {/* Sign Out/Sign Up Button with Demo indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <button
                onClick={async () => {
                  if (isDemoMode) {
                    // Demo users go to email verification screen
                    window.location.href = '/login';
                  } else {
                    // Regular users sign out and clear session
                    try {
                      console.log('Signing out user...');
                      await fetch('/api/auth/logout', { 
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      // Clear all client-side data
                      localStorage.clear();
                      sessionStorage.clear();
                      
                      // Clear all cookies manually
                      document.cookie.split(";").forEach(cookie => {
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                      });
                      
                      console.log('Session cleared, redirecting to landing page...');
                      
                      // Force redirect to landing page and reload
                      window.location.href = '/';
                      window.location.reload();
                    } catch (error) {
                      console.error('Sign out error:', error);
                      // Force redirect even if logout fails
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.href = '/';
                      window.location.reload();
                    }
                  }
                }}
                style={{
                  fontSize: '14px',
                  color: isDemoMode ? '#3b82f6' : '#64748b',
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  fontWeight: isDemoMode ? '600' : 'normal'
                }}
              >
                <LogOut size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {isDemoMode ? 'Sign Up' : 'Sign Out'}
              </button>
              {isDemoMode && (
                <div style={{
                  fontSize: '12px',
                  color: '#1e3a8a',
                  fontWeight: '600',
                  marginTop: '2px',
                  padding: '0 8px'
                }}>
                  DEMO
                </div>
              )}
            </div>
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
    </div>
  );
}
