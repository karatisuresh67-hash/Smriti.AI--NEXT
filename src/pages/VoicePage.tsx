import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Brain, 
  Square, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Bell,
  Play,
  History,
  FileText,
  ExternalLink,
  Plus,
  CheckSquare,
  ArrowRight,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  VoiceAssistantService, 
  type VoiceStatus, 
  type VoiceMessage 
} from '../services/voiceAssistantService';
import { ActionCard } from '../components/chat/ActionCard';
import type { ProposedAction } from '../types';

interface VoiceHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  frequency: number; // 1 to 5 for meter bars
  extractedType: 'task' | 'reminder' | 'memory' | 'search';
}

export function VoicePage() {
  const { memories, reminders, tasks, documents, addMemory, addReminder, addTask, dispatchChromeAction, addToast } = useApp();
  
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [extractedActions, setExtractedActions] = useState<ProposedAction[]>([]);

  // Search History for Left Panel
  const [historyItems, setHistoryItems] = useState<VoiceHistoryItem[]>([]);

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
        if (msg.action) {
          setExtractedActions(prev => [msg.action!, ...prev]);
          if (msg.action.type === 'chrome_action') {
            dispatchChromeAction({
              command: msg.action.targetTitle || msg.action.query || `Voice: ${msg.action.websiteName}`,
              websiteName: msg.action.websiteName,
              actionType: msg.action.actionType,
              destinationUrl: msg.action.destinationUrl,
              targetTitle: msg.action.targetTitle,
              executionMode: msg.action.executionMode,
            });
          }
        }
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
      await voiceServiceRef.current.startSession(memories, reminders, tasks, documents);
    } else {
      voiceServiceRef.current.endSession();
    }
  };

  const handleInterrupt = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.interruptSpeech();
    }
  };

  const handleRunPastQuery = (query: string) => {
    if (!voiceServiceRef.current) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `query-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setStatus('thinking');
    voiceServiceRef.current.processGroundedQuery(query, memories, reminders, tasks, documents);
  };

  const handleApplyAction = async (action: ProposedAction) => {
    try {
      if (action.type === 'create_memory') {
        await addMemory({
          title: action.title,
          content: action.content,
          category: action.category || 'Personal',
          date: action.date,
          person: action.person
        });
      } else if (action.type === 'create_reminder') {
        await addReminder({
          title: action.title,
          description: action.description,
          date: action.date,
          time: action.time,
          category: action.category || 'Personal',
          priority: action.priority || 'Medium',
          linkedMemoryId: action.linkedMemoryId
        });
      } else if (action.type === 'create_task') {
        await addTask({
          title: action.title,
          description: action.description,
          dueDate: action.dueDate,
          dueTime: action.dueTime,
          priority: action.priority || 'Medium',
          category: action.category || 'Personal',
          source: 'voice'
        });
      } else if (action.type === 'chrome_action') {
        await dispatchChromeAction({
          command: action.targetTitle || action.query || `Voice: ${action.websiteName}`,
          websiteName: action.websiteName,
          actionType: action.actionType,
          destinationUrl: action.destinationUrl,
          targetTitle: action.targetTitle,
          executionMode: action.executionMode,
        });
      } else if (action.type === 'create_calendar_event') {
        await addReminder({
          title: `📅 ${action.title}`,
          description: `Location: ${action.location || 'Online'}. ${action.description || ''}`,
          date: action.date,
          time: action.startTime,
          category: 'Work',
          priority: 'High'
        });
      }
      addToast('Action applied successfully from voice command!', 'success');
      setExtractedActions(prev => prev.filter(a => a !== action));
    } catch (err: any) {
      addToast(`Failed to apply action: ${err?.message}`, 'error');
    }
  };

  // Status visual labels
  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return { text: 'Connecting...', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'listening':
        return { text: 'Listening...', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'thinking':
        return { text: 'Thinking & Grounding...', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
      case 'speaking':
        return { text: 'Speaking...', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      case 'interrupted':
        return { text: 'Interrupted', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'error':
        return { text: 'Notice', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      default:
        return { text: 'Idle • Ready to speak', color: 'text-slate-400 bg-[#0B1024] border-[#1E2540]' };
    }
  };

  const statusInfo = getStatusLabel();
  const orbScale = 1 + audioLevel * 0.45;
  const glowOpacity = 0.4 + audioLevel * 0.6;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]">
              <Mic className="w-4 h-4" />
            </div>
            <span>Smriti Voice Assistant</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Conversational real-time voice agent grounded in your personal memories and tasks.
          </p>
        </div>

        <div className={`self-start sm:self-auto inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
          <span className={`w-2 h-2 rounded-full ${
            status === 'listening' ? 'bg-emerald-400 animate-ping' :
            status === 'thinking' ? 'bg-violet-400 animate-pulse' :
            status === 'speaking' ? 'bg-cyan-400 animate-bounce' : 'bg-slate-500'
          }`} />
          <span>{statusInfo.text}</span>
        </div>
      </div>

      {/* 3-PANEL FUTURISTIC LAYOUT (Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* =========================================================================
            LEFT PANEL: Voice Commands & Search History (Image 2 Left)
           ========================================================================= */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2540]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search History</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Recent</span>
            </div>

            <div className="space-y-2.5 mt-3">
              {historyItems.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-[#070C1E] border border-[#1E2540] text-slate-500 text-xs">
                  No voice commands yet. Tap the microphone and speak to interact.
                </div>
              ) : (
                historyItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleRunPastQuery(item.query)}
                    className="p-2.5 rounded-xl bg-[#070C1E] border border-[#1E2540] hover:border-cyan-500/40 hover:bg-[#0E1530] transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2">
                      "{item.query}"
                    </p>
                    
                    {/* Frequency meter bars */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#151D36] text-[10px] text-slate-500">
                      <span>{item.timestamp}</span>
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map(bar => (
                          <div
                            key={bar}
                            className={`w-1 rounded-full transition-all ${
                              bar <= item.frequency 
                                ? 'bg-cyan-400 h-3' 
                                : 'bg-slate-700 h-1.5'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Voice Prompt Tip</span>
            </span>
            <p>Say "Remember my project launch date is Friday" or "Schedule task for tomorrow 10 AM".</p>
          </div>
        </div>

        {/* =========================================================================
            CENTER PANEL: Glowing Sphere Visualizer & Live Transcript (Image 2 Center)
           ========================================================================= */}
        <div className="lg:col-span-6 rounded-2xl bg-gradient-to-b from-[#0B1024] via-[#070C1E] to-[#0A0E24] border border-[#1E2540] p-6 flex flex-col justify-between relative overflow-hidden min-h-[520px]">
          {/* Background Ambient Radial Light */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none" />

          {/* Central 3D Glowing Neon Orb Arena */}
          <div className="relative flex flex-col items-center justify-center my-6 select-none">
            {/* Outer Orbit Rings */}
            <div 
              className="absolute w-72 h-72 rounded-full border border-cyan-400/20 animate-spin pointer-events-none" 
              style={{ animationDuration: '24s' }} 
            />
            <div 
              className="absolute w-60 h-60 rounded-full border border-indigo-400/25 animate-spin pointer-events-none" 
              style={{ animationDuration: '16s', animationDirection: 'reverse' }} 
            />

            {/* Ripple Wave when Listening */}
            {status === 'listening' && (
              <>
                <div 
                  className="absolute w-64 h-64 rounded-full border border-emerald-400/40 animate-ping pointer-events-none" 
                  style={{ animationDuration: '2s' }} 
                />
                <div 
                  className="absolute w-56 h-56 rounded-full border border-emerald-300/30 animate-pulse pointer-events-none" 
                />
              </>
            )}

            {/* Pulsing Wave when Speaking */}
            {status === 'speaking' && (
              <div 
                className="absolute w-64 h-64 rounded-full border-2 border-cyan-400/40 animate-pulse pointer-events-none"
                style={{ transform: `scale(${orbScale * 1.15})` }}
              />
            )}

            {/* Core Interactive Glowing Neon Sphere */}
            <div
              onClick={handleToggleSession}
              role="button"
              tabIndex={0}
              aria-label={status === 'idle' ? 'Start voice conversation' : 'Stop voice conversation'}
              className="w-40 h-40 sm:w-44 sm:h-44 rounded-full cursor-pointer flex items-center justify-center relative transition-all duration-150 active:scale-95 shadow-glow select-none group"
              style={{
                transform: `scale(${orbScale})`,
                boxShadow: `0 0 50px rgba(99, 102, 241, ${glowOpacity}), 0 0 100px rgba(56, 189, 248, ${glowOpacity * 0.6})`,
                background: 'radial-gradient(circle at 35% 35%, #38BDF8 0%, #4F46E5 45%, #0B1024 100%)',
              }}
            >
              {/* Inner glowing core */}
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-inner">
                {status === 'idle' ? (
                  <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                ) : status === 'speaking' ? (
                  <Volume2 className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
                )}
              </div>
            </div>

            {/* State Caption */}
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>{statusInfo.text}</span>
            </p>
          </div>

          {/* Real-time Live Transcript Log */}
          <div 
            ref={scrollRef}
            className="h-32 overflow-y-auto p-3 rounded-xl bg-[#070C1E]/80 border border-[#1E2540] text-xs space-y-2 mb-4 scrollbar-thin"
          >
            {messages.length === 0 ? (
              <p className="text-slate-500 italic text-center py-6">
                Tap the glowing sphere or microphone to start conversational speaking...
              </p>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' 
                      : 'bg-[#121A38] text-slate-200 border border-[#1E2540]'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.timestamp}</span>
                </div>
              ))
            )}
          </div>

          {/* Interactive Voice Controls Bar */}
          <div className="p-3 rounded-xl bg-[#0B1024] border border-[#1E2540] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSession}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  status === 'idle'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                }`}
              >
                {status === 'idle' ? <Mic className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span>{status === 'idle' ? 'Start Voice' : 'End Session'}</span>
              </button>

              {status === 'speaking' && (
                <button
                  onClick={handleInterrupt}
                  className="px-2.5 py-1.5 rounded-xl bg-[#151D36] text-amber-300 text-xs font-semibold hover:bg-[#1E2948] transition-colors"
                >
                  Interrupt
                </button>
              )}
            </div>

            {/* Audio Level Graphic Bars */}
            <div className="flex items-center space-x-1 px-3">
              {[0.2, 0.4, 0.7, 0.5, 0.9, 0.3, 0.6].map((mult, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-cyan-400 rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(4, audioLevel * 28 * mult)}px`,
                    opacity: status === 'idle' ? 0.3 : 1
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: "Searched By Command" / Context Extraction (Image 2 Right)
           ========================================================================= */}
        <div className="lg:col-span-3 p-4 rounded-2xl bg-[#0B1024] border border-[#1E2540] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2540]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Searched By Command</span>
              </h2>
              <span className="text-[10px] text-slate-500">Extracted</span>
            </div>

            <div className="space-y-3 mt-3">
              {/* Proposed Actions from Voice Assistant */}
              {extractedActions.length > 0 ? (
                extractedActions.map((act, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#070C1E] border border-cyan-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white capitalize text-[11px]">
                        {act.type.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        Voice Ready
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs font-medium">
                      {'title' in act ? act.title : 'content' in act ? act.content : 'Action'}
                    </p>

                    <button
                      onClick={() => handleApplyAction(act)}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Confirm & Save</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[#070C1E] border border-[#1E2540] text-center text-xs text-slate-500 space-y-1">
                  <FileText className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-slate-400 font-semibold">No pending actions</p>
                  <p className="text-[11px]">Actions extracted from spoken instructions will appear here.</p>
                </div>
              )}

              {/* Related Memory Insights */}
              <div className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Memories Grounded
                </span>
                <p className="text-slate-300 font-medium">
                  {memories.length} memories & {reminders.length} reminders synced with Gemini context.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#070C1E] border border-[#1E2540] text-center">
            <span className="text-[11px] text-slate-400 block font-medium">Voice Audio Model</span>
            <span className="text-xs font-bold text-cyan-400 font-mono">gemini-3.5-flash-lite</span>
          </div>
        </div>
      </div>
    </div>
  );
}
