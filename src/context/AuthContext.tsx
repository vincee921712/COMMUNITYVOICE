'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone_number?: string;
  address?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, phone?: string, password?: string, address?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<string, UserProfile> = {
  'resident@hibaoan.gov.ph': {
    id: 'usr-res-01',
    email: 'resident@hibaoan.gov.ph',
    full_name: 'Maria Santos',
    role: 'resident',
    phone_number: '0917-555-0192',
    address: 'Zone 3, Hibao-an Sur, Iloilo City'
  },
  'secretary@hibaoan.gov.ph': {
    id: 'usr-stf-01',
    email: 'secretary@hibaoan.gov.ph',
    full_name: 'Barangay Secretary Elena Ramos',
    role: 'staff',
    phone_number: '0920-111-2233',
    address: 'Barangay Hall, Hibao-an Sur'
  },
  'staff@hibaoan.gov.ph': {
    id: 'usr-stf-01',
    email: 'staff@hibaoan.gov.ph',
    full_name: 'Barangay Secretary Elena Ramos',
    role: 'staff',
    phone_number: '0920-111-2233',
    address: 'Barangay Hall, Hibao-an Sur'
  },
  'captain@hibaoan.gov.ph': {
    id: 'usr-off-01',
    email: 'captain@hibaoan.gov.ph',
    full_name: 'Hon. Punong Barangay Roberto Perez',
    role: 'official',
    phone_number: '0918-333-4455',
    address: 'Barangay Hall, Hibao-an Sur'
  }
};

const USER_ROLES: UserRole[] = ['resident', 'staff', 'official', 'admin'];

async function loadProfile(userId: string, email: string): Promise<UserProfile> {
  if (!supabase) throw new Error('Authentication service is not configured.');
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone_number, address')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error('Could not load your account profile.');
  if (!profile || !USER_ROLES.includes(profile.role as UserRole)) {
    throw new Error('Your account profile is missing or has an invalid role. Contact the barangay administrator.');
  }

  return {
    id: profile.id,
    email: profile.email || email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    phone_number: profile.phone_number || undefined,
    address: profile.address || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        const savedEmail = localStorage.getItem('cv_demo_user_email')?.toLowerCase();
        const demoUser = savedEmail ? DEMO_USERS[savedEmail] : null;
        if (demoUser) {
          setUser(demoUser);
          document.cookie = `cv_user_role=${demoUser.role}; path=/; SameSite=Lax`;
        } else {
          setUser(null);
          document.cookie = 'cv_user_role=; path=/; max-age=0';
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const applyProfile = async (id: string, email: string) => {
      const profile = await loadProfile(id, email);
      if (active) setUser(profile);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        if (active) setUser(null);
        return;
      }
      void Promise.resolve()
        .then(() => applyProfile(session.user.id, session.user.email || ''))
        .catch((error: unknown) => {
          console.error('Could not load authenticated profile:', error);
          if (active) setUser(null);
        });
    });

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (data.user) {
          await applyProfile(data.user.id, data.user.email || '');
        } else if (active) {
          setUser(null);
        }
      } catch (error) {
        console.error('Could not restore authenticated session:', error);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!password) throw new Error('Enter your password.');

      if (!supabase) {
        if (process.env.NODE_ENV !== 'development') {
          throw new Error('Authentication is unavailable. Please contact the system administrator.');
        }
        const demoUser = DEMO_USERS[normalizedEmail];
        if (!demoUser || password !== 'local-demo') {
          throw new Error('Use a preset demo account and its local demo password.');
        }
        setUser(demoUser);
        localStorage.setItem('cv_demo_user_email', normalizedEmail);
        document.cookie = `cv_user_role=${demoUser.role}; path=/; SameSite=Lax`;
        return demoUser;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error || !data.user) throw new Error('Invalid email or password.');

      try {
        const profile = await loadProfile(data.user.id, data.user.email || normalizedEmail);
        setUser(profile);
        return profile;
      } catch (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, phone?: string, password?: string, address?: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (!supabase || !isSupabaseConfigured) {
        throw new Error('Registration requires the configured account service. Please try again later.');
      }
      const trimmedName = fullName.trim();
      const trimmedPhone = phone?.trim();
      if (!trimmedName) throw new Error('Enter your full name.');
      if (!password || password.length < 6) throw new Error('Create a password with at least 6 characters.');
      if (!/^09\d{9}$/.test(trimmedPhone?.replace(/\D/g, '') || '')) {
        throw new Error('Enter a valid 11-digit Philippine mobile number starting with 09.');
      }
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            phone_number: trimmedPhone,
            address,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('The account service did not return a user.');
      if (!data.session) {
        setUser(null);
        return false;
      }

      const profile = await loadProfile(data.user.id, data.user.email || normalizedEmail);
      setUser(profile);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('cv_demo_user_email');
      document.cookie = 'cv_user_role=; path=/; max-age=0';
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

