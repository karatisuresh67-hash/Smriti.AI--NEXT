import React from 'react';
import { Brain, User, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { ActionCard } from './ActionCard';
import { formatTimeAgo } from '../../services/dateUtils';
import type { ChatMessageItem } from '../../types';

interface ChatMessageProps {
  message: ChatMessageItem;
  onSpeak?: ((text: string, id: string) => void) | null;
  onStopSpeak?: () => void;
  isSpeaking?: boolean;
  currentlySpeakingId?: string | null;
}

export function ChatMessage({ 
  message, 
  onSpeak, 
  onStopSpeak, 
  isSpeaking, 
  currentlySpeakingId 
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const isAssistant = message.role === 'assistant';
  const isCurrentlySpeakingThis = Boolean(isSpeaking && currentlySpeakingId === message.id);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-start space-x-3 mb-5 group ${isAssistant ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
          isAssistant
            ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
            : 'bg-navy-950 text-white'
        }`}
      >
        {isAssistant ? <Brain className="w-4 h-4 text-accent-blue" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isAssistant
              ? 'bg-white border border-slate-100 text-navy-900 rounded-tl-sm'
              : 'bg-navy-950 text-white rounded-tr-sm'
          }`}
        >
          {message.content}

          {/* Proposed action if attached */}
          {isAssistant && message.action && (
            <ActionCard action={message.action} />
          )}
        </div>

        {/* Message Actions / Timestamp */}
        <div className="flex items-center space-x-2 mt-1 px-1 text-[11px] text-slate-400">
          <span>{formatTimeAgo(message.timestamp)}</span>

          {isAssistant && (
            <>
              <span>•</span>
              <button
                onClick={handleCopy}
                className="hover:text-slate-600 transition-colors p-0.5"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>

              {onSpeak && (
                <button
                  onClick={() => {
                    if (isCurrentlySpeakingThis && onStopSpeak) {
                      onStopSpeak();
                    } else if (onSpeak) {
                      onSpeak(message.content, message.id);
                    }
                  }}
                  className={`hover:text-violet-600 transition-colors p-0.5 ${
                    isCurrentlySpeakingThis ? 'text-violet-600 animate-pulse font-bold' : ''
                  }`}
                  title={isCurrentlySpeakingThis ? 'Stop speaking' : 'Read aloud with Text-to-Speech'}
                  aria-label={isCurrentlySpeakingThis ? 'Stop speaking' : 'Read aloud with Text-to-Speech'}
                >
                  {isCurrentlySpeakingThis ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
