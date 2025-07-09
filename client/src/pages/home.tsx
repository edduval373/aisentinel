import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";

import iconPath from "@assets/icononly_nobuffer_1752067577689.png";

// AI Sentinel Logo Component
const AISentinelIcon = ({ className = "w-10 h-10" }) => (
  <img 
    src={iconPath} 
    alt="AI Sentinel" 
    className={className}
  />
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
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 mr-2"
          >
            <AISentinelIcon className="w-10 h-10" />
          </Button>
          <h1 className="text-lg font-semibold text-slate-800 ml-1">AI Sentinel Dashboard</h1>
        </div>
        
        <ChatInterface 
          currentSession={currentSession} 
          setCurrentSession={setCurrentSession}
        />
      </div>
    </div>
  );
}
