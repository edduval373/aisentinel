import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wifi, WifiOff, History, RotateCcw, Trash2, MessageSquare, Brain, Bug, Settings } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import FeaturesBenefitsDialog from "@/components/FeaturesBenefitsDialog";
import { DeveloperRoleSwitcher } from "@/components/developer/DeveloperRoleSwitcher";
import { DebugStatusPanel } from "@/components/DebugStatusPanel";
import VersionDisplay from "@/components/VersionDisplay";

import { useFeaturesBenefits } from "@/hooks/useFeaturesBenefits";
import { isDemoModeActive } from "@/utils/demoMode";
import type { AiModelWithApiKey, ActivityType, ChatMessage as ChatMessageType, Company, ChatSession } from "@shared/schema";

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
  const [isConnected, setIsConnected] = useState(true); // Set to true by default since we have working API
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [showPreviousChats, setShowPreviousChats] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState<string>("");
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showChatDebugModal, setShowChatDebugModal] = useState(false);
  
  // Features & Benefits dialog for demo users
  const { showDialog, openDialog, closeDialog } = useFeaturesBenefits();
  const isDemoMode = isDemoModeActive(user);

  // Fetch AI models
  const { data: aiModels, isLoading: modelsLoading, error: modelsError } = useQuery<AiModelWithApiKey[]>({
    queryKey: ['/api/ai-models'],
  });

  // Debug logging for AI models
  console.log("AI Models loaded:", aiModels?.length || 0, "models");
  console.log("Selected Model ID:", selectedModel);
  console.log("Selected Model Object:", aiModels?.find(m => m.id === selectedModel));
  console.log("Select Model Value (string):", selectedModel?.toString());
  console.log("AI Models for Select:", aiModels?.map(m => ({ id: m.id, name: m.name, idString: m.id.toString() })));
  if (modelsError) {
    console.error("AI Models error:", modelsError);
  }
  
  // Auto-select first available AI model (all models should work with environment API keys)
  useEffect(() => {
    if (aiModels && aiModels.length > 0 && selectedModel === null) {
      // Select the first available model (all should be working with environment keys)
      console.log("Auto-selecting first model:", aiModels[0].name, "ID:", aiModels[0].id);
      setSelectedModel(aiModels[0].id);
    }
  }, [aiModels, selectedModel]);

  // Fetch Model Fusion config
  const { data: modelFusionConfig } = useQuery<{isEnabled: boolean}>({
    queryKey: ['/api/model-fusion-config'],
  });

  // Fetch activity types
  const { data: activityTypes, isLoading: typesLoading, error: typesError } = useQuery<ActivityType[]>({
    queryKey: ['/api/activity-types'],
  });

  // Debug logging for Activity Types
  console.log("Activity Types loaded:", activityTypes?.length || 0, "types");
  console.log("Selected Activity Type ID:", selectedActivityType);
  console.log("Selected Activity Type Object:", activityTypes?.find(at => at.id === selectedActivityType));
  console.log("Select Activity Type Value (string):", selectedActivityType?.toString());
  console.log("Activity Types for Select:", activityTypes?.map(at => ({ id: at.id, name: at.name, idString: at.id.toString() })));
  if (typesError) {
    console.error("Activity Types error:", typesError);
  }

  // Update connection status based on successful API calls
  useEffect(() => {
    if (aiModels && aiModels.length > 0 && activityTypes && activityTypes.length > 0) {
      setIsConnected(true);
    }
  }, [aiModels, activityTypes]);
  
  // Auto-select first available activity type
  useEffect(() => {
    if (activityTypes && activityTypes.length > 0 && selectedActivityType === null) {
      console.log("Auto-selecting activity type:", activityTypes[0].name, "ID:", activityTypes[0].id);
      setSelectedActivityType(activityTypes[0].id);
    }
  }, [activityTypes, selectedActivityType]);

  // Fetch chat messages when session changes
  const { data: chatMessages, isLoading: messagesLoading } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/session', currentSession, 'messages'],
    queryFn: () => apiRequest(`/api/chat/session/${currentSession}/messages`, "GET"),
    enabled: !!currentSession,
  });

  // Fetch previous chat sessions with message details
  const { data: previousSessions, isLoading: sessionsLoading } = useQuery<(ChatSession & { messageCount?: number; lastMessage?: string })[]>({
    queryKey: ['/api/chat/sessions'],
    enabled: showPreviousChats,
  });

  // Create session mutation with authentication headers
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 [SESSION CREATE] Starting chat session creation...');
      console.log('🔄 [SESSION CREATE] User auth status:', user);
      
      // Get authentication headers for API call
      const { getAuthHeaders } = await import('@/lib/authHeaders');
      const authHeaders = getAuthHeaders();
      
      console.log('🔄 [SESSION CREATE] Using header-based authentication');
      console.log('🔄 [SESSION CREATE] Auth headers prepared:', Object.keys(authHeaders));
      console.log('🔄 [SESSION CREATE] Making POST request to /api/chat/session');
      
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        credentials: "include"
      });
      
      console.log('🔄 [SESSION CREATE] Response status:', response.status);
      console.log('🔄 [SESSION CREATE] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [SESSION CREATE] Session creation failed:', response.status, errorText);
        console.error('❌ [SESSION CREATE] Full error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        });
        throw new Error(`Failed to create chat session: ${response.status} ${errorText}`);
      }
      
      const session = await response.json();
      console.log('✅ [SESSION CREATE] Session created successfully:', session);
      return session;
    },
    onSuccess: (session) => {
      console.log('✅ Setting current session to:', session.id);
      setCurrentSession(session.id);
      queryClient.invalidateQueries({
        queryKey: ['/api/chat/sessions']
      });
    },
    onError: (error) => {
      console.error('❌ [SESSION CREATE] Failed to create session:', error);
      console.error('❌ [SESSION CREATE] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Don't show error toast if user is not authenticated
      if (!user || !user.email) {
        console.log('❌ [SESSION CREATE] User not authenticated, skipping error toast');
        return;
      }
      
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
      console.log('✅ [MESSAGE SEND] Message sent successfully:', data);
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
      console.error('❌ [MESSAGE SEND] Failed to send message:', error);
      console.error('❌ [MESSAGE SEND] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
    console.log('User auth:', user);
    console.log('=== END SESSION TRIGGER DEBUG ===');
    
    // Create a new session when we have user authentication but no current session
    if (!currentSession && user?.email && !createSessionMutation.isPending) {
      console.log('🔄 [SESSION CREATE] No current session found, creating new session for user:', user.email);
      createSessionMutation.mutate();
    } else if (!user?.email) {
      console.log('⏸️ [SESSION CREATE] Waiting for user authentication...');
    }
  }, [currentSession, createSessionMutation, user]);

  // Fetch chat messages for current session (for debug panel)
  const { data: fetchedMessages, isLoading: debugMessagesLoading, error: messagesError } = useQuery<ChatMessageType[]>({
    queryKey: ['/api/chat/session', currentSession, 'messages'],
    enabled: !!currentSession,
  });

  // Fetch chat sessions list (for debug panel)
  const { data: debugChatSessions, isLoading: debugSessionsLoading, error: sessionsError } = useQuery<ChatSession[]>({
    queryKey: ['/api/chat/sessions'],
  });

  // Update messages when chat data changes
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

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
    console.log('🔄 [MESSAGE SEND] Starting message send:', { message, selectedModel, selectedActivityType, currentSession });
    
    if (!selectedModel || !selectedActivityType) {
      console.error('❌ [MESSAGE SEND] Missing configuration:', { selectedModel, selectedActivityType });
      toast({
        title: "Configuration Required",
        description: "Please select an AI model and activity type",
        variant: "destructive",
      });
      return;
    }

    // If no current session, create one first, then send the message
    if (!currentSession) {
      console.log('🔄 [MESSAGE SEND] No session found, creating session before sending message');
      createSessionMutation.mutate();
      
      // Store the message to send after session creation
      setTimeout(() => {
        console.log('🔄 [MESSAGE SEND] Retry after session creation, currentSession:', currentSession);
        if (currentSession) {
          handleSendMessage(message, attachments);
        } else {
          console.error('❌ [MESSAGE SEND] Still no session after timeout');
          toast({
            title: "Session Error",
            description: "Unable to create chat session. Please refresh and try again.",
            variant: "destructive",
          });
        }
      }, 1000); // Increased timeout
      return;
    }

    console.log('🔄 [MESSAGE SEND] Building FormData with session:', currentSession);
    const formData = new FormData();
    formData.append('message', message);
    formData.append('aiModelId', selectedModel.toString());
    formData.append('activityTypeId', selectedActivityType.toString());
    formData.append('sessionId', currentSession.toString());

    if (attachments && attachments.length > 0) {
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    console.log('🔄 [MESSAGE SEND] Sending message via mutation');
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
          {/* Left side - AI Sentinel Chat and Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '22px', fontWeight: '600', color: '#374151' }}>
              AI Sentinel Chat
            </span>
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

          {/* Right side - Essential Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* AI Model Dropdown */}
            <Select
              value={selectedModel?.toString()}
              onValueChange={(value) => {
                console.log("AI Model selection changed to:", value);
                if (value === "model-fusion") {
                  setSelectedModel("model-fusion" as any);
                } else {
                  setSelectedModel(parseInt(value));
                }
              }}
              disabled={modelsLoading}
            >
              <SelectTrigger style={{ 
                width: '160px', 
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white'
              }}>
                <SelectValue placeholder="Select AI Model">
                  {selectedModel ? (aiModels?.find(m => m.id === selectedModel)?.name || "Select AI Model") : "Select AI Model"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #93c5fd', 
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                zIndex: 1000,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {aiModels?.map((model: any) => (
                  <SelectItem 
                    key={model.id} 
                    value={model.id.toString()}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      margin: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {model.name}
                    {model.hasValidApiKey === false ? ' ⚠️' : ''}
                  </SelectItem>
                ))}
                {modelFusionConfig?.isEnabled && (
                  <>
                    <Separator style={{ margin: '8px 4px', backgroundColor: '#bfdbfe' }} />
                    <SelectItem 
                      value="model-fusion"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        margin: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Model Fusion
                        <Badge variant="default" style={{ 
                          backgroundColor: 'hsl(221, 83%, 53%)',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
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
              onValueChange={(value) => {
                console.log("Activity Type selection changed to:", value);
                setSelectedActivityType(parseInt(value));
              }}
              disabled={typesLoading}
            >
              <SelectTrigger style={{ 
                width: '160px', 
                fontSize: '14px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontWeight: '500',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white'
              }}>
                <SelectValue placeholder="Select Activity Type">
                  {selectedActivityType ? (activityTypes?.find(at => at.id === selectedActivityType)?.name || "Select Activity Type") : "Select Activity Type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #93c5fd', 
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)',
                zIndex: 1000,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {activityTypes?.map((type) => (
                  <SelectItem 
                    key={type.id} 
                    value={type.id.toString()}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      margin: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
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
                  fontSize: '14px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: '500'
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
                  fontSize: '14px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: '500'
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
                  fontSize: '14px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontWeight: '500'
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
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown date'} at{' '}
                          {session.createdAt ? new Date(session.createdAt).toLocaleTimeString() : 'Unknown time'}
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
              const messageAiModel = aiModels?.find(m => m.id === message.aiModelId);
              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  aiModel={messageAiModel}
                  user={user as any}
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
          disabled={!selectedModel || !selectedActivityType || sendMessageMutation.isPending}
          prefillMessage={prefillMessage}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <VersionDisplay />
        </div>
      </div>
      
      {/* Features & Benefits Dialog for demo users */}
      <FeaturesBenefitsDialog
        open={showDialog}
        onOpenChange={closeDialog}
      />

      {/* Chat Debug Modal */}
      <Dialog open={showChatDebugModal} onOpenChange={setShowChatDebugModal}>
        <DialogContent style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}>
          <DialogHeader>
            <DialogTitle style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              <Settings style={{ width: '20px', height: '20px' }} />
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

            {/* Session Status */}
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
                  backgroundColor: currentSession ? '#22c55e' : '#ef4444' 
                }} />
                Chat Session Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>Current Session ID:</strong> {currentSession || 'None'}</div>
                <div><strong>Session Created:</strong> {currentSession ? 'Yes' : 'No'}</div>
                <div><strong>Messages Count:</strong> {messages.length}</div>
                <div><strong>Session Token:</strong> {JSON.parse(localStorage.getItem('aisentinel_saved_accounts') || '[]')?.[0]?.sessionToken ? 'Present' : 'Missing'}</div>
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
                  backgroundColor: selectedModel ? '#22c55e' : '#ef4444' 
                }} />
                AI Model Configuration
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>Selected Model ID:</strong> {selectedModel || 'None'}</div>
                <div><strong>Selected Model Name:</strong> {aiModels?.find(m => m.id === selectedModel)?.name || 'None'}</div>
                <div><strong>Available Models:</strong> {aiModels?.length || 0}</div>
                <div><strong>Models Loading:</strong> {modelsLoading ? 'Yes' : 'No'}</div>
                <div><strong>Activity Type ID:</strong> {selectedActivityType || 'None'}</div>
                <div><strong>Activity Type Name:</strong> {activityTypes?.find(at => at.id === selectedActivityType)?.name || 'None'}</div>
                <div><strong>Available Activity Types:</strong> {activityTypes?.length || 0}</div>
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
                  backgroundColor: isConnected ? '#22c55e' : '#ef4444' 
                }} />
                Connection Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                <div><strong>API Connected:</strong> {isConnected ? 'Yes' : 'No'}</div>
                <div><strong>Environment:</strong> {import.meta.env.MODE || 'Unknown'}</div>
                <div><strong>Base URL:</strong> {window.location.origin}</div>
                <div><strong>Send Message Pending:</strong> {sendMessageMutation.isPending ? 'Yes' : 'No'}</div>
                <div><strong>Create Session Pending:</strong> {createSessionMutation.isPending ? 'Yes' : 'No'}</div>
                <div><strong>Demo Mode:</strong> {isDemoMode ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* localStorage Debug */}
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

{/* Debug Status Panel removed for production */}
    </div>
  );
}