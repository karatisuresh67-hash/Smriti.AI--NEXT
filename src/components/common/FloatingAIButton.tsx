import React, { useState } from 'react';
import { Sparkles, X, Send, Brain, Bell, Check, Loader2, Mic } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { VoiceControls, VoiceStatusBanner } from '../chat/VoiceControls';
import { sendChatMessage } from '../../services/apiService';
import { useApp } from '../../context/AppContext';
import { ActionCard } from '../chat/ActionCard';
import type { ProposedAction } from '../../types';

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposedAction, setProposedAction] = useState<ProposedAction | null>(null);
  const [replyText, setReplyText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { memories, reminders, setCurrentTab, addToast } = useApp();

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

  const handleQuickSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setProposedAction(null);
    setReplyText(null);

    try {
      const response = await sendChatMessage({
        message: query,
        memories,
        reminders,
        currentDateTime: new Date().toISOString(),
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      });

      setReplyText(response.reply);
      if (response.action) {
        setProposedAction(response.action);
      } else {
        setError('No memory or reminder detected to save. Try saying: "Remind me to call John tomorrow at 3 PM" or "Remember that Maya loves lilies".');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to parse request with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionSaved = () => {
    setProposedAction(null);
    setReplyText(null);
    setInput('');
    clearTranscript();
    setIsOpen(false);
    addToast('Created successfully!', 'success');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-5 z-40 p-3.5 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        aria-label="AI Quick Capture"
        title="AI Quick Capture (Voice or Text)"
      >
        <Sparkles className="w-6 h-6 text-accent-blue animate-pulse" />
      </button>

      {/* Quick Action Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-soft-lg border border-slate-100 overflow-hidden z-10 my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-navy-900">AI Quick Capture</h3>
                  <p className="text-[11px] text-slate-500">Speak or write naturally to save memories or reminders</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setCurrentTab('voice');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-violet-700 bg-violet-100/80 hover:bg-violet-200/80 rounded-lg flex items-center space-x-1 transition-colors"
                  title="Open Full Voice Assistant"
                >
                  <Mic className="w-3 h-3" />
                  <span>Voice Mode</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <VoiceStatusBanner
                isListening={isListening}
                error={speechError}
                onDismissError={clearTranscript}
              />

              <form onSubmit={handleQuickSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 'Remember that Suresh prefers window seats on flights' or 'Remind me to submit project review on Friday at 4 PM'"
                    className="w-full p-3.5 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <VoiceControls
                    isSupported={isSpeechRecSupported}
                    isListening={isListening}
                    error={speechError}
                    onStartListening={startListening}
                    onStopListening={stopListening}
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Parse & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Proposed Action Card Preview */}
              {proposedAction && (
                <div className="pt-2 animate-in fade-in">
                  {replyText && (
                    <p className="text-xs text-slate-600 mb-2 font-medium">{replyText}</p>
                  )}
                  <ActionCard action={proposedAction} onActionExecuted={handleActionSaved} />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
