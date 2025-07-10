import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import iconPath from "@assets/icononly_nobuffer_1752067577689.png";

// AI Sentinel Logo Component
const AISentinelIcon = ({ className = "w-10 h-10" }) => (
  <img 
    src={iconPath} 
    alt="AI Sentinel" 
    className={className}
  />
);

// Company Info Component
const CompanyInfo = () => {
  const { data: currentCompany } = useQuery({
    queryKey: ['/api/user/current-company'],
    retry: false,
  });

  if (!currentCompany) return null;

  return (
    <div className="flex items-center space-x-2">
      {currentCompany.logo ? (
        <img 
          src={currentCompany.logo} 
          alt={`${currentCompany.name} logo`}
          className="w-8 h-8 rounded object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded bg-slate-300 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-slate-600" />
        </div>
      )}
      <span className="text-lg font-semibold text-slate-800">
        {currentCompany.name} ({currentCompany.id})
      </span>
    </div>
  );
};

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
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Header with Menu Button - Fixed Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              style={{ transform: 'translateY(10px)' }}
            >
              <AISentinelIcon className="w-14 h-14" />
            </Button>
            <CompanyInfo />
          </div>
          
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-slate-800">AI Sentinel Chat</h1>
          </div>
        </div>
        
        {/* Chat Interface Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface 
            currentSession={currentSession} 
            setCurrentSession={setCurrentSession}
          />
        </div>
      </div>
    </div>
  );
}
