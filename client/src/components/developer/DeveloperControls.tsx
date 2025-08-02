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
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
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
            gap: '12px',
            padding: '16px 0'
          }}>
            {/* Account Debug Tool */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                setShowAccountDebug(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left' as const,
                justifyContent: 'flex-start',
                width: '100%',
                color: '#374151'
              }}
            >
              <User style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  Account Debug Tool
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  View and manage saved account data, localStorage debugging
                </div>
              </div>
            </Button>

            {/* System Debug Panel */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                setShowSystemDebug(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left' as const,
                justifyContent: 'flex-start',
                width: '100%',
                color: '#374151'
              }}
            >
              <Bug style={{ width: '20px', height: '20px', color: '#ef4444' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  System Debug Panel
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                  Application status, API health, and system diagnostics
                </div>
              </div>
            </Button>

            {/* Database Tools */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                // Could add database debugging tools here
              }}
              disabled
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'not-allowed',
                textAlign: 'left' as const,
                justifyContent: 'flex-start',
                width: '100%',
                color: '#9ca3af'
              }}
            >
              <Database style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  Database Tools
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  Coming soon - Database diagnostics and management
                </div>
              </div>
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