import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('parent' | 'student')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }

    // If user exists but no profile, sign them out and redirect
    // This handles edge cases where auth exists but profile creation failed
    if (!loading && user && !profile) {
      supabase.auth.signOut().then(() => {
        navigate('/');
      });
    }

    // If roles are specified, check if user has allowed role
    if (!loading && user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
      // Redirect to appropriate dashboard based on role
      if (profile.role === 'parent') {
        navigate('/parent/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [user, profile, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <div className="text-white/70 text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Must have both user AND profile to access protected routes
  if (!user || !profile) {
    return null;
  }

  // If roles are specified and user doesn't have the right role, return null
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
