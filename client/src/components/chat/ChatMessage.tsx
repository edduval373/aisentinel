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
  const timestamp = format(new Date(message.timestamp), "h:mm a");

  const getStatusBadge = () => {
    switch (message.status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-sentinel-green/10 text-sentinel-green hover:bg-sentinel-green/20">
            Approved
          </Badge>
        );
      case 'blocked':
        return (
          <Badge variant="destructive" className="bg-sentinel-red/10 text-sentinel-red hover:bg-sentinel-red/20">
            Blocked
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-sentinel-amber/10 text-sentinel-amber hover:bg-sentinel-amber/20">
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
      <div className="mt-2 bg-sentinel-amber/10 border border-sentinel-amber/30 rounded-lg p-3 text-sm">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-sentinel-amber mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-sentinel-amber font-medium">Security Alert:</span>
            <span className="text-slate-700 ml-1">
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
    <div className="space-y-4">
      {/* User message */}
      <div className="flex justify-end">
        <div className="bg-sentinel-blue text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
          <p className="text-sm">{message.message}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-blue-100">{timestamp}</p>
            {getStatusBadge()}
          </div>
          {getSecurityAlert()}
        </div>
      </div>

      {/* AI response - only show if message was approved and has a response */}
      {message.status === 'approved' && message.response && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 chat-message-content">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 bg-sentinel-green rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-800">
                {aiModel?.name || 'AI Assistant'}
              </span>
            </div>
            <MessageRenderer 
              content={message.response} 
              className="text-sm text-slate-700"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">{timestamp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Blocked message explanation */}
      {message.status === 'blocked' && (
        <div className="flex justify-start">
          <div className="bg-sentinel-red/10 border border-sentinel-red/30 rounded-lg px-4 py-2 chat-message-content">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-sentinel-red" />
              <span className="text-sm font-medium text-sentinel-red">Message Blocked</span>
            </div>
            <p className="text-sm text-slate-700">
              This message was blocked by security policy. Please revise your message and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
