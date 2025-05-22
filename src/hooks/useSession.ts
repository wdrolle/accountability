// src/hooks/useSession.ts

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface ExtendedSession extends Session {
  user: Session['user'] & {
    role?: string;
  };
}

export function useSession() {
  const [session, setSession] = useState<ExtendedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getSessionWithRole(currentSession: Session | null) {
      if (!currentSession?.user) {
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('user')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (error) throw error;

        setSession({
          ...currentSession,
          user: {
            ...currentSession.user,
            role: userData?.role
          }
        });
      } catch (error) {
        console.error('Error fetching user role:', error);
        setSession(currentSession);
      } finally {
        setLoading(false);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      getSessionWithRole(session);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      getSessionWithRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
} 