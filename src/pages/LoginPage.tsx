import React from 'react';
import { Brain, Sparkles, ShieldCheck, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';



export function LoginPage() {
  const { signInWithGoogle, loading, isConfigured, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-accent-blue flex items-center justify-center shadow-glow">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-3xl font-extrabold text-navy-900 tracking-tight">
          Smriti AI
        </h1>
        <p className="mt-1 text-center text-sm font-medium text-slate-500">
          Remember what matters. Let AI handle the rest.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-soft-lg rounded-3xl border border-slate-100">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-navy-900">
              Welcome to Smriti AI
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with your Google account to access your personal memories and schedule
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-xs font-bold text-rose-700 underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Configuration Notice if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Supabase Configuration Required</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                To enable live Google OAuth and multi-device cloud synchronization, add your project credentials to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code>:
              </p>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80 font-mono text-[11px] text-slate-700">
                <div>VITE_SUPABASE_URL=https://xyz.supabase.co</div>
                <div>VITE_SUPABASE_ANON_KEY=eyJ...</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Enable Google provider under Supabase Dashboard &gt; Authentication &gt; Providers.
              </p>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || isSigningIn || !isConfigured}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 text-slate-700 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            {/* Authentic Google "G" SVG */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isSigningIn ? 'Redirecting to Google...' : 'Continue with Google'}
            </span>
          </button>

          {/* Guest / Demo Access Option */}
          

          {/* Privacy & Security Footnote */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Private & isolated with Row Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
