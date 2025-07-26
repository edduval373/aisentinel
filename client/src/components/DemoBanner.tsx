import { Eye } from "lucide-react";
import { isDemoModeActive } from "@/utils/demoMode";
import { useAuth } from "@/hooks/useAuth";

interface DemoBannerProps {
  message?: string;
}

export default function DemoBanner({ message = "Demo Mode - Read Only View" }: DemoBannerProps) {
  const { user } = useAuth();
  const isDemoMode = isDemoModeActive(user);

  if (!isDemoMode) {
    return null;
  }

  return (
    <div style={{
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      fontWeight: '500',
      marginLeft: '16px'
    }}>
      <Eye style={{ width: '16px', height: '16px' }} />
      <span>{message}</span>
    </div>
  );
}