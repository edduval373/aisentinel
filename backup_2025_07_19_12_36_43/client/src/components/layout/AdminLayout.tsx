import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";



interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <img 
              src="/ai-sentinel-logo.png" 
              alt="AI Sentinel" 
              className="w-10 h-10 object-contain"
            />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
            {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Also export as named export for backwards compatibility
export { AdminLayout };