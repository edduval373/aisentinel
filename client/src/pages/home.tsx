import { useEffect, useState } from "react";
// import { useAuth } from "@/hooks/useAuth"; // Temporarily disabled
import { useToast } from "@/hooks/use-toast";
// import { isUnauthorizedError } from "@/lib/authUtils"; // Temporarily disabled
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import ChatInterface from "@/components/chat/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { TrialBanner } from "@/components/TrialBanner";



// Company Info Component - Pure CSS styling like landing page
// Removed CompanyInfo component - now handled directly in header

export default function Home() {
  const { toast } = useToast();
  // const { isAuthenticated, isLoading } = useAuth(); // Temporarily disabled
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top Header - Simple and compact */}
        <div style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '4px 8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          height: '40px',
          position: 'relative'
        }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            style={{ 
              position: 'absolute',
              left: '8px',
              color: '#64748b',
              padding: '4px',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src="/ai-sentinel-logo-mini.svg" 
              alt="Menu" 
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
          </Button>
          
          <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>AI Sentinel</h1>
        </div>
        
        {/* Chat Interface Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Trial Banner */}
          <div style={{ padding: '16px 16px 0 16px' }}>
            <TrialBanner />
          </div>
          
          <ChatInterface 
            currentSession={currentSession} 
            setCurrentSession={setCurrentSession}
          />
        </div>
      </div>
    </div>
  );
}
