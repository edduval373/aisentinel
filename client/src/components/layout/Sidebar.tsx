import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";



interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth(); // Re-enabled to get Railway database user data
  const [location, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const navigation = [];

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
        { name: "API Configuration", href: "/admin/api-config", icon: Settings },
        { name: "Security Settings", href: "/admin/security-settings", icon: Shield },
      ]
    }
  ];

  return (
    <>
      {/* Overlay - click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:bg-opacity-20 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-80"
      )} style={{ backgroundColor: '#1e3a8a' }}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4" style={{ backgroundColor: '#1e40af', borderBottom: '1px solid #3b82f6' }}>
          <div className="flex items-center space-x-3">
            <div style={{ 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
            </div>

          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            style={{ color: 'white', padding: '4px' }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {/* Main Navigation */}
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                if (window.innerWidth < 1024) onToggle(); // Close on mobile
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
              <item.icon style={{ width: '20px', height: '20px' }} />
              <span>{item.name}</span>
            </button>
          ))}

          {/* SUPER-USER Section */}
          {isSuperUser && (
            <>
              <div className="pt-4 pb-2">
                <h3 style={{ 
                  color: '#94a3b8', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  SUPER-USER
                </h3>
              </div>
              
              <button
                onClick={() => {
                  navigate("/admin");
                  if (window.innerWidth < 1024) onToggle();
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
                  navigate("/admin/setup-api-keys");
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                  location === "/admin/setup-api-keys"
                    ? "text-white bg-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Key className={cn(
                  "w-5 h-5",
                  location === "/admin/setup-api-keys" ? "text-sentinel-blue" : "text-slate-400"
                )} />
                <span>Setup API Keys</span>
              </button>
            </>
          )}

          {/* OWNERS Section - visible to super-user and owners */}
          {(isSuperUser || isOwner) && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  OWNERS
                </h3>
              </div>
              
              <button
                onClick={() => {
                  navigate("/admin/company-setup");
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                  location === "/admin/company-setup"
                    ? "text-white bg-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Building className={cn(
                  "w-5 h-5",
                  location === "/admin/company-setup" ? "text-sentinel-blue" : "text-slate-400"
                )} />
                <span>Setup Company</span>
              </button>
              
              <button
                onClick={() => {
                  navigate("/admin/create-models");
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                  location === "/admin/create-models"
                    ? "text-white bg-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Bot className={cn(
                  "w-5 h-5",
                  location === "/admin/create-models" ? "text-sentinel-blue" : "text-slate-400"
                )} />
                <span>Setup AI Models</span>
              </button>
              
              <button
                onClick={() => {
                  navigate("/admin/model-fusion");
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                  location === "/admin/model-fusion"
                    ? "text-white bg-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Brain className={cn(
                  "w-5 h-5",
                  location === "/admin/model-fusion" ? "text-sentinel-blue" : "text-slate-400"
                )} />
                <span>Setup Model Fusion</span>
              </button>
            </>
          )}

          {/* ADMINISTRATION Section - visible to super-user, owners, and admins */}
          {(isSuperUser || isOwner || isAdmin) && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  ADMINISTRATION
                </h3>
              </div>
              
              {adminSections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between text-left rounded-lg px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5 text-slate-400" />
                      <span>{section.name}</span>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-slate-400 transition-transform",
                      expandedSection === section.id && "rotate-90"
                    )} />
                  </button>
                  
                  {expandedSection === section.id && (
                    <div className="ml-8 space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.href}
                          onClick={() => {
                            navigate(item.href);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={cn(
                            "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors text-sm",
                            location === item.href
                              ? "text-white bg-slate-700"
                              : "text-slate-400 hover:text-white hover:bg-slate-700"
                          )}
                        >
                          <item.icon className="w-4 h-4" />
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
      <div style={{ borderTop: '1px solid #3b82f6', padding: '8px' }}>
        {/* Clean footer area */}
      </div>
    </div>
    </>
  );
}
