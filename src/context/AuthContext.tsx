
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  updated_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (displayName: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Google profile information
  const getGoogleProfile = useCallback((currentUser: User) => {
    const metadata = currentUser.user_metadata ?? {};

    const name =
      metadata.full_name ??
      metadata.name ??
      '';

    const avatar =
      metadata.avatar_url ??
      metadata.picture ??
      null;

    return {
      name: typeof name === 'string' ? name.trim() : '',
      avatar: typeof avatar === 'string' ? avatar : null,
    };
  }, []);

  // Initialize and monitor Supabase authentication
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let active = true;

    const params = new URLSearchParams(window.location.search);

    if (params.get('error_description')) {
      setError(params.get('error_description'));
    }

    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load the saved profile, or initialize it from Google
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured || !user) {
      setProfile(null);
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function loadProfile() {
      const google = getGoogleProfile(user!);
const name = google.name;
const avatar = google.avatar;

      const { data, error: fetchError } = await client
        .from('user_profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', user!.id)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setProfile({
          id: user!.id,
          display_name: name || 'User',
          avatar_url: avatar,
          updated_at: new Date().toISOString(),
        });
        return;
      }

     const savedName = name || data?.display_name?.trim() || 'User';
const savedAvatar = avatar || data?.avatar_url || null;

      const currentProfile: UserProfile = {
        id: user!.id,
        display_name: savedName,
        avatar_url: savedAvatar,
        updated_at: data?.updated_at || new Date().toISOString(),
      };

      setProfile(currentProfile);

      // Create the first profile or fill missing Google details.
      // Never overwrite a name the user has already saved.
      if (
  !data ||
  (Boolean(name) && data.display_name !== name) ||
  (Boolean(avatar) && data.avatar_url !== avatar)
) {
        const { error: saveError } = await client
          .from('user_profiles')
          .upsert({
            ...currentProfile,
            updated_at: new Date().toISOString(),
          });

        if (!cancelled && saveError) {
          setError(saveError.message);
        }
      }
    }

    loadProfile().catch((err: unknown) => {
      if (!cancelled) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load your profile.'
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, getGoogleProfile]);

  // Google sign-in
  const signInWithGoogle = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setError('Supabase is not configured. Check your environment variables.');
      return;
    }

    setError(null);

    try {
      const { error: signInError } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

      if (signInError) throw signInError;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to start Google sign-in.'
      );
    }
  }, []);

  // Save a user-edited display name
  const saveProfile = useCallback(
    async (displayName: string) => {
      if (!supabase || !isSupabaseConfigured || !user) {
        throw new Error('Please sign in before saving your profile.');
      }

      const name = displayName.trim();

      if (!name) {
        throw new Error('Your name cannot be empty.');
      }

      const client = supabase;
      const metadata = user.user_metadata ?? {};

      const googleAvatar =
        metadata.avatar_url ?? metadata.picture ?? null;

      const avatar =
        profile?.avatar_url ||
        (typeof googleAvatar === 'string' ? googleAvatar : null);

      const updatedAt = new Date().toISOString();

      const { data, error: saveError } = await client
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: name,
          avatar_url: avatar,
          updated_at: updatedAt,
        })
        .select('id, display_name, avatar_url, updated_at')
        .single();

      if (saveError) {
        setError(saveError.message);
        throw saveError;
      }

      setProfile({
        id: data.id,
        display_name: data.display_name || name,
        avatar_url: data.avatar_url,
        updated_at: data.updated_at,
      });

      setError(null);
    },
    [user, profile?.avatar_url]
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }

    setError(null);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to sign out.'
      );
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    error,
    signInWithGoogle,
    signOut,
    saveProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
