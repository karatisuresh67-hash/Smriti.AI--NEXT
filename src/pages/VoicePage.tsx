import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Brain, 
  Square, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  VoiceAssistantService, 
  type VoiceStatus, 
  type VoiceMessage 
} from '../services/voiceAssistantService';
import { ActionCard } from '../components/chat/ActionCard';
import type { ProposedAction } from '../types';

export function VoicePage() {
  const { memories, reminders, addMemory, addReminder, addToast } = useApp();
  
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const voiceServiceRef = useRef<VoiceAssistantService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const service = new VoiceAssistantService({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus !== 'error') {
          setErrorMessage(null);
        }
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onTranscript: (msg) => {
        setMessages((prev) => [...prev, msg]);
      },
      onError: (err) => {
        setErrorMessage(err);
        addToast(err, 'error');
      }
    });

    voiceServiceRef.current = service;

    return () => {
      service.endSession();
    };
  }, [addToast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleToggleSession = async () => {
    if (!voiceServiceRef.current) return;

    if (status === 'idle' || status === 'error') {
      setErrorMessage(null);
      await voiceServiceRef.current.startSession(memories, reminders);
    } else {
      voiceServiceRef.current.endSession();
    }
  };

  const handleInterrupt = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.interruptSpeech();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (!voiceServiceRef.current) return;
    if (status === 'idle') {
      voiceServiceRef.current.initializeAudio().then((ready) => {
        if (ready) {
          setMessages((prev) => [
            ...prev,
            {
              id: `quick-${Date.now()}`,
              sender: 'user',
              text: prompt,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setStatus('thinking');
          voiceServiceRef.current?.processGroundedQuery(prompt, memories, reminders);
        }
      });
    }
  };

  // Status visual labels
  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Connecting to Smriti Voice...', color: 'text-amber-500 bg-amber-50 border-amber-200' };
      case 'listening':
        return { text: 'Listening to your voice...', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'thinking':
        return { text: 'Thinking & retrieving memories...', color: 'text-violet-600 bg-violet-50 border-violet-200' };
      case 'speaking':
        return { text: 'Smriti is speaking...', color: 'text-sky-600 bg-sky-50 border-sky-200' };
      case 'interrupted':
        return { text: 'Interrupted • Listening...', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'error':
        return { text: 'Connection notice', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      default:
        return { text: 'Ready • Tap microphone to speak', color: 'text-slate-600 bg-slate-100 border-slate-200' };
    }
  };

  const statusInfo = getStatusLabel();

  // Dynamic orb scaling based on audio level
  const orbScale = 1 + audioLevel * 0.45;
  const glowOpacity = 0.4 + audioLevel * 0.6;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Mic className="w-4 h-4" />
            </div>
            Voice Assistant
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Remember what matters. Let AI handle the rest.
          </p>
        </div>

        <div className={`self-center sm:self-auto inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
          <span className={`w-2 h-2 rounded-full ${
            status === 'listening' ? 'bg-emerald-500 animate-ping' :
            status === 'thinking' ? 'bg-violet-500 animate-pulse' :
            status === 'speaking' ? 'bg-sky-500 animate-bounce' : 'bg-slate-400'
          }`} />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      {/* Main Interactive Voice Orb Arena */}
      <div className="relative bg-gradient-to-b from-navy-950 via-navy-900 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-soft-xl overflow-hidden border border-navy-800 flex flex-col items-center justify-center min-h-[380px]">
        {/* Background ambient light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />

        {/* The Animated Voice Orb */}
        <div className="relative flex items-center justify-center my-6">
          {/* Outer Ripple Rings when Listening */}
          {status === 'listening' && (
            <>
              <div 
                className="absolute w-64 h-64 rounded-full border border-emerald-400/30 animate-ping pointer-events-none"
                style={{ animationDuration: '2s' }}
              />
              <div 
                className="absolute w-52 h-52 rounded-full border border-emerald-300/40 animate-pulse pointer-events-none" 
              />
            </>
          )}

          {/* Halo when Thinking */}
          {status === 'thinking' && (
            <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-indigo-500 opacity-40 blur-xl animate-spin pointer-events-none" style={{ animationDuration: '4s' }} />
          )}

          {/* Sound wave rings when Speaking */}
          {status === 'speaking' && (
            <div 
              className="absolute w-60 h-60 rounded-full border-2 border-sky-400/40 animate-pulse pointer-events-none"
              style={{ transform: `scale(${orbScale * 1.1})` }}
            />
          )}

          {/* Core Interactive Glowing Orb */}
          <div
            onClick={handleToggleSession}
            role="button"
            tabIndex={0}
            aria-label={status === 'idle' ? 'Start voice conversation' : 'Stop voice conversation'}
            className="w-40 h-40 sm:w-44 sm:h-44 rounded-full cursor-pointer flex items-center justify-center relative transition-all duration-150 active:scale-95 shadow-glow select-none group"
            style={{
              transform: `scale(${orbScale})`,
              boxShadow: `0 0 50px rgba(124, 58, 237, ${glowOpacity}), 0 0 100px rgba(56, 189, 248, ${glowOpacity * 0.5})`
            }}
          >
            {/* Orb Surface Shader */}
            <div className={`w-full h-full rounded-full transition-all duration-300 flex items-center justify-center p-1 ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-violet-600 via-purple-500 to-pink-500'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-violet-600'
                : 'bg-gradient-to-tr from-violet-700 via-indigo-600 to-blue-600 group-hover:from-violet-600 group-hover:to-accent-blue'
            }`}>
              <div className="w-full h-full rounded-full bg-navy-950/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                {status === 'idle' && (
                  <>
                    <Mic className="w-10 h-10 text-white/90 group-hover:scale-110 transition-transform mb-1" />
                    <span className="text-xs font-semibold text-slate-200">Tap to Talk</span>
                  </>
                )}
                {status === 'listening' && (
                  <>
                    <Mic className="w-10 h-10 text-emerald-300 animate-pulse mb-1" />
                    <span className="text-xs font-semibold text-emerald-200">Listening</span>
                  </>
                )}
                {status === 'thinking' && (
                  <>
                    <Sparkles className="w-10 h-10 text-purple-300 animate-spin mb-1" />
                    <span className="text-xs font-semibold text-purple-200">Thinking</span>
                  </>
                )}
                {status === 'speaking' && (
                  <>
                    <Volume2 className="w-10 h-10 text-sky-300 animate-bounce mb-1" />
                    <span className="text-xs font-semibold text-sky-200">Speaking</span>
                  </>
                )}
                {status === 'interrupted' && (
                  <>
                    <Mic className="w-10 h-10 text-purple-300 animate-pulse mb-1" />
                    <span className="text-xs font-semibold text-purple-200">Interrupted</span>
                  </>
                )}
                {status === 'connecting' && (
                  <span className="text-xs font-semibold text-amber-200">Connecting...</span>
                )}
                {status === 'error' && (
                  <>
                    <MicOff className="w-10 h-10 text-rose-300 mb-1" />
                    <span className="text-xs font-semibold text-rose-200">Retry</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 mt-4 z-10">
          <button
            onClick={handleToggleSession}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 ${
              status === 'idle'
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-900/40'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/40'
            }`}
          >
            {status === 'idle' ? (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Conversation</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Conversation</span>
              </>
            )}
          </button>

          {status === 'speaking' && (
            <button
              onClick={handleInterrupt}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 transition-colors"
            >
              Stop Speaking
            </button>
          )}
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center space-x-2 max-w-md">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <span>Try saying to Smriti:</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "When is Rahul's birthday?",
            "What did I save about my coffee preference?",
            "Show my upcoming reminders for this week",
            "Remind me to call Mom tomorrow at 6 PM",
            "Save a memory that Rahul likes dark chocolate"
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(prompt)}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-violet-50 hover:text-violet-700 border border-slate-200 text-slate-700 font-medium transition-colors text-left"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Live Transcript / Shared Conversation History */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-soft flex flex-col h-[400px]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-violet-600" />
            <h2 className="text-base font-bold text-navy-900">Voice Transcript</h2>
          </div>
          <span className="text-xs text-slate-400">
            {messages.length} {messages.length === 1 ? 'turn' : 'turns'}
          </span>
        </div>

        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto space-y-4 pr-1"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Mic className="w-10 h-10 stroke-[1.5] mb-2 opacity-40 text-violet-600" />
              <p className="text-sm font-semibold text-navy-900">No voice conversation yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Tap the glowing orb above or use a quick prompt to talk to Smriti AI in real-time.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-violet-600 text-white rounded-br-none shadow-sm'
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                  <span className={`block text-[10px] mt-1.5 ${
                    msg.sender === 'user' ? 'text-violet-200' : 'text-slate-400'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Proposed Action Card */}
                {msg.action && (
                  <div className="mt-2 w-full max-w-[85%]">
                    <ActionCard
                      action={msg.action}
                      onActionExecuted={() => addToast('Action saved successfully', 'success')}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
