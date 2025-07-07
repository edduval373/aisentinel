import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Wifi, WifiOff } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { AiModel, ActivityType, ChatMessage as ChatMessageType } from "@shared/schema";

interface ChatInterfaceProps {
  currentSession: number | null;
  setCurrentSession: (sessionId: number) => void;
}

export default function ChatInterface({ currentSession, setCurrentSession }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  // Fetch AI models
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch activity types
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Fetch chat messages when session changes
  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/session', currentSession, 'messages'],
    enabled: !!currentSession,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/chat/session");
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; aiModelId: number; activityTypeId: number; sessionId: number }) => {
      const response = await apiRequest("POST", "/api/chat/message", data);
      return response.json();
    },
    onSuccess: (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session', currentSession, 'messages'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      // Handle blocked messages
      if (error.message.includes("403")) {
        toast({
          title: "Message Blocked",
          description: "Your message was blocked by security policy",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    },
  });

  // Set default selections
  useEffect(() => {
    if (aiModels && aiModels.length > 0 && !selectedModel) {
      setSelectedModel(aiModels[0].id);
    }
  }, [aiModels, selectedModel]);

  useEffect(() => {
    if (activityTypes && activityTypes.length > 0 && !selectedActivityType) {
      setSelectedActivityType(activityTypes[0].id);
    }
  }, [activityTypes, selectedActivityType]);

  // Create initial session
  useEffect(() => {
    if (!currentSession && !createSessionMutation.isPending) {
      createSessionMutation.mutate();
    }
  }, [currentSession, createSessionMutation]);

  // Update messages when chat data changes
  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (message: string) => {
    if (!selectedModel || !selectedActivityType || !currentSession) {
      toast({
        title: "Error",
        description: "Please select AI model and activity type",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      message,
      aiModelId: selectedModel,
      activityTypeId: selectedActivityType,
      sessionId: currentSession,
    });
  };

  const selectedModelData = aiModels?.find(m => m.id === selectedModel);
  const selectedActivityTypeData = activityTypes?.find(t => t.id === selectedActivityType);

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-slate-800">AI Assistant</h2>
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
          </div>
          <div className="flex items-center space-x-4">
            {/* AI Model Dropdown */}
            <Select
              value={selectedModel?.toString()}
              onValueChange={(value) => setSelectedModel(parseInt(value))}
              disabled={modelsLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels?.map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Activity Type Dropdown */}
            <Select
              value={selectedActivityType?.toString()}
              onValueChange={(value) => setSelectedActivityType(parseInt(value))}
              disabled={typesLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Activity Type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* System Message */}
        <div className="flex justify-center">
          <div className="bg-slate-100 rounded-lg px-4 py-2 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-sentinel-blue inline mr-2" />
            AI Sentinel is monitoring this conversation for compliance and security.
          </div>
        </div>

        {/* Chat Messages */}
        {messagesLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sentinel-blue"></div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              aiModel={selectedModelData}
              user={user}
            />
          ))
        )}

        {/* Loading indicator */}
        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sentinel-blue"></div>
                <span className="text-sm text-slate-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={!selectedModel || !selectedActivityType || !currentSession || sendMessageMutation.isPending}
      />
    </div>
  );
}
