import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
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
  Eye,
  ChevronRight,
  Building,
  FileText,
  Brain,
  Key
} from "lucide-react";



interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth(); // Re-enabled to get Railway database user data
  const [location, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isDemoUser = user?.roleLevel === 0;
  const isSuperUser = user?.role === 'super-user' || (user?.roleLevel ?? 0) >= 100;
  const isOwner = user?.role === 'owner' || (user?.roleLevel ?? 0) >= 99;
  const isAdmin = user?.role === 'admin' || (user?.roleLevel ?? 0) >= 2;
  const isRegularUser = user?.role === 'user' || user?.roleLevel === 1;
  
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

  const navigation: Array<{name: string, href: string, current: boolean}> = [
    { name: "AI Chat", href: "/chat", current: location === "/chat" || location === "/" }
  ];

  const superUserSections = [
    {
      id: "company-management",
      name: "Company Management",
      href: "/admin/company-management",
      icon: Building,
    },
    {
      id: "setup-api-keys",
      name: "Setup API Keys", 
      href: "/admin/setup-api-keys",
      icon: Key,
    }
  ];

  const ownersSections = [];

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
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Roles", href: "/admin/roles", icon: Shield },
      ]
    },
    {
      id: "monitoring",
      name: "Monitoring & Reports",
      icon: Eye,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
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
              AI Sentinel
            </span>
          </div>
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

          {/* SUPER-USER Section */}
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
                  SUPER-USER
                </h3>
              </div>
              
              <button
                onClick={() => {
                  if (location === "/admin") {
                    // If already on this page, just close the sidebar
                    onToggle();
                  } else {
                    // Navigate to the page
                    navigate("/admin");
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
                  color: location === "/admin" ? 'white' : '#e2e8f0',
                  backgroundColor: location === "/admin" ? '#3b82f6' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (location !== "/admin") {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== "/admin") {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
              >
                <Building style={{ width: '20px', height: '20px' }} />
                <span>Company Management</span>
              </button>
              
              <button
                onClick={() => {
                  if (location === "/admin/setup-api-keys") {
                    // If already on this page, just close the sidebar
                    onToggle();
                  } else {
                    // Navigate to the page
                    navigate("/admin/setup-api-keys");
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
                  color: location === "/admin/setup-api-keys" ? 'white' : '#cbd5e1',
                  backgroundColor: location === "/admin/setup-api-keys" ? '#374151' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (location !== "/admin/setup-api-keys") {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== "/admin/setup-api-keys") {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Key style={{ 
                  width: '20px', 
                  height: '20px',
                  color: location === "/admin/setup-api-keys" ? '#3b82f6' : '#94a3b8'
                }} />
                <span>Setup API Keys</span>
              </button>
            </>
          )}

          {/* OWNERS Section - visible to super-user and owners */}
          {(isSuperUser || isOwner) && (
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
              
              <button
                onClick={() => {
                  if (location === "/admin/company-setup") {
                    // If already on this page, just close the sidebar
                    onToggle();
                  } else {
                    // Navigate to the page
                    navigate("/admin/company-setup");
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
                  color: location === "/admin/company-setup" ? 'white' : '#cbd5e1',
                  backgroundColor: location === "/admin/company-setup" ? '#374151' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (location !== "/admin/company-setup") {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== "/admin/company-setup") {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Building style={{ 
                  width: '20px', 
                  height: '20px',
                  color: location === "/admin/company-setup" ? '#3b82f6' : '#94a3b8'
                }} />
                <span>Setup Company</span>
              </button>
              
              <button
                onClick={() => {
                  if (location === "/admin/create-models") {
                    // If already on this page, just close the sidebar
                    onToggle();
                  } else {
                    // Navigate to the page
                    navigate("/admin/create-models");
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
                  color: location === "/admin/create-models" ? 'white' : '#cbd5e1',
                  backgroundColor: location === "/admin/create-models" ? '#374151' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (location !== "/admin/create-models") {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== "/admin/create-models") {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Bot style={{ 
                  width: '20px', 
                  height: '20px',
                  color: location === "/admin/create-models" ? '#3b82f6' : '#94a3b8'
                }} />
                <span>Setup AI Models</span>
              </button>
              
              <button
                onClick={() => {
                  if (location === "/admin/model-fusion") {
                    // If already on this page, just close the sidebar
                    onToggle();
                  } else {
                    // Navigate to the page
                    navigate("/admin/model-fusion");
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
                  color: location === "/admin/model-fusion" ? 'white' : '#cbd5e1',
                  backgroundColor: location === "/admin/model-fusion" ? '#374151' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (location !== "/admin/model-fusion") {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location !== "/admin/model-fusion") {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
              >
                <Brain style={{ 
                  width: '20px', 
                  height: '20px',
                  color: location === "/admin/model-fusion" ? '#3b82f6' : '#94a3b8'
                }} />
                <span>Setup Model Fusion</span>
              </button>
            </>
          )}

          {/* ADMINISTRATION Section - visible to super-user, owners, admins, and demo users */}
          {(isSuperUser || isOwner || isAdmin || isDemoUser) && (
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
                    onClick={() => toggleSection(section.id)}
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
