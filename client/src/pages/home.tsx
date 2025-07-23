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
const CompanyInfo = () => {
  const { data: currentCompany } = useQuery({
    queryKey: ['/api/user/current-company'],
    retry: false,
  });

  if (!currentCompany) return null;

  const company = currentCompany as any; // Type assertion for now

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {company.logo ? (
        <img 
          src={company.logo} 
          alt={`${company.name} logo`}
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '4px', 
            objectFit: 'cover' 
          }}
        />
      ) : (
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '4px', 
          backgroundColor: '#cbd5e1', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Building2 style={{ width: '16px', height: '16px', color: '#64748b' }} />
        </div>
      )}
      <span style={{ 
        fontSize: '18px', 
        fontWeight: 600, 
        color: '#1e293b' 
      }}>
        {company.name} ({company.id})
      </span>
    </div>
  );
};

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              style={{ 
                color: '#64748b',
                padding: '2px',
                minWidth: '24px',
                height: '24px'
              }}
            >
              <img 
                src="/ai-sentinel-logo.png" 
                alt="AI Sentinel" 
                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
              />
            </Button>
            <CompanyInfo />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>AI Sentinel Chat</h1>
          </div>
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
