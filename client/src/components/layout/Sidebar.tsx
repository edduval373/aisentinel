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
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

import iconPath from "@assets/image_1752068939553.png";

// AI Sentinel Logo Component
const AISentinelIcon = ({ className = "w-12 h-12" }) => (
  <img 
    src={iconPath} 
    alt="AI Sentinel" 
    className={className}
  />
);

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isSuperUser = user?.role === 'super-user';
  const isAdmin = user?.role === 'admin' || user?.role === 'super-user';
  const isRegularUser = !isAdmin && !isSuperUser;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const navigation = [
    {
      name: "AI Chat",
      href: "/",
      icon: MessageSquare,
      current: location === "/",
    },
  ];

  const superUserSections = [
    {
      id: "company-setup",
      name: "Company Setup",
      icon: Building,
      items: [
        { name: "Setup Company", href: "/admin/company-setup", icon: Building },
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
    }
  ];

  const ownersSections = [
    {
      id: "owners",
      name: "Owners",
      icon: Settings,
      items: [
        { name: "Content Policies", href: "/admin/policies", icon: BookOpen },
        { name: "API Configuration", href: "/admin/api-config", icon: Settings },
        { name: "Security Settings", href: "/admin/security-settings", icon: Shield },
      ]
    }
  ];

  const adminSections = [
    {
      id: "ai-management",
      name: "AI Management",
      icon: Bot,
      items: [
        { name: "AI Models", href: "/admin/models", icon: Bot },
        { name: "Model Settings", href: "/admin/model-settings", icon: Settings },
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
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-slate-800 flex flex-col transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 bg-slate-900 border-b border-slate-700 px-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center p-1">
              <img 
                src={iconPath} 
                alt="AI Sentinel" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-white font-semibold text-lg">AI Sentinel</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-slate-400 hover:text-white hover:bg-slate-700 p-1"
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
              className={cn(
                "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                item.current
                  ? "text-white bg-slate-700"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                item.current ? "text-sentinel-blue" : "text-slate-400"
              )} />
              <span>{item.name}</span>
            </button>
          ))}

          {/* Company Management for Super User */}
          {isSuperUser && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  SUPER-USER
                </h3>
              </div>
              
              <button
                onClick={() => {
                  navigate("/admin");
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={cn(
                  "w-full flex items-center space-x-3 text-left rounded-lg px-3 py-2 transition-colors",
                  (location === "/admin" || location === "/admin/companies")
                    ? "text-white bg-slate-700"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                )}
              >
                <Building className={cn(
                  "w-5 h-5",
                  (location === "/admin" || location === "/admin/companies") ? "text-sentinel-blue" : "text-slate-400"
                )} />
                <span>Company Management</span>
              </button>

              <div className="pt-4 pb-2">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Owners
                </h3>
              </div>
              
              {superUserSections.map((section) => (
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
              
              {ownersSections.map((section) => (
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

          {/* Admin Sections */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Administration
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

      {/* User Profile */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sentinel-green rounded-full flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || "User"
              }
            </p>
            <p className="text-slate-400 text-xs capitalize">
              {user?.role || "Standard User"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-slate-700 p-1"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
