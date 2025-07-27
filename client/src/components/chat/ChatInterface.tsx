import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
// import { isUnauthorizedError } from "@/lib/authUtils"; // Temporarily disabled
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Wifi, WifiOff, Shield, Building2, RotateCcw, Trash2, History, Brain, MessageSquare, Star } from "lucide-react";
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
    // Removed authentication error handling
  });
  
  // Auto-select first available AI model
  useEffect(() => {
    if (aiModels && aiModels.length > 0 && selectedModel === null) {
      setSelectedModel(aiModels[0].id);
    }
  }, [aiModels, selectedModel]);

  // Fetch Model Fusion config
  const { data: modelFusionConfig } = useQuery({
    queryKey: ['/api/model-fusion-config'],
  });

  // Fetch activity types
  const { data: activityTypes, isLoading: typesLoading } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
    // Removed authentication error handling
  });
  
  // Auto-select first available activity type
  useEffect(() => {
    if (activityTypes && activityTypes.length > 0 && selectedActivityType === null) {
      setSelectedActivityType(activityTypes[0].id);
    }
  }, [activityTypes, selectedActivityType]);

  // Fetch current company details
  const { data: currentCompany, isLoading: companyLoading } = useQuery<Company>({
    queryKey: ['/api/user/current-company'],
    // Removed authentication error handling
  });

  // Fetch chat messages when session changes
  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/session', currentSession, 'messages'],
    queryFn: () => apiRequest(`/api/chat/session/${currentSession}/messages`),
    enabled: !!currentSession,
    // Authentication error handling removed
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
        const errorData = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(errorData.message || "Failed to create session");
      }
      
      const sessionData = await response.json();
      console.log('Session created successfully:', sessionData);
      return sessionData;
    },
    onSuccess: (session) => {
      console.log('Setting current session to:', session.id);
      setCurrentSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session'] });
      // Removed toast notification to prevent screen jumping
    },
    onError: (error) => {
      console.error('Session creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create chat session",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormData | { message: string; aiModelId: number; activityTypeId: number; sessionId: number }) => {
      console.log('=== SEND MESSAGE DEBUG ===');
      console.log('Message data type:', data instanceof FormData ? 'FormData' : 'Object');
      console.log('Current session ID:', currentSession);
      console.log('Selected AI Model:', selectedModel);
      console.log('Selected Activity Type:', selectedActivityType);
      
      if (data instanceof FormData) {
        console.log('FormData entries:');
        for (let [key, value] of data.entries()) {
          console.log(`  ${key}:`, value);
        }
      } else {
        console.log('Message object:', data);
      }
      
      // Handle both FormData (with files) and regular object
      if (data instanceof FormData) {
        console.log('Sending FormData to /api/chat/message');
        const response = await fetch("/api/chat/message", {
          method: "POST",
          body: data,
          credentials: "include",
        });

        console.log('FormData response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Request failed" }));
          console.error('FormData request failed:', errorData);
          
          // Handle demo limit specifically
          if (response.status === 429 && errorData.upgradeRequired) {
            throw { ...errorData, isDemoLimit: true };
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log('FormData response success:', result);
        return result;
      } else {
        console.log('Sending object via apiRequest to /api/chat/message');
        const response = await apiRequest("/api/chat/message", "POST", data);
        console.log('Object response success:', response);
        return response;
      }
    },
    onSuccess: (newMessage) => {
      console.log('New message received:', newMessage);
      // Add the new message to the current messages
      setMessages(prev => [...prev, newMessage]);
      // Also refresh the messages to get the most up-to-date view
      queryClient.invalidateQueries({ queryKey: ['/api/chat/session', currentSession, 'messages'] });
      // Invalidate chat sessions to update the history
      queryClient.invalidateQueries({ queryKey: ['/api/chat/sessions'] });
    },
    onError: (error: any) => {
      console.error('Send message error:', error);

      // Check if this is a demo limit error
      if (error && error.isDemoLimit) {
        toast({
          title: "Demo Limit Reached",
          description: `You've used all ${error.maxQuestions} demo questions. Start your free trial to continue!`,
          variant: "destructive",
          action: {
            altText: "Start Free Trial",
            onClick: () => window.location.href = '/pricing'
          }
        });
        return;
      }

      // Check if this is actually an error (not an empty object from successful request)
      if (error && Object.keys(error).length > 0 && error.message) {
        // Authentication error handling removed

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
    console.log('=== SESSION CREATION TRIGGER DEBUG ===');
    console.log('currentSession:', currentSession);
    console.log('createSessionMutation.isPending:', createSessionMutation.isPending);
    console.log('Should create session:', !currentSession && !createSessionMutation.isPending);
    console.log('AI Models loaded:', aiModels?.length || 0, 'models');
    console.log('Activity Types loaded:', activityTypes?.length || 0, 'types');
    console.log('Company loaded:', !!currentCompany);
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
      // Refetch messages for the selected session
      queryClient.invalidateQueries({
        queryKey: ['/api/chat/session', currentSession, 'messages']
      });
    }
  }, [currentSession, queryClient]);

  // WebSocket connection
  useEffect(() => {
    console.log('=== WEBSOCKET CONNECTION DEBUG ===');
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('WebSocket URL:', wsUrl);
    console.log('Current protocol:', window.location.protocol);
    console.log('Current host:', window.location.host);
    console.log('Environment:', process.env.NODE_ENV);
    
    const ws = new WebSocket(wsUrl);
    let pingInterval: NodeJS.Timeout | null = null;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('✅ WebSocket connected successfully');
      console.log('WebSocket readyState:', ws.readyState);
      
      // Send ping every 30 seconds to keep connection alive
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
          console.log('📡 Sent WebSocket ping');
        }
      }, 30000);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log('❌ WebSocket disconnected');
      console.log('Close event code:', event.code);
      console.log('Close event reason:', event.reason);
      console.log('Close event was clean:', event.wasClean);
      
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      console.log('WebSocket readyState on error:', ws.readyState);
      console.log('Error type:', error.type);
      setIsConnected(false);
      
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'pong') {
          console.log('📡 Received WebSocket pong');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      ws.close();
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (message: string, attachments?: File[]) => {
    if (!selectedModel || !selectedActivityType) {
      toast({
        title: "Error",
        description: "Please select AI model and activity type",
        variant: "destructive",
      });
      return;
    }

    setLastMessage(message);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('message', message);
    formData.append('aiModelId', selectedModel.toString());
    formData.append('activityTypeId', selectedActivityType.toString());
    
    // Session will be created automatically if not provided
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
    // Removed toast notification to prevent screen jumping
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
    // Clear the prefill message after a short delay to allow the effect to run
    setTimeout(() => setPrefillMessage(""), 100);
  };

  const selectedModelData = aiModels?.find(m => m.id === selectedModel);
  const selectedActivityTypeData = activityTypes?.find(t => t.id === selectedActivityType);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header - Fixed at top */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '12px 16px', 
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left side - AI Assistant and Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>AI Assistant</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isConnected ? (
                <Wifi style={{ width: '16px', height: '16px', color: '#22c55e' }} />
              ) : (
                <WifiOff style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
              )}
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Center and Right - Controls spread evenly */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
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
              <SelectTrigger style={{ width: '180px', fontWeight: 600 }}>
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                {aiModels?.map((model) => (
                  <SelectItem key={model.id} value={model.id.toString()}>
                    {model.name}
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
              <SelectTrigger style={{ width: '180px', fontWeight: 600 }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant={showPreviousChats ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreviousChats(!showPreviousChats)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <History style={{ width: '16px', height: '16px' }} />
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
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <RotateCcw style={{ width: '16px', height: '16px' }} />
                Repeat
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearChat}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                Clear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Previous Chat Sessions - Collapsible */}
      {showPreviousChats && (
        <div style={{ 
          backgroundColor: '#f8fafc', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '16px', 
          flexShrink: 0 
        }}>
          <div style={{ maxHeight: '192px', overflowY: 'auto' }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: '8px' 
            }}>Previous Chat Sessions</h3>
            {sessionsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
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
      <div className="chat-main">
      {/* Chat Messages Area */}
      <div className="chat-messages-container">


        {/* Chat Messages */}
        {messagesLoading ? (
          <div className="flex justify-center">
            <div className="loading-spinner" style={{ width: '32px', height: '32px' }}></div>
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
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '8px 16px',
              maxWidth: '320px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #3b82f6', 
                  borderTopColor: 'transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
</div>

      {/* Chat Input - Fixed at bottom */}
      <div className="chat-input-container">
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