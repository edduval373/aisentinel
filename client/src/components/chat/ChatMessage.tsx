import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Bot, User, AlertTriangle } from "lucide-react";
import MessageRenderer from "./MessageRenderer";
import type { ChatMessage, AiModel, User as UserType } from "@shared/schema";

interface ChatMessageProps {
  message: ChatMessage;
  aiModel?: AiModel;
  user?: UserType;
}

export default function ChatMessage({ message, aiModel, user }: ChatMessageProps) {
  const timestamp = message.timestamp ? format(new Date(message.timestamp), "h:mm a") : "Now";

  const getStatusBadge = () => {
    switch (message.status) {
      case 'approved':
        return (
          <Badge variant="default" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            Approved
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="destructive" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            Blocked
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSecurityAlert = () => {
    if (!message.securityFlags || !Array.isArray(message.securityFlags) || message.securityFlags.length === 0) {
      return null;
    }

    return (
      <div style={{ 
        marginTop: '8px', 
        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
        border: '1px solid rgba(245, 158, 11, 0.3)', 
        borderRadius: '8px', 
        padding: '12px', 
        fontSize: '14px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertTriangle style={{ 
            width: '16px', 
            height: '16px', 
            color: '#f59e0b', 
            marginTop: '2px', 
            flexShrink: 0 
          }} />
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 500 }}>Security Alert:</span>
            <span style={{ color: '#334155', marginLeft: '4px' }}>
              {message.securityFlags.includes('PII_DETECTED') && 'PII detected and filtered. '}
              {message.securityFlags.includes('FINANCIAL_DATA') && 'Financial data detected. '}
              {message.securityFlags.includes('SENSITIVE_DATA') && 'Sensitive information detected. '}
              {message.securityFlags.includes('SENSITIVE_CODE') && 'Sensitive code detected. '}
              {message.securityFlags.includes('SENSITIVE_URL') && 'Sensitive URL detected. '}
              {message.securityFlags.includes('DATA_LEAKAGE') && 'Potential data leakage detected. '}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* User message */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ 
          backgroundColor: 'hsl(221, 83%, 53%)', 
          color: 'white', 
          borderRadius: '8px', 
          padding: '8px 16px', 
          maxWidth: '384px' 
        }}>
          <p style={{ fontSize: '14px' }}>{message.message}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <p style={{ fontSize: '12px', color: '#bfdbfe' }}>{timestamp}</p>
            {getStatusBadge()}
          </div>
          {getSecurityAlert()}
        </div>
      </div>

      {/* AI response - only show if message was approved and has a response */}
      {message.status === 'approved' && message.response && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '8px 16px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                backgroundColor: '#22c55e', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Bot style={{ width: '12px', height: '12px', color: 'white' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                {aiModel?.name || 'AI Assistant'}
              </span>
            </div>
            <MessageRenderer 
              content={message.response || ""} 
              style={{ fontSize: '14px', color: '#334155' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{timestamp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Blocked message explanation */}
      {message.status === 'blocked' && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            padding: '8px 16px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#ef4444' }}>Message Blocked</span>
            </div>
            <p style={{ fontSize: '14px', color: '#334155' }}>
              This message was blocked by security policy. Please revise your message and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}