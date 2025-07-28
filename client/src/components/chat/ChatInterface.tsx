import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wifi, WifiOff, History, RotateCcw, Trash2, MessageSquare, Brain } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import FeaturesBenefitsDialog from "@/components/FeaturesBenefitsDialog";
import { useFeaturesBenefits } from "@/hooks/useFeaturesBenefits";
import { isDemoModeActive } from "@/utils/demoMode";
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
  const [prefillMessage, setPrefillMessage] = useState<string>("");
  
  // Features & Benefits dialog for demo users
  const { showDialog, openDialog, closeDialog } = useFeaturesBenefits();
  const isDemoMode = isDemoModeActive(user);

  // Fetch AI models
  const { data: aiModels, isLoading: modelsLoading } = useQuery<AiModel[]>({
    queryKey: ['/api/ai-models'],
  });
  
  // Auto-select first available AI model (prioritize working models)
  useEffect(() => {
    if (aiModels && aiModels.length > 0 && selectedModel === null) {
      // Prefer models with valid API keys
      const workingModel = aiModels.find((model: any) => model.hasValidApiKey !== false);
      if (workingModel) {
        setSelectedModel(workingModel.id);
      } else {
        // Fallback to first model even if API key is not configured
        setSelectedModel(aiModels[0].id);
      }
    }
  }, [aiModels, selectedModel]);

  // Fetch Model Fusion config
  const { data: modelFusionConfig } = useQuery({
    queryKey: ['/api/model-fusion-config'],
  });

  // Fetch activity types
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
  });
  
  // Auto-select first available activity type
  useEffect(() => {
    if (activityTypes && activityTypes.length > 0 && selectedActivityType === null) {
      setSelectedActivityType(activityTypes[0].id);
    }
  }, [activityTypes, selectedActivityType]);

  // Fetch chat messages when session changes
  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/session', currentSession, 'messages'],
    queryFn: () => apiRequest(`/api/chat/session/${currentSession}/messages`),
    enabled: !!currentSession,
  });

  // Fetch previous chat sessions with message details
  const { data: previousSessions, isLoading: sessionsLoading } = useQuery<(ChatSession & { messageCount?: number; lastMessage?: string })[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: showPreviousChats,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      console.log('Creating new chat session...');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Session creation failed:', response.status, errorText);
        throw new Error(`Failed to create chat session: ${response.status} ${errorText}`);
      }
      
      const session = await response.json();
      console.log('Session created successfully:', session);
      return session;
    },
    onSuccess: (session) => {
      console.log('Setting current session to:', session.id);
      setCurrentSession(session.id);
    },
    onError: (error) => {
      console.error('Failed to create session:', error);
      toast({
        title: "Failed to create chat session",
        description: "Unable to start a new chat. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Message send failed:', response.status, errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      if (data.userMessage) {
        setMessages(prev => [...prev, data.userMessage]);
        setLastMessage(data.userMessage.message);
      }
      if (data.assistantMessage) {
        setMessages(prev => [...prev, data.assistantMessage]);
      }
      
      // Refresh chat messages
      queryClient.invalidateQueries({
        queryKey: ['/api/chat/session', currentSession, 'messages']
      });
      
      // Open Features & Benefits dialog after first message for demo users
      if (isDemoMode && messages.length === 0) {
        setTimeout(() => {
          openDialog();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive",
      });
    }
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    console.log('✅ WebSocket connected successfully');
    console.log('WebSocket readyState:', 1);
    setIsConnected(true);
    
    return () => {
      setIsConnected(false);
    };
  }, []);

  // Create initial session
  useEffect(() => {
    console.log('=== SESSION CREATION TRIGGER DEBUG ===');
    console.log('currentSession:', currentSession);
    console.log('createSessionMutation.isPending:', createSessionMutation.isPending);
    console.log('Should create session:', !currentSession && !createSessionMutation.isPending);
    console.log('AI Models loaded:', aiModels?.length || 0, 'models');
    console.log('Activity Types loaded:', activityTypes?.length || 0, 'types');
    console.log('=== END SESSION TRIGGER DEBUG ===');
    
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

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      queryClient.invalidateQueries({
        queryKey: ['/api/chat/session', currentSession, 'messages']
      });
    }
  }, [currentSession, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSendMessage = (message: string, attachments?: File[]) => {
    if (!selectedModel || !selectedActivityType) {
      toast({
        title: "Configuration Required",
        description: "Please select an AI model and activity type",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('message', message);
    formData.append('aiModelId', selectedModel.toString());
    formData.append('activityTypeId', selectedActivityType.toString());
    
    if (currentSession) {
      formData.append('sessionId', currentSession.toString());
    }

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    sendMessageMutation.mutate(formData);
  };

  // Clear current chat
  const handleClearChat = () => {
    createSessionMutation.mutate();
    setMessages([]);
  };

  // Repeat last request - fill input field instead of submitting
  const handleRepeatLast = () => {
    if (!lastMessage) {
      toast({
        title: "No Previous Message",
        description: "No previous message to repeat",
        variant: "destructive",
      });
      return;
    }
    setPrefillMessage(lastMessage);
    setTimeout(() => setPrefillMessage(""), 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Compact Chat Controls - Essential controls only */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '4px 16px', 
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left side - Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConnected ? (
              <Wifi style={{ width: '16px', height: '16px', color: '#22c55e' }} />
            ) : (
              <WifiOff style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
            )}
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Right side - Essential Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* AI Model Dropdown */}
            <Select
              value={selectedModel?.toString()}
              onValueChange={(value) => {
                if (value === "model-fusion") {
                  setSelectedModel("model-fusion" as any);
                } else {
                  setSelectedModel(parseInt(value));
                }
              }}
              disabled={modelsLoading}
            >
              <SelectTrigger style={{ width: '160px', fontSize: '14px' }}>
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #93c5fd', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000
              }}>
                {aiModels?.map((model: any) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name}
                    {model.hasValidApiKey === false ? ' ⚠️' : ''}
                  </SelectItem>
                ))}
                {modelFusionConfig?.isEnabled && (
                  <>
                    <Separator style={{ margin: '4px 0' }} />
                    <SelectItem value="model-fusion">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Model Fusion
                        <Badge variant="default" style={{ backgroundColor: 'hsl(221, 83%, 53%)' }}>
                          <Brain style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                          Multi-AI
                        </Badge>
                      </div>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* Activity Type Dropdown */}
            <Select
              value={selectedActivityType?.toString()}
              onValueChange={(value) => setSelectedActivityType(parseInt(value))}
              disabled={typesLoading}
            >
              <SelectTrigger style={{ width: '160px', fontSize: '14px' }}>
                <SelectValue placeholder="Select Activity Type" />
              </SelectTrigger>
              <SelectContent style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #93c5fd', 
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000
              }}>
                {activityTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chat Management Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Button
                variant={showPreviousChats ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreviousChats(!showPreviousChats)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              >
                <History style={{ width: '14px', height: '14px' }} />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRepeatLast}
                disabled={!lastMessage}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              >
                <RotateCcw style={{ width: '14px', height: '14px' }} />
                Repeat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                disabled={createSessionMutation.isPending}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '6px 10px',
                  fontSize: '12px'
                }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Chat Sessions (when shown) */}
      {showPreviousChats && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '16px',
          maxHeight: '300px',
          overflow: 'auto',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
            Previous Chat Sessions
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {sessionsLoading ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #3b82f6', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
              </div>
            ) : previousSessions && previousSessions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {previousSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: currentSession === session.id ? '#3b82f6' : 'white',
                      color: currentSession === session.id ? 'white' : '#1e293b',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => {
                      setCurrentSession(session.id);
                      setShowPreviousChats(false);
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ fontWeight: 500 }}>
                          {session.lastMessage || `Chat Session ${session.id}`}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          opacity: 0.75,
                          marginTop: '2px'
                        }}>
                          {new Date(session.createdAt).toLocaleDateString()} at{' '}
                          {new Date(session.createdAt).toLocaleTimeString()}
                          {session.messageCount !== undefined && (
                            <span style={{ marginLeft: '8px' }}>• {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                fontSize: '14px', 
                color: '#64748b', 
                padding: '16px 0', 
                textAlign: 'center' 
              }}>
                No previous chat sessions found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages - Scrollable middle section */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#f8fafc'
      }}>
        {/* Chat Messages */}
        {messagesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: '3px solid #3b82f6', 
              borderTopColor: 'transparent', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <MessageSquare style={{ 
                width: '48px', 
                height: '48px', 
                margin: '0 auto 16px', 
                opacity: 0.5 
              }} />
              <p style={{ 
                fontSize: '18px', 
                fontWeight: 500, 
                marginBottom: '8px' 
              }}>No messages yet</p>
              <p style={{ fontSize: '14px' }}>Send a message to get started with AI assistance.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((message) => {
              const messageAiModel = message.aiModel || aiModels?.find(m => m.id === message.aiModelId);
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  aiModel={messageAiModel}
                  user={user}
                />
              );
            })}

            {/* Loading indicator with AI Sentinel logo */}
            {sendMessageMutation.isPending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '12px 16px',
                  maxWidth: '320px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img 
                      src="/ai-sentinel-logo.png" 
                      alt="AI Sentinel" 
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        animation: 'spin 2s linear infinite',
                        filter: 'brightness(1.1) saturate(1.3) contrast(1.2)'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #e2e8f0', 
        padding: '16px',
        flexShrink: 0
      }}>
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={!selectedModel || !selectedActivityType || !currentSession || sendMessageMutation.isPending}
          prefillMessage={prefillMessage}
        />
      </div>
      
      {/* Features & Benefits Dialog for demo users */}
      <FeaturesBenefitsDialog
        open={showDialog}
        onOpenChange={closeDialog}
      />
    </div>
  );
}