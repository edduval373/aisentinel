import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { Bot } from "lucide-react";

export default function CreateModelsSimple() {
  console.log('🚀 CreateModelsSimple component loaded');
  
  const authResult = useAuth();
  console.log('Auth result:', authResult);
  
  const user = authResult?.user || null;
  console.log('User from auth:', user);
  
  // SECURITY: Super-user access only (role level 1000+)
  const isSuperUser = (user?.roleLevel ?? 0) >= 1000;
  console.log('Is super user:', isSuperUser, 'Role level:', user?.roleLevel);
  
  if (!isSuperUser) {
    return (
      <AdminLayout 
        title="Access Denied" 
        subtitle="Super-user privileges required"
      >
        <div style={{ 
          padding: '48px', 
          textAlign: 'center' as const,
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: '#dc2626',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <Bot style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#991b1b', 
            margin: '0 0 12px 0' 
          }}>
            Access Restricted
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#7f1d1d', 
            margin: '0 0 16px 0',
            lineHeight: '1.5'
          }}>
            Creating AI model templates requires super-user privileges (role level 1000+).
            <br />
            Current role level: {user?.roleLevel || 0}
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Create AI Models" 
      subtitle="Create and manage custom AI models from scratch"
    >
      <div style={{ 
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: '0 0 16px 0',
          color: '#1f2937'
        }}>
          AI Model Creation
        </h3>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          margin: '0 0 24px 0',
          lineHeight: '1.5'
        }}>
          This is the simplified Create Models page for testing. 
          User: {user?.email} (Role Level: {user?.roleLevel})
        </p>
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #d1d5db'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
            Component loaded successfully! The original component will be restored once we identify the issue.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}