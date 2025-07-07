import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, MessageSquare, Settings, BarChart3, BookOpen, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = [
    {
      name: "AI Chat",
      href: "/",
      icon: MessageSquare,
      current: location === "/",
    },
    {
      name: "Administration",
      href: "/admin",
      icon: Settings,
      current: location === "/admin",
      adminOnly: true,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
      current: location === "/reports",
      adminOnly: true,
    },
    {
      name: "Policies",
      href: "/policies",
      icon: BookOpen,
      current: location === "/policies",
      adminOnly: true,
    },
  ];

  return (
    <div className="w-64 bg-slate-800 flex flex-col">
      {/* Logo and Brand */}
      <div className="flex items-center justify-center h-16 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sentinel-blue rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-white font-semibold text-lg">AI Sentinel</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.href)}
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
          );
        })}
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
  );
}
