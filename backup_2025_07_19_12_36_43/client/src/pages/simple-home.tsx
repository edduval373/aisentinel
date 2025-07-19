import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Settings } from "lucide-react";


export default function SimpleHome() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: 'assistant', content: 'Hello! Welcome to AI Sentinel Demo Mode. You can chat with me to see how the platform works. For full enterprise features, please log in with your company credentials.' }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage('');
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        'This is a demo response from AI Sentinel. In the full version, you would have access to multiple AI models like GPT-4, Claude, and more.',
        'AI Sentinel provides enterprise-grade AI governance with content filtering, activity monitoring, and compliance features.',
        'In demo mode, you can explore the interface. Sign up to access real AI models, company branding, and administrative features.',
        'The full AI Sentinel platform includes role-based access control, activity tracking, and integration with your company\'s workflow.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/ai-sentinel-logo.png" 
            alt="AI Sentinel" 
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-800">AI Sentinel</h1>
            <Badge variant="outline" className="text-xs">Demo Mode</Badge>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
            <Settings className="w-4 h-4 mr-2" />
            Login for Full Features
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Chat Interface</h2>
          <p className="text-slate-600">Experience AI Sentinel's enterprise AI governance platform</p>
        </div>
        
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <CardTitle className="text-lg">Demo Chat Session</CardTitle>
              </div>
              <Badge variant="secondary">Demo Model</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message to try the demo..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!message.trim()}>
                  Send
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Demo mode - responses are simulated. <a href="/login" className="text-blue-500 hover:underline">Login</a> for real AI interactions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}