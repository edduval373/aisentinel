import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button-standard";
import { 
  Shield, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  BookOpen, 
  LogOut, 
  User, 
  X,
  Bot,
  Activity,
  Users,
  ChevronRight,
  Building,
  FileText,
  ShieldCheck,
  Key,
  UserCog,
  Layers
} from "lucide-react";



interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  // Cache-busting comment - force browser update
  const { user } = useAuth(); // Re-enabled to get Railway database user data
  const [location, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Fetch current company data from companies table using user's companyId
  const { data: currentCompany } = useQuery<{id: number, name: string}>({
    queryKey: ['/api/user/current-company'],
    enabled: !!user?.companyId, // Only fetch if user has a company ID
  });

  // Role-based access levels
  const roleLevel = user?.roleLevel ?? 1;
  const isDemoUser = roleLevel === 0;
  const isRegularUser = roleLevel === 1;
  const isAdmin = roleLevel >= 998;
  const isOwner = roleLevel >= 999;
  const isSuperUser = roleLevel >= 1000;
  
  console.log('🔧 [SIDEBAR] Role check:', { roleLevel, isDemoUser, isRegularUser, isAdmin, isOwner, isSuperUser });
  console.log('🔧 [SIDEBAR] Section visibility:', { 
    superUserVisible: isSuperUser, 
    ownerVisible: isOwner, 
    adminVisible: isAdmin || isDemoUser 
  });
  // Section definitions moved here to fix declaration order
  const superUserSections = [
    {
      id: "company-management",
      name: "Company Management",
      href: "/admin/companies",
      icon: Building,
    },
    {
      id: "create-providers", 
      name: "Create AI Providers",
      href: "/admin/create-providers",
      icon: Settings,
    },
    {
      id: "create-models", 
      name: "Create AI Model Templates",
      href: "/admin/create-models",
      icon: Layers,
    }
  ];

  const ownersSections = [
    {
      id: "company-setup",
      name: "Company Setup", 
      href: "/admin/company-setup",
      icon: Building,
    },
    {
      id: "model-fusion",
      name: "Setup Model Fusion",
      href: "/admin/model-fusion", 
      icon: ShieldCheck,
    },
    {
      id: "api-keys",
      name: "Setup API Keys",
      href: "/admin/setup-api-keys",
      icon: Key,
    }
  ];

  console.log('🔧 [SIDEBAR] Rendering with sections:', {
    superUserSectionsCount: isSuperUser ? superUserSections.length : 0,
    ownerSectionsCount: isOwner ? ownersSections.length : 0,
    isOpen,
    location
  });
  
  console.log('🔧 [SIDEBAR] Role detection:', {
    userEmail: user?.email,
    userRole: user?.role,
    userRoleLevel: user?.roleLevel,
    isDemoUser,
    isSuperUser,
    isOwner,
    isAdmin,
    isRegularUser
  });
  
  // Always show sidebar - no authentication restrictions
  // const isUnauthenticated = !user;
  
  // Remove all authentication restrictions
  // if (isRegularUser && !isUnauthenticated) {
  //   return null;
  // }

  // const { logout } = useAuth(); // Temporarily disabled
  
  const handleLogout = async () => {
    // await logout(); // Temporarily disabled
    console.log('Logout functionality disabled in unauthenticated mode');
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  // Remove AI Chat navigation item - logo will handle chat navigation now
  const navigation: Array<{name: string, href: string, current: boolean}> = [];

  const adminSections = [
    {
      id: "ai-management",
      name: "AI Management",
      icon: Bot,
      items: [
        { name: "Model Settings", href: "/admin/model-settings", icon: Settings },
        { name: "Context Management", href: "/admin/context-management", icon: FileText },
      ]
    },
    {
      id: "activity-management", 
      name: "Activity Management",
      icon: Activity,
      items: [
        { name: "Activity Types", href: "/admin/activity-types", icon: Activity },
        { name: "Permissions", href: "/admin/permissions", icon: Shield },
      ]
    },
    {
      id: "user-management",
      name: "User Management", 
      icon: Users,
      items: [
        { name: "Users", href: "/admin/role-management", icon: UserCog },
        { name: "Roles", href: "/admin/roles", icon: Shield },
      ]
    },
    {
      id: "monitoring",
      name: "Monitoring & Reports",
      icon: BarChart3,
      items: [
        { name: "Activity Logs", href: "/admin/logs", icon: BarChart3 },
        { name: "Security Reports", href: "/admin/security", icon: Shield },
        { name: "Usage Analytics", href: "/admin/analytics", icon: BarChart3 },
      ]
    },
    {
      id: "system",
      name: "System Settings",
      icon: Settings,
      items: [
        { name: "Content Policies", href: "/admin/policies", icon: BookOpen },
        { name: "Security Settings", href: "/admin/security-settings", icon: Shield },
      ]
    }
  ];

  return (
    <>
      {/* Overlay - click outside to close */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        width: '320px',
        backgroundColor: '#1e2851',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 300ms ease-in-out'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: '64px', 
          padding: '0 16px',
          backgroundColor: '#1e2851', 
          borderBottom: '1px solid #3b82f6' 
        }}>
          <button 
            onClick={() => {
              // If already on chat page, just close the sidebar
              if (location === '/chat' || location === '/demo' || location === '/') {
                onToggle();
              } else {
                // Navigate to chat and close on mobile
                navigate('/chat');
                if (window.innerWidth < 1024) onToggle();
              }
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel Chat" 
              style={{ 
                width: '32px', 
                height: '32px', 
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'invert(1) brightness(2) contrast(1)',
                background: 'transparent',
                mixBlendMode: 'screen'
              }}
            />
            <span style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 600 
            }}>
              AI Sentinel Chat
            </span>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            style={{ color: 'white', padding: '4px' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </Button>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: '16px', 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto' 
        }}>
          {/* Main Navigation */}
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                if (item.current) {
                  // If already on this page, just close the sidebar
                  onToggle();
                } else {
                  // Navigate to the page
                  navigate(item.href);
                  if (window.innerWidth < 1024) onToggle(); // Close on mobile
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                borderRadius: '8px',
                padding: '8px 12px',
                transition: 'all 0.2s',
                color: item.current ? 'white' : '#e2e8f0',
                backgroundColor: item.current ? '#3b82f6' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!item.current) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.current) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
            >
              <MessageSquare style={{ width: '20px', height: '20px' }} />
              <span>{item.name}</span>
            </button>
          ))}

          {/* SUPER-USER Section - Only for role level 1000+ */}
          {isSuperUser && (
            <>
              <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
                <h3 style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  SUPER-USER ({superUserSections.length} items) - PRODUCTION
                </h3>
              </div>
              
              {superUserSections.map((section) => {
                console.log('🔧 [SIDEBAR] PRODUCTION - Rendering super-user section:', section.name, section.id);
                return (
                <button
                  key={section.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('🔧 [SIDEBAR] Button clicked:', section.name, 'href:', section.href);
                    
                    if (location === section.href) {
                      console.log('🔧 [SIDEBAR] Already on this page, closing sidebar');
                      onToggle();
                    } else {
                      console.log('🔧 [SIDEBAR] Navigating to:', section.href);
                      navigate(section.href);
                      if (window.innerWidth < 1024) onToggle(); // Close on mobile
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    transition: 'all 0.2s',
                    color: location === section.href ? 'white' : '#e2e8f0',
                    backgroundColor: location === section.href ? '#3b82f6' : 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (location !== section.href) {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location !== section.href) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                >
                  <section.icon style={{ width: '20px', height: '20px' }} />
                  <span>{section.name}</span>
                </button>
                );
              })}
            </>
          )}

          {/* OWNERS Section - Only for role level 999+ (owners and super-users) */}
          {isOwner && (
            <>
              <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
                <h3 style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  OWNERS
                </h3>
              </div>
              
              {ownersSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    console.log('🔧 [SIDEBAR] Owner section clicked:', section.name, section.href);
                    if (location === section.href) {
                      // If already on this page, just close the sidebar
                      onToggle();
                    } else {
                      // Navigate to the page
                      navigate(section.href);
                      if (window.innerWidth < 1024) onToggle(); // Close on mobile
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    transition: 'all 0.2s',
                    color: location === section.href ? 'white' : '#cbd5e1',
                    backgroundColor: location === section.href ? '#374151' : 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (location !== section.href) {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location !== section.href) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#cbd5e1';
                    }
                  }}
                >
                  <section.icon style={{ 
                    width: '20px', 
                    height: '20px',
                    color: location === section.href ? '#3b82f6' : '#94a3b8'
                  }} />
                  <span>{section.name}</span>
                </button>
              ))}
            </>
          )}

          {/* ADMINISTRATION Section - For role level 998+ (admins, owners, super-users) and demo users (0) */}
          {(isAdmin || isDemoUser) && (
            <>
              <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
                <h3 style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  ADMINISTRATION
                </h3>
              </div>
              
              {adminSections.map((section) => (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => {
                      console.log('🔧 [SIDEBAR] Admin section toggle clicked:', section.name, section.id);
                      toggleSection(section.id);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      transition: 'all 0.2s',
                      color: '#cbd5e1',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <section.icon style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
                      <span>{section.name}</span>
                    </div>
                    <ChevronRight style={{
                      width: '16px',
                      height: '16px',
                      color: '#94a3b8',
                      transition: 'transform 0.2s',
                      transform: expandedSection === section.id ? 'rotate(90deg)' : 'rotate(0deg)'
                    }} />
                  </button>
                  
                  {expandedSection === section.id && (
                    <div style={{ marginLeft: '32px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {section.items.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => {
                            console.log('🔧 [SIDEBAR] Admin item clicked:', item.name, item.href);
                            if (location === item.href) {
                              // If already on this page, just close the sidebar
                              onToggle();
                            } else {
                              // Navigate to the page
                              navigate(item.href);
                              if (window.innerWidth < 1024) onToggle(); // Close on mobile
                            }
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            transition: 'all 0.2s',
                            fontSize: '14px',
                            color: location === item.href ? 'white' : '#9ca3af',
                            backgroundColor: location === item.href ? '#374151' : 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            if (location !== item.href) {
                              e.currentTarget.style.backgroundColor = '#374151';
                              e.currentTarget.style.color = 'white';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (location !== item.href) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#9ca3af';
                            }
                          }}
                        >
                          <item.icon style={{ width: '16px', height: '16px' }} />
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </nav>

      {/* Bottom section */}
      <div style={{ borderTop: '1px solid #3b82f6', padding: '12px' }}>
        {/* Current Company Display - shows company data from database or fallback to user data */}
        {((currentCompany?.name) || (user?.companyName && user?.companyId)) && (
          <div style={{ 
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid #374151'
          }}>
            <div style={{ 
              color: '#94a3b8', 
              fontSize: '10px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              CURRENT COMPANY
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Building style={{ 
                width: '20px', 
                height: '20px', 
                color: '#94a3b8',
                flexShrink: 0
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: '#f1f5f9',
                  fontSize: '12px',
                  fontWeight: '500',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {currentCompany?.name || user?.companyName || 'Current Company'}
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '10px'
                }}>
                  ID: {currentCompany?.id || user?.companyId || 1}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* User Info Display */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#e2e8f0',
          fontSize: '12px'
        }}>
          <div style={{ 
            width: '24px', 
            height: '24px', 
            backgroundColor: '#3b82f6', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
              U
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: '500', 
              color: '#f1f5f9',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Unknown User'}
            </div>
            <div style={{ 
              color: '#94a3b8', 
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {user?.role || 'User'} (Level {user?.roleLevel || 0})
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
