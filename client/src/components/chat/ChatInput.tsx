import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, File } from "lucide-react";
import VoiceInput from "./VoiceInput";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  prefillMessage?: string;
}

export default function ChatInput({ onSendMessage, disabled, prefillMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachments);
      setMessage("");
      setAttachments([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      {/* File attachments preview */}
      {attachments.length > 0 && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm font-medium text-slate-700 mb-2">
            Attachments ({attachments.length})
          </div>
          <div className="space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700 truncate max-w-48">{file.name}</span>
                  <span className="text-xs text-slate-500">({formatFileSize(file.size)})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-4">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[40px] max-h-32 resize-none border border-blue-300 focus:border-sentinel-blue focus:ring-1 focus:ring-sentinel-blue"
            disabled={disabled}
          />
        </div>
        <div className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,text/*,.pdf,.json,.xlsx,.docx,.txt,.md"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-3 py-2"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <VoiceInput 
            onTranscription={handleVoiceTranscription}
            disabled={disabled}
          />
          <Button
            type="submit"
            disabled={(!message.trim() && attachments.length === 0) || disabled}
            className="bg-sentinel-blue hover:bg-blue-600 px-4 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span>All conversations are monitored and logged for compliance.</span>
        <span>Press Enter to send • Max 10MB per file</span>
      </div>
    </div>
  );
}