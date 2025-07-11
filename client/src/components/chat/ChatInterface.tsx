import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Wifi, WifiOff, Shield, Building2, RotateCcw, Trash2, History } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import type { AiModel, ActivityType, ChatMessage as ChatMessageType, Company, ChatSession } from "@shared/schema";

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
  const [lastMessage, setLastMessage] = useState<string>("");
  const [showPreviousChats, setShowPreviousChats] = useState(false);

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

  // Fetch current company details
  const { data: currentCompany, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
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
    queryFn: () => apiRequest(`/api/chat/session/${currentSession}/messages`),
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

  // Fetch previous chat sessions
  const { data: previousSessions, isLoading: sessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: showPreviousChats,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/chat/session", "POST");
      return response;
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
      const response = await apiRequest("/api/chat/message", "POST", data);
      return response;
    },
    onSuccess: (newMessage) => {
      console.log('New message received:', newMessage);
      // Add the new message to the current messages
      setMessages(prev => [...prev, newMessage]);
      // Also refresh the messages to get the most up-to-date view
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session', currentSession, 'messages'] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);

      // Check if this is actually an error (not an empty object from successful request)
      if (error && Object.keys(error).length > 0 && error.message) {
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

    setLastMessage(message);
    sendMessageMutation.mutate({
      message,
      aiModelId: selectedModel,
      activityTypeId: selectedActivityType,
      sessionId: currentSession,
    });
  };

  // Clear current chat
  const handleClearChat = () => {
    createSessionMutation.mutate();
    setMessages([]);
    toast({
      title: "Chat Cleared",
      description: "Started a new chat session",
    });
  };

  // Repeat last request
  const handleRepeatLast = () => {
    if (!lastMessage) {
      toast({
        title: "No Previous Message",
        description: "No previous message to repeat",
        variant: "destructive",
      });
      return;
    }
    handleSendMessage(lastMessage);
  };

  const selectedModelData = aiModels?.find(m => m.id === selectedModel);
  const selectedActivityTypeData = activityTypes?.find(t => t.id === selectedActivityType);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header - Fixed at top */}
      <div className="bg-white border-b border-slate-200 p-4 flex-shrink-0">
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

            {/* Chat Management Buttons */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviousChats(!showPreviousChats)}
                className="flex items-center space-x-1"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepeatLast}
                disabled={!lastMessage}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Repeat</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                className="flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Previous Chat Sessions - Collapsible */}
      {showPreviousChats && (
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex-shrink-0">
          <div className="max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Previous Chat Sessions</h3>
            {sessionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sentinel-blue"></div>
              </div>
            ) : previousSessions && previousSessions.length > 0 ? (
              <div className="space-y-2">
                {previousSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      currentSession === session.id
                        ? 'bg-sentinel-blue text-white'
                        : 'bg-white hover:bg-slate-100'
                    }`}
                    onClick={() => setCurrentSession(session.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <div className="font-medium">
                          {session.title || `Chat Session ${session.id}`}
                        </div>
                        <div className="text-xs opacity-75">
                          {new Date(session.createdAt).toLocaleDateString()} at{' '}
                          {new Date(session.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      {currentSession === session.id && (
                        <div className="text-xs font-medium bg-white bg-opacity-20 px-2 py-1 rounded">
                          Current
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">
                No previous chat sessions found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages-container">
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
          messages.map((message) => {
            // Use the AI model data embedded in the message, or fall back to finding it
            const messageAiModel = message.aiModel || aiModels?.find(m => m.id === message.aiModelId);
            return (
              <ChatMessage
                key={message.id}
                message={message}
                aiModel={messageAiModel}
                user={user}
              />
            );
          })
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

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-slate-200">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!selectedModel || !selectedActivityType || !currentSession || sendMessageMutation.isPending}
        />
      </div>
    </div>
  );
}