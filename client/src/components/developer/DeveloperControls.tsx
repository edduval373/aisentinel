import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings, User, Bug, Database, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AccountDebugger from "@/components/debug/AccountDebugger";
import { DebugStatusPanel } from "@/components/DebugStatusPanel";

export default function DeveloperControls() {
  const { user } = useAuth();
  const [showAccountDebug, setShowAccountDebug] = useState(false);
  const [showSystemDebug, setShowSystemDebug] = useState(false);
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);

  console.log('🔧 [DEVELOPER CONTROLS] Rendering - User:', user?.email, 'Role Level:', user?.roleLevel);

  // Only show for super users (role level 1000+)
  if (!user || user.roleLevel < 1000) {
    console.log('🔧 [DEVELOPER CONTROLS] Hidden - insufficient role level:', user?.roleLevel);
    return null;
  }

  console.log('🔧 [DEVELOPER CONTROLS] Visible for super user');

  return (
    <div style={{ position: 'relative' }}>
      {/* Developer Menu Trigger */}
      <Dialog open={showDeveloperMenu} onOpenChange={setShowDeveloperMenu}>
        <DialogTrigger asChild>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Developer Tools"
          >
            <Settings style={{ width: '16px', height: '16px', color: '#374151' }} />
          </button>
        </DialogTrigger>
        <DialogContent style={{ maxWidth: '500px' }}>
          <DialogHeader>
            <DialogTitle style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <Settings style={{ width: '20px', height: '20px' }} />
              Developer Controls
            </DialogTitle>
          </DialogHeader>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            padding: '8px 0'
          }}>
            {/* Developer Controls */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                setShowAccountDebug(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left' as const,
                justifyContent: 'flex-start',
                width: '100%',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Settings style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
              Developer Controls
            </Button>

            {/* User Toolkit */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                setShowSystemDebug(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left' as const,
                justifyContent: 'flex-start',
                width: '100%',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <User style={{ width: '18px', height: '18px', color: '#22c55e' }} />
              User Toolkit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Debug Modal */}
      <Dialog open={showAccountDebug} onOpenChange={setShowAccountDebug}>
        <DialogContent style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <User style={{ width: '20px', height: '20px' }} />
              Account Debug Tool
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '8px 0' }}>
            <AccountDebugger />
          </div>
        </DialogContent>
      </Dialog>

      {/* System Debug Modal */}
      <Dialog open={showSystemDebug} onOpenChange={setShowSystemDebug}>
        <DialogContent style={{ maxWidth: '900px', maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <Bug style={{ width: '20px', height: '20px' }} />
              System Debug Panel
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '8px 0' }}>
            <DebugStatusPanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}