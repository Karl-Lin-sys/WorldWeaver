/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ImageUpload } from './components/ImageUpload';
import { ChatThread } from './components/ChatThread';
import { Message } from './types';
import { Sparkles, RefreshCcw } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<'upload' | 'chat'>('upload');
  const [imageContext, setImageContext] = useState<{ objectUrl: string, base64: string } | null>(null);
  const [storyContext, setStoryContext] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelected = async (base64: string, mimeType: string, objectUrl: string) => {
    setImageContext({ objectUrl, base64 });
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/start-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      if (!res.ok) throw new Error('Failed to analyze image');
      
      const data = await res.json();
      setStoryContext(data.text);
      setAppState('chat');
    } catch (err) {
      setError('Could not generate the story. Please try again.');
      setImageContext(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    const newMessage: Message = { role: 'user', parts: [{ text }] };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // We pass the storyContext as the first model turn so Gemini remembers it
      const historyContext: Message[] = [
         { role: 'user', parts: [{ text: 'Here is the starting paragraph you wrote based on the image.' }] },
         { role: 'model', parts: [{ text: storyContext }] }
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [...historyContext, ...updatedMessages] }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      
      const data = await res.json();
      setMessages([...updatedMessages, { role: 'model', parts: [{ text: data.text }] }]);
    } catch (err) {
      console.error(err);
      // Optional: show a small toast error or inline error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAppState('upload');
    setImageContext(null);
    setStoryContext('');
    setMessages([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">WorldWeaver</h1>
        </div>
        {appState === 'chat' && (
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-8 h-[calc(100vh-73px)]">
        {/* Left side: Context (Image) */}
        <div className={`transition-all duration-500 ease-in-out flex flex-col ${appState === 'upload' ? 'w-full max-w-2xl mx-auto justify-center' : 'w-full md:w-1/3'}`}>
          {appState === 'upload' ? (
            <div className="space-y-8 text-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                  Visualize your story
                </h2>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  Upload an image, and our AI will craft a vivid opening paragraph set in that exact world.
                </p>
              </div>
              
              <ImageUpload onImageSelected={handleImageSelected} disabled={isLoading} />
              
              {isLoading && (
                <div className="flex flex-col items-center space-y-3 text-indigo-600 animate-pulse">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="font-medium">Analyzing scene & weaving magic...</p>
                </div>
              )}
              {error && (
                <p className="text-red-600 font-medium">{error}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">Inspiration</h3>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {imageContext && (
                  <img 
                    src={imageContext.objectUrl} 
                    alt="Story Inspiration" 
                    className="w-full h-auto rounded-lg object-cover shadow-sm border border-gray-100"
                  />
                )}
                <div className="mt-6 text-sm text-gray-500 leading-relaxed">
                  This image was analyzed to create the starting scene. You can now chat with the AI co-author to continue the story, introduce characters, or explore the world.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side: Chat Thread */}
        {appState === 'chat' && (
          <div className="flex-1 h-full min-h-[500px]">
            <ChatThread 
              storyContext={storyContext}
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
