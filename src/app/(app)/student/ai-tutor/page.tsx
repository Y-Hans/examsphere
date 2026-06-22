'use client';

import { useState, useEffect, useRef } from 'react';
import { startTutorConversationAction, sendTutorMessageAction } from '@/modules/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MathText } from '@/components/ui/katex';
import { Loader2, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiTutorPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize conversation on mount
    async function init() {
      const result = await startTutorConversationAction(new FormData());
      if (result.success && result.data?.conversation?.id) {
        setConversationId(result.data.conversation.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('message', userMessage);

    const result = await sendTutorMessageAction(formData);
    
    if (result.success && result.data?.message) {
      setMessages(prev => [...prev, { role: 'assistant', content: result.data.message }]);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">AI Tutor</h1>
        <p className="text-sm text-gray-500">Ask me anything about Physics, Chemistry, Mathematics, or Biology.</p>
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <p className="text-lg">Start asking your doubts!</p>
            <p className="text-sm mt-2">I can explain concepts, solve problems step-by-step, and create practice questions.</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="prose prose-sm max-w-none">
                <MathText text={msg.content} />
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your question... (Use $...$ for LaTeX math)"
          disabled={loading || !conversationId}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={loading || !conversationId || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}