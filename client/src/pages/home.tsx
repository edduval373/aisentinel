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



interface Company {
  id: number;
  name: string;
  logo?: string;
  description?: string;
}

function CompanyInfo() {
  const { data: currentCompany } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
  });

  if (!currentCompany) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#3b82f6', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600
        }}>
          ?
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {currentCompany.logo ? (
        <img 
          src={currentCompany.logo} 
          alt={currentCompany.name}
          style={{ 
            width: '48px', 
            height: '48px', 
            objectFit: 'contain',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}
        />
      ) : (
        <div style={{ 
          width: '48px', 
          height: '48px', 
          backgroundColor: '#3b82f6', 
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 600
        }}>
          {currentCompany.name.charAt(0).toUpperCase()}
        </div>
      )}
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
    </div>
  );
}

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
        {/* Top Header with Menu Button - Fixed Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '8px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '56px'
        }}>
          {/* Left side - Logo and Company */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              style={{ 
                padding: '4px',
                minWidth: '64px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent'
              }}
            >
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
            </Button>
            
            {/* Company Info from Database */}
            <CompanyInfo />
          </div>
          
          {/* Right side - Page Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>AI Sentinel Chat</h1>
          </div>
        </div>
        
        {/* Chat Interface Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Trial Banner - Temporarily disabled */}
          {/* <div style={{ padding: '16px 16px 0 16px' }}>
            <TrialBanner />
          </div> */}
          
          <ChatInterface 
            currentSession={currentSession} 
            setCurrentSession={setCurrentSession}
          />
        </div>
      </div>
    </div>
  );
}
