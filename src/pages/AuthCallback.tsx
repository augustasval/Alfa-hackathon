import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash (Supabase handles this automatically)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          localStorage.removeItem('pendingGoogleRole');
          navigate('/?error=auth_failed');
          return;
        }

        if (session) {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            // User already has a profile (existing user)
            // Clean up any pending registration data (in case they tried to register again)
            localStorage.removeItem('pendingGoogleRole');
            localStorage.removeItem('pendingGoogleSessionToken');

            // If they tried to register but already have an account, show them a message
            const pendingRole = localStorage.getItem('pendingGoogleRole');
            if (pendingRole) {
              // Redirect with a message that they already have an account
              if (profile.role === 'parent') {
                navigate('/parent/dashboard?info=already_registered');
              } else {
                navigate('/student/dashboard?info=already_registered');
              }
            } else {
              // Normal sign-in flow
              if (profile.role === 'parent') {
                navigate('/parent/dashboard');
              } else {
                navigate('/student/dashboard');
              }
            }
          } else {
            // New OAuth user - check if we have a pending role from registration
            const pendingRole = localStorage.getItem('pendingGoogleRole') as 'parent' | 'student' | null;

            if (pendingRole) {
              // Create profile for new Google user
              const fullName = session.user.user_metadata?.full_name || session.user.email!.split('@')[0];
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: fullName,
                  name: session.user.user_metadata?.full_name || null,
                  role: pendingRole,
                });

              // Clean up pending registration entry
              localStorage.removeItem('pendingGoogleSessionToken');

              localStorage.removeItem('pendingGoogleRole');

              if (profileError) {
                console.error('Error creating profile:', profileError);
                await supabase.auth.signOut();
                navigate('/?error=auth_failed');
                return;
              }

              // Redirect to appropriate dashboard
              if (pendingRole === 'parent') {
                navigate('/parent/dashboard');
              } else {
                navigate('/student/dashboard');
              }
            } else {
              // No pending role - this means they tried to sign in without registering first
              await supabase.auth.signOut();
              navigate('/?error=no_account');
            }
          }
        } else {
          // No session, redirect to login
          localStorage.removeItem('pendingGoogleRole');
          navigate('/');
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        // Clean up all pending registration data
        localStorage.removeItem('pendingGoogleSessionToken');
        localStorage.removeItem('pendingGoogleRole');
        navigate('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
        <div className="text-white/70 text-lg font-medium">Completing sign in...</div>
      </div>
    </div>
  );
}
