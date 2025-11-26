import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'parent' | 'student';
  grade_level: number | null;
  subscription_status: string;
  invite_code: string;
  invite_code_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'parent' | 'student') => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (role: 'parent' | 'student') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, role: 'parent' | 'student'): Promise<{ needsEmailConfirmation: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    if (error) throw error;

    // Check if email confirmation is required
    // If user is created but session is null, email confirmation is needed
    const needsEmailConfirmation = !!data.user && !data.session;

    return { needsEmailConfirmation };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide clearer error message for invalid credentials
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. If you don\'t have an account, please register first.');
      }
      throw error;
    }

    // Check if user has a profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        // No profile exists - sign them out and throw error
        await supabase.auth.signOut();
        throw new Error('Your account setup is incomplete. Please register again or contact support.');
      }
    }
  }

  async function signInWithGoogle(role?: 'parent' | 'student') {
    // If role is provided, this is a registration flow
    // We need to create a pending registration entry in the database
    // This allows the before-user-created hook to verify this is a legitimate registration
    if (role) {
      // Store the role in localStorage as backup for profile creation
      localStorage.setItem('pendingGoogleRole', role);

      // Generate a session token for tracking
      const sessionToken = crypto.randomUUID();
      localStorage.setItem('pendingGoogleSessionToken', sessionToken);

      // Insert pending registration into database
      // This signals to the auth hook that this is a legitimate registration
      const { error: insertError } = await supabase
        .from('pending_oauth_registrations')
        .insert({
          role: role,
          session_token: sessionToken,
        });

      if (insertError) {
        console.error('Error creating pending registration:', insertError);
        throw new Error('Failed to initiate registration. Please try again.');
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
