import React, { useRef, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { Message } from '../types';
import { ReadAloudButton } from './ReadAloudButton';

interface ChatThreadProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  storyContext?: string;
}

export function ChatThread({ messages, isLoading, onSendMessage, storyContext }: ChatThreadProps) {
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {storyContext && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 max-w-2xl bg-indigo-50/50 rounded-2xl rounded-tl-sm px-5 py-4 border border-indigo-100">
               <div className="prose prose-sm max-w-none text-gray-800">
                 <div className="markdown-body">
                   <Markdown>{storyContext}</Markdown>
                 </div>
               </div>
               <div className="mt-3">
                 <ReadAloudButton text={storyContext} />
               </div>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isModel = msg.role === 'model';
          return (
            <div key={index} className={`flex items-start space-x-3 ${isModel ? '' : 'flex-row-reverse space-x-reverse'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isModel ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {isModel ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`flex-1 max-w-2xl px-5 py-4 ${
                isModel 
                  ? 'bg-indigo-50/50 rounded-2xl rounded-tl-sm border border-indigo-100 text-gray-800' 
                  : 'bg-gray-900 rounded-2xl rounded-tr-sm text-white'
              }`}>
                <div className={`prose prose-sm max-w-none ${isModel ? '' : 'prose-invert'}`}>
                  <div className="markdown-body">
                    <Markdown>{msg.parts[0].text}</Markdown>
                  </div>
                </div>
                {isModel && (
                  <div className="mt-3">
                    <ReadAloudButton text={msg.parts[0].text} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start space-x-3">
             <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-5 py-4 bg-indigo-50/50 rounded-2xl rounded-tl-sm border border-indigo-100 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-sm text-indigo-500 font-medium">Writing...</span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative flex items-end w-full max-w-4xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !storyContext}
            placeholder={storyContext ? "Continue the story or give directions..." : "Upload an image first..."}
            className="w-full pl-5 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !storyContext}
            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
