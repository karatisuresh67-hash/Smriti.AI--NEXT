import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  Brain, 
  StopCircle,
  HelpCircle,
  Terminal,
  Bot
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../components/chat/ChatMessage';
import { VoiceControls, VoiceStatusBanner } from '../components/chat/VoiceControls';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { sendChatMessage } from '../services/apiService';
import type { ChatMessageItem } from '../types';

export function ChatPage() {
  const { 
    chatMessages, 
    setChatMessages, 
    memories, 
    reminders, 
    tasks,
    settings,
    dispatchChromeAction 
  } = useApp();

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition Hook
  const {
    isSupported: isSpeechRecSupported,
    isListening,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition({
    onTranscript: (liveText) => {
      setInput(liveText);
    }
  });

  // Speech Synthesis Hook
  const {
    isSupported: isSpeechSynthSupported,
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSpeak = (text: string, messageId: string) => {
    setCurrentlySpeakingId(messageId);
    speak(text);
  };

  const handleStopSpeak = () => {
    stopSpeaking();
    setCurrentlySpeakingId(null);
  };

  useEffect(() => {
    if (!isSpeaking) {
      setCurrentlySpeakingId(null);
    }
  }, [isSpeaking]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    setInput('');
    clearTranscript();
    setApiError(null);

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessageItem = {
      id: userMsgId,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...chatMessages, userMessage];
    setChatMessages(newHistory);
    setIsLoading(true);

    try {
      const historyPayload = chatMessages
        .filter(m => m.id !== 'welcome-msg')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }));

      const response = await sendChatMessage({
        message: messageText,
        history: historyPayload,
        memories,
        reminders,
        tasks,
        currentDateTime: new Date().toISOString(),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });

      const assistantMsgId = `ai-${Date.now()}`;
      const assistantMessage: ChatMessageItem = {
        id: assistantMsgId,
        role: 'assistant',
        content: response.reply,
        action: response.action,
        timestamp: new Date().toISOString(),
      };

      setChatMessages([...newHistory, assistantMessage]);

      // If action is a Chrome-native website action, automatically dispatch and launch
      if (response.action && response.action.type === 'chrome_action') {
        dispatchChromeAction({
          command: messageText,
          websiteName: response.action.websiteName,
          actionType: response.action.actionType,
          destinationUrl: response.action.destinationUrl,
          targetTitle: response.action.targetTitle,
          executionMode: response.action.executionMode,
          requiresApproval: response.action.requiresApproval,
        });
      }

      if (settings.voiceResponse && response.reply) {
        handleSpeak(response.reply, assistantMsgId);
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      setApiError(err?.message || 'Failed to get response from Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    handleStopSpeak();
    setChatMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "Chat session restarted. I have your current saved memories, reminders, and tasks ready. How can I assist you?",
        timestamp: new Date().toISOString(),
        action: null,
      }
    ]);
    setApiError(null);
  };

  const sampleQuestions = [
    "What tasks do I have scheduled this week?",
    "Remember that our product launch is on Friday",
    "Summarize my recent knowledge notes",
    "Schedule a task to review project roadmap tomorrow at 10 AM",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#070C1E] rounded-2xl border border-[#1E2540] shadow-xl mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Smriti AI Assistant</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                GEMINI 2.5
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Grounded in {memories.length} memories, {reminders.length} reminders & {tasks.length} tasks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isSpeaking && (
            <button
              onClick={handleStopSpeak}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          )}

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#151D36] rounded-xl transition-colors border border-transparent hover:border-[#1E2540]"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-3 py-2 space-y-3">
        {chatMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onSpeak={isSpeechSynthSupported ? handleSpeak : null}
            onStopSpeak={handleStopSpeak}
            isSpeaking={isSpeaking}
            currentlySpeakingId={currentlySpeakingId}
          />
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3 mb-4 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-[#0B1024] border border-[#1E2540] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 ml-2 font-medium">Smriti AI is reasoning...</span>
              </div>
            </div>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs my-2 flex items-center justify-between">
            <span>{apiError}</span>
            <button
              onClick={() => setApiError(null)}
              className="text-xs font-bold text-rose-400 underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts if only welcome message exists */}
      {chatMessages.length <= 1 && (
        <div className="px-3 py-2 mb-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suggested directives:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-cyan-500/40 hover:bg-[#0E1530] text-slate-300 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Status Banner */}
      <VoiceStatusBanner
        isListening={isListening}
        error={speechError}
        onDismissError={clearTranscript}
      />

      {/* Input Bar */}
      <div className="p-3 bg-[#070C1E] border border-[#1E2540] rounded-2xl shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <VoiceControls
            isSupported={isSpeechRecSupported}
            isListening={isListening}
            error={speechError}
            onStartListening={startListening}
            onStopListening={stopListening}
          />

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Ask Smriti anything or tell her what to remember..."}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 text-sm bg-[#0B1024] rounded-xl border border-[#1E2540] text-white focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
