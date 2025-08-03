import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Bug } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { AiModel, ActivityType, ChatMessage, ChatSession } from "@shared/schema";

export default function DeveloperControls() {
  const { user } = useAuth();
  const [showChatDebug, setShowChatDebug] = useState(false);
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);

  // Fetch data for debug panel
  const { data: aiModels, isLoading: modelsLoading, error: modelsError } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });

  const { data: activityTypes, isLoading: typesLoading, error: typesError } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
  });

  const { data: debugMessages, isLoading: debugMessagesLoading, error: messagesError } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/session', 'debug', 'messages'],
    enabled: false, // Only fetch when debug panel is open
  });

  const { data: debugSessions, isLoading: debugSessionsLoading, error: sessionsError } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: false, // Only fetch when debug panel is open
  });

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
            title="Settings"
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
              Settings
            </DialogTitle>
          </DialogHeader>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            padding: '8px 0'
          }}>
            {/* Chat Debug Panel */}
            <Button
              onClick={() => {
                setShowDeveloperMenu(false);
                setShowChatDebug(true);
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
              <Bug style={{ width: '18px', height: '18px', color: '#ef4444' }} />
              Chat Debug Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Debug Panel Modal */}
      <Dialog open={showChatDebug} onOpenChange={setShowChatDebug}>
        <DialogContent style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <Bug style={{ width: '20px', height: '20px' }} />
              Chat Debug Panel
            </DialogTitle>
          </DialogHeader>
          <div style={{ padding: '8px 0' }}>
            {/* Authentication Status */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: user?.isAuthenticated ? '#22c55e' : '#ef4444' 
                }} />
                Authentication Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>Authenticated:</strong> {user?.isAuthenticated ? 'Yes' : 'No'}</div>
                <div><strong>User ID:</strong> {user?.id || 'Not available'}</div>
                <div><strong>Email:</strong> {user?.email || 'Not available'}</div>
                <div><strong>Role:</strong> {user?.role || 'Not available'}</div>
                <div><strong>Role Level:</strong> {user?.roleLevel || 'Not available'}</div>
                <div><strong>Company ID:</strong> {user?.companyId || 'Not available'}</div>
                <div><strong>Company Name:</strong> {user?.companyName || 'Not available'}</div>
                <div><strong>Auth Token:</strong> {localStorage.getItem('authToken') ? 'Present' : 'Missing'}</div>
              </div>
            </div>

            {/* AI Model Configuration */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: aiModels && aiModels.length > 0 ? '#22c55e' : '#ef4444' 
                }} />
                AI Model Configuration
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>Models Available:</strong> {aiModels?.length || 0}</div>
                <div><strong>Activity Types:</strong> {activityTypes?.length || 0}</div>
                <div><strong>Models Loading:</strong> {modelsLoading ? 'Yes' : 'No'}</div>
                <div><strong>Types Loading:</strong> {typesLoading ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Connection Status */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#22c55e'
                }} />
                Connection Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>API Connection:</strong> Active</div>
                <div><strong>Environment:</strong> {import.meta.env.MODE || 'production'}</div>
                <div><strong>Demo Mode:</strong> {user?.roleLevel === 0 ? 'Yes' : 'No'}</div>
                <div><strong>Base URL:</strong> {window.location.origin}</div>
              </div>
            </div>

            {/* LocalStorage Variables */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px' 
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#374151' 
              }}>
                LocalStorage Variables
              </h3>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <div><strong>authToken:</strong> {localStorage.getItem('authToken') || 'null'}</div>
                <div><strong>currentCompanyId:</strong> {localStorage.getItem('currentCompanyId') || 'null'}</div>
                <div style={{ marginTop: '8px' }}>
                  <strong>aisentinel_saved_accounts:</strong>
                  <pre style={{ marginTop: '4px', fontSize: '11px', overflow: 'auto', maxHeight: '100px' }}>
                    {JSON.stringify(JSON.parse(localStorage.getItem('aisentinel_saved_accounts') || '[]'), null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Error Status */}
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '16px' 
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                color: '#374151' 
              }}>
                Error Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>Models Error:</strong> {modelsError ? JSON.stringify(modelsError) : 'None'}</div>
                <div><strong>Types Error:</strong> {typesError ? JSON.stringify(typesError) : 'None'}</div>
                <div><strong>Messages Error:</strong> {messagesError ? JSON.stringify(messagesError) : 'None'}</div>
                <div><strong>Sessions Error:</strong> {sessionsError ? JSON.stringify(sessionsError) : 'None'}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}