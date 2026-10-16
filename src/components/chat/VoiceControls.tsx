import React from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

interface VoiceControlsProps {
  isSupported: boolean;
  isListening: boolean;
  error?: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
}

export function VoiceControls({
  isSupported,
  isListening,
  onStartListening,
  onStopListening,
}: VoiceControlsProps) {
  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          type="button"
          disabled
          aria-label="Speech recognition not supported in this browser"
          className="p-2 text-slate-300 cursor-not-allowed rounded-xl"
          title="Speech recognition not supported in this browser"
        >
          <MicOff className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={isListening ? onStopListening : onStartListening}
        aria-label={isListening ? "Stop listening" : "Start voice input"}
        className={`p-2.5 rounded-xl transition-all relative ${
          isListening
            ? 'bg-rose-500 text-white ring-4 ring-rose-200 animate-pulse'
            : 'text-slate-500 hover:text-violet-600 hover:bg-slate-100'
        }`}
        title={isListening ? 'Listening... click to stop' : 'Click to speak'}
      >
        <Mic className="w-5 h-5" />
      </button>
    </div>
  );
}

interface VoiceStatusBannerProps {
  isListening: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

export function VoiceStatusBanner({ isListening, error, onDismissError }: VoiceStatusBannerProps) {
  if (error) {
    return (
      <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
        {onDismissError && (
          <button
            onClick={onDismissError}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-2"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  if (isListening) {
    return (
      <div className="mx-4 mb-2 p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 text-xs flex items-center space-x-2 animate-in fade-in">
        <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-ping" />
        <span className="font-medium">
          Listening to your voice... Speak clearly, and your words will appear in the input box.
        </span>
      </div>
    );
  }

  return null;
}
