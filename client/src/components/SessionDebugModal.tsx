import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bug, CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Database, User, MessageSquare, Settings, Cookie, Key, Server } from "lucide-react";

interface SessionDebugData {
  // Cookie Analysis
  cookies: {
    sessionToken: string | null;
    demoUser: string | null;
    allCookies: string;
  };
  
  // Authentication Status
  auth: {
    authenticated: boolean;
    user: any;
    sessionValid: boolean;
    sessionExists: boolean;
    databaseConnected: boolean;
    error?: string;
  } | null;
  
  // Chat Session Elements
  chatSession: {
    currentSession: number | null;
    sessionCreated: boolean;
    error?: string;
  } | null;
  
  // API Connectivity
  apiStatus: {
    authMe: 'success' | 'error' | 'pending';
    chatSession: 'success' | 'error' | 'pending';
    aiModels: 'success' | 'error' | 'pending';
    activityTypes: 'success' | 'error' | 'pending';
    databaseConnection: 'success' | 'error' | 'pending';
  };
  
  // Database Elements
  database: {
    userExists: boolean;
    sessionRecordExists: boolean;
    companyExists: boolean;
    error?: string;
  } | null;
}

interface SessionDebugModalProps {
  trigger?: React.ReactNode;
}

export default function SessionDebugModal({ trigger }: SessionDebugModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugData] = useState<SessionDebugData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const analyzeSession = async () => {
    setIsLoading(true);
    console.log("🔍 Starting comprehensive session analysis...");
    
    const analysis: SessionDebugData = {
      cookies: {
        sessionToken: getCookie('sessionToken') || null,
        demoUser: getCookie('demoUser') || null,
        allCookies: document.cookie
      },
      auth: null,
      chatSession: null,
      apiStatus: {
        authMe: 'pending',
        chatSession: 'pending',
        aiModels: 'pending',
        activityTypes: 'pending',
        databaseConnection: 'pending'
      },
      database: null
    };

    try {
      // 1. Test Authentication Endpoint
      console.log("🔍 Testing /api/auth/me...");
      try {
        const authResponse = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const authData = await authResponse.json();
        analysis.auth = authData;
        analysis.apiStatus.authMe = authResponse.ok ? 'success' : 'error';
        console.log("✅ Auth response:", authData);
      } catch (error) {
        analysis.apiStatus.authMe = 'error';
        analysis.auth = { 
          authenticated: false, 
          user: null, 
          sessionValid: false, 
          sessionExists: false, 
          databaseConnected: false, 
          error: error instanceof Error ? error.message : String(error)
        };
        console.error("❌ Auth error:", error);
      }

      // 2. Test Chat Session Creation
      console.log("🔍 Testing chat session creation...");
      try {
        const sessionResponse = await fetch('/api/chat/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const sessionData = await sessionResponse.json();
        analysis.chatSession = {
          currentSession: sessionData.id || null,
          sessionCreated: sessionResponse.ok,
          error: sessionResponse.ok ? undefined : sessionData.message || 'Failed to create session'
        };
        analysis.apiStatus.chatSession = sessionResponse.ok ? 'success' : 'error';
        console.log("✅ Session response:", sessionData);
      } catch (error) {
        analysis.apiStatus.chatSession = 'error';
        analysis.chatSession = {
          currentSession: null,
          sessionCreated: false,
          error: error instanceof Error ? error.message : String(error)
        };
        console.error("❌ Session error:", error);
      }

      // 3. Test AI Models Endpoint
      console.log("🔍 Testing /api/ai-models...");
      try {
        const modelsResponse = await fetch('/api/ai-models', {
          method: 'GET',
          credentials: 'include'
        });
        analysis.apiStatus.aiModels = modelsResponse.ok ? 'success' : 'error';
        console.log("✅ AI Models response status:", modelsResponse.status);
      } catch (error) {
        analysis.apiStatus.aiModels = 'error';
        console.error("❌ AI Models error:", error);
      }

      // 4. Test Activity Types Endpoint
      console.log("🔍 Testing /api/activity-types...");
      try {
        const typesResponse = await fetch('/api/activity-types', {
          method: 'GET',
          credentials: 'include'
        });
        analysis.apiStatus.activityTypes = typesResponse.ok ? 'success' : 'error';
        console.log("✅ Activity Types response status:", typesResponse.status);
      } catch (error) {
        analysis.apiStatus.activityTypes = 'error';
        console.error("❌ Activity Types error:", error);
      }

      // 5. Test Database Connection
      console.log("🔍 Testing database connection...");
      try {
        const dbResponse = await fetch('/api/debug/status', {
          method: 'GET',
          credentials: 'include'
        });
        const dbData = await dbResponse.json();
        analysis.apiStatus.databaseConnection = dbData.databaseConnected ? 'success' : 'error';
        analysis.database = {
          userExists: false, // Will be determined from auth response
          sessionRecordExists: analysis.auth?.sessionExists || false,
          companyExists: false, // Will be determined from auth response
          error: dbData.databaseError
        };
        console.log("✅ Database status:", dbData);
      } catch (error) {
        analysis.apiStatus.databaseConnection = 'error';
        analysis.database = {
          userExists: false,
          sessionRecordExists: false,
          companyExists: false,
          error: error instanceof Error ? error.message : String(error)
        };
        console.error("❌ Database error:", error);
      }

      // 6. Analyze Auth Data for Database Elements
      if (analysis.auth?.authenticated && analysis.auth.user) {
        analysis.database = {
          ...analysis.database,
          userExists: true,
          companyExists: !!analysis.auth.user.companyId
        };
      }

    } catch (error) {
      console.error("❌ Session analysis failed:", error);
    }

    setDebugData(analysis);
    setIsLoading(false);
    console.log("🔍 Session analysis complete:", analysis);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} />;
      case 'error': return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'pending': return <AlertTriangle style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
    }
  };

  const getBooleanIcon = (value: boolean | undefined | null) => {
    if (value === true) return <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} />;
    if (value === false) return <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
    return <AlertTriangle style={{ width: '16px', height: '16px', color: '#94a3b8' }} />;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      analyzeSession();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            size="sm"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: '1px solid #2563eb',
              fontSize: '14px',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Bug style={{ width: '16px', height: '16px' }} />
            Session Debug
          </Button>
        )}
      </DialogTrigger>
      <DialogContent style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <DialogHeader>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bug style={{ width: '20px', height: '20px' }} />
            Session Analysis & Debugging
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>Analyzing session elements...</div>
            <div style={{ color: '#64748b' }}>This may take a few seconds</div>
          </div>
        ) : debugData ? (
          <div style={{ padding: '0' }}>
            
            {/* Cookie Analysis */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                <Cookie style={{ width: '18px', height: '18px' }} />
                Cookie Analysis
              </h3>
              <div style={{ display: 'grid', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Session Token:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(!!debugData.cookies.sessionToken)}
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {debugData.cookies.sessionToken ? `${debugData.cookies.sessionToken.substring(0, 20)}...` : 'Not found'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Demo User Cookie:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(!!debugData.cookies.demoUser)}
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {debugData.cookies.demoUser || 'Not found'}
                    </span>
                  </div>
                </div>
                <Separator />
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  All cookies: {debugData.cookies.allCookies || 'No cookies found'}
                </div>
              </div>
            </div>

            {/* Authentication Status */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                <User style={{ width: '18px', height: '18px' }} />
                Authentication Status
              </h3>
              <div style={{ display: 'grid', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Authenticated:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.auth?.authenticated)}
                    <Badge variant={debugData.auth?.authenticated ? "default" : "destructive"}>
                      {debugData.auth?.authenticated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Session Valid:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.auth?.sessionValid)}
                    <Badge variant={debugData.auth?.sessionValid ? "default" : "destructive"}>
                      {debugData.auth?.sessionValid ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Session Exists in DB:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.auth?.sessionExists)}
                    <Badge variant={debugData.auth?.sessionExists ? "default" : "destructive"}>
                      {debugData.auth?.sessionExists ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Database Connected:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.auth?.databaseConnected)}
                    <Badge variant={debugData.auth?.databaseConnected ? "default" : "destructive"}>
                      {debugData.auth?.databaseConnected ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                {debugData.auth?.user && (
                  <>
                    <Separator />
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      User: {debugData.auth.user.email} | Role: {debugData.auth.user.role} (Level {debugData.auth.user.roleLevel})
                    </div>
                  </>
                )}
                {debugData.auth?.error && (
                  <>
                    <Separator />
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                      Error: {debugData.auth.error}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chat Session Status */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                <MessageSquare style={{ width: '18px', height: '18px' }} />
                Chat Session Status
              </h3>
              <div style={{ display: 'grid', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Session Created:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.chatSession?.sessionCreated)}
                    <Badge variant={debugData.chatSession?.sessionCreated ? "default" : "destructive"}>
                      {debugData.chatSession?.sessionCreated ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Current Session ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {debugData.chatSession?.currentSession || 'None'}
                  </span>
                </div>
                {debugData.chatSession?.error && (
                  <>
                    <Separator />
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                      Error: {debugData.chatSession.error}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* API Connectivity */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                <Server style={{ width: '18px', height: '18px' }} />
                API Connectivity
              </h3>
              <div style={{ display: 'grid', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                {Object.entries(debugData.apiStatus).map(([endpoint, status]) => (
                  <div key={endpoint} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{endpoint.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusIcon(status)}
                      <Badge variant={status === 'success' ? "default" : status === 'error' ? "destructive" : "secondary"}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Elements */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>
                <Database style={{ width: '18px', height: '18px' }} />
                Database Elements
              </h3>
              <div style={{ display: 'grid', gap: '8px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>User Record Exists:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.database?.userExists)}
                    <Badge variant={debugData.database?.userExists ? "default" : "destructive"}>
                      {debugData.database?.userExists ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Session Record Exists:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.database?.sessionRecordExists)}
                    <Badge variant={debugData.database?.sessionRecordExists ? "default" : "destructive"}>
                      {debugData.database?.sessionRecordExists ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Company Record Exists:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getBooleanIcon(debugData.database?.companyExists)}
                    <Badge variant={debugData.database?.companyExists ? "default" : "destructive"}>
                      {debugData.database?.companyExists ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                {debugData.database?.error && (
                  <>
                    <Separator />
                    <div style={{ fontSize: '12px', color: '#ef4444' }}>
                      Database Error: {debugData.database.error}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <Button 
                onClick={analyzeSession}
                variant="outline"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Bug style={{ width: '16px', height: '16px' }} />
                Re-analyze
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/create-session', {
                      method: 'POST',
                      credentials: 'include'
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert('Real database session created successfully! Please refresh the page.');
                    } else {
                      alert('Failed to create session: ' + result.message);
                    }
                  } catch (error) {
                    alert('Error creating session: ' + (error instanceof Error ? error.message : String(error)));
                  }
                }}
                variant="default"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Key style={{ width: '16px', height: '16px' }} />
                Create Real Session
              </Button>
              <Button 
                onClick={() => window.location.href = '/api/auth/test-verify'}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Bug style={{ width: '16px', height: '16px' }} />
                Test Verification
              </Button>
            </div>

          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Click "Analyze Session" to start debugging
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}