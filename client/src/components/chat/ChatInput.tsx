import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  prefillMessage?: string;
}

export default function ChatInput({ onSendMessage, disabled, prefillMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  // Handle prefill message
  useEffect(() => {
    if (prefillMessage) {
      setMessage(prefillMessage);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [prefillMessage]);

  const handleVoiceTranscription = (transcription: string) => {
    setMessage(prev => prev + (prev ? ' ' : '') + transcription);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <form onSubmit={handleSubmit} className="flex items-end space-x-4">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[40px] max-h-32 resize-none"
            disabled={disabled}
          />
        </div>
        <div className="flex items-end space-x-2">
          <VoiceInput 
            onTranscription={handleVoiceTranscription}
            disabled={disabled}
          />
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="bg-sentinel-blue hover:bg-blue-600 px-4 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>All conversations are monitored and logged for compliance.</span>
        <span>Press Enter to send</span>
      </div>
    </div>
  );
}