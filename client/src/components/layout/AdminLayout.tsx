import { useState } from "react";
import { Button } from "@/components/ui/button-standard";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";



interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function AdminLayout({ children, title, subtitle, rightContent }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      backgroundColor: '#f8fafc' 
    }}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* Top Header with Menu Button */}
        <div style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '12px 16px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              style={{ 
                color: '#64748b',
                padding: '8px'
              }}
            >
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
            </Button>
            <div>
              <h1 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1e293b',
                margin: 0 
              }}>{title}</h1>
              {subtitle && <p style={{ 
                fontSize: '14px', 
                color: '#64748b',
                margin: 0 
              }}>{subtitle}</p>}
            </div>
          </div>
          {rightContent && (
            <div style={{ flexShrink: 0 }}>
              {rightContent}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '24px'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Also export as named export for backwards compatibility
export { AdminLayout };