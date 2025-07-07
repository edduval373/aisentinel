import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Wifi, WifiOff, Download } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isConnected?: boolean;
  onExportReport?: () => void;
  showConnectionStatus?: boolean;
  showExportButton?: boolean;
  children?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  isConnected = true,
  onExportReport,
  showConnectionStatus = true,
  showExportButton = false,
  children
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          {subtitle && (
            <Badge variant="secondary" className="text-xs">
              {subtitle}
            </Badge>
          )}
          {showConnectionStatus && (
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-sentinel-green" />
              ) : (
                <WifiOff className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-sm text-slate-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {children}
          
          {showExportButton && onExportReport && (
            <Button
              onClick={onExportReport}
              className="bg-sentinel-blue hover:bg-blue-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
