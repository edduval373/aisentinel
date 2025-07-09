import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";

// AI Sentinel Logo Component
const AISentinelIcon = ({ className = "w-5 h-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="sentinelGradHome" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    {/* Shield outline */}
    <path 
      d="M12 2L4 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z" 
      stroke="url(#sentinelGradHome)" 
      strokeWidth="2" 
      fill="none"
    />
    {/* AI Eye/Core */}
    <circle 
      cx="12" 
      cy="12" 
      r="3" 
      fill="url(#sentinelGradHome)"
    />
    {/* Neural network lines */}
    <path 
      d="M12 9v-2M12 17v-2M9 12h-2M17 12h-2M10.5 10.5l-1.5-1.5M15.5 13.5l1.5 1.5M13.5 10.5l1.5-1.5M10.5 13.5l-1.5 1.5" 
      stroke="url(#sentinelGradHome)" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sentinel-blue mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col">
        {/* Top Header with Menu Button */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 mr-4"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-slate-800">AI Sentinel Dashboard</h1>
        </div>
        
        <ChatInterface 
          currentSession={currentSession} 
          setCurrentSession={setCurrentSession}
        />
      </div>
    </div>
  );
}
