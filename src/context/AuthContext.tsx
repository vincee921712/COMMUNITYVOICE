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
  login: (email: string, password?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, role: UserRole, phone?: string, password?: string) => Promise<void>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check saved session in localStorage for smooth client state
    const saved = localStorage.getItem('cv_current_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('cv_current_user');
      }
    } else {
      // Default initial mock demo user
      setUser(DEMO_USERS['resident@hibaoan.gov.ph']);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password?: string, requestedRole: UserRole = 'resident') => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Try Supabase Auth if credentials match a real user in Supabase
      if (isSupabaseConfigured && supabase && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
          });
          if (!error && data.user) {
            // Attempt to fetch profile from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const loggedInProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email || normalizedEmail,
              full_name: profile?.full_name || data.user.user_metadata?.full_name || normalizedEmail.split('@')[0],
              role: (profile?.role as UserRole) || (data.user.user_metadata?.role as UserRole) || requestedRole,
              phone_number: profile?.phone_number || data.user.user_metadata?.phone_number,
              address: profile?.address || 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'
            };

            setUser(loggedInProfile);
            localStorage.setItem('cv_current_user', JSON.stringify(loggedInProfile));
            return;
          }
        } catch {
          // Fall back gracefully to local/demo resolution
        }
      }

      // 2. Demo & Local Registered Accounts Resolution
      // Check if registered user exists in local storage list of registered residents
      let registeredUsers: Record<string, UserProfile> = {};
      try {
        const stored = localStorage.getItem('cv_registered_users');
        if (stored) registeredUsers = JSON.parse(stored);
      } catch {
        // ignore
      }

      const matched = DEMO_USERS[normalizedEmail] || registeredUsers[normalizedEmail] || {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        full_name: normalizedEmail.split('@')[0].toUpperCase(),
        role: requestedRole,
        address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'
      };

      setUser(matched);
      localStorage.setItem('cv_current_user', JSON.stringify(matched));
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, role: UserRole, phone?: string, password?: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      let createdUserId = `usr-${Date.now()}`;

      // 1. Try Supabase Auth Sign Up if configured
      if (isSupabaseConfigured && supabase && password) {
        try {
          const { data } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: {
                full_name: fullName,
                role,
                phone_number: phone
              }
            }
          });
          if (data?.user?.id) {
            createdUserId = data.user.id;
          }
        } catch {
          // Graceful fallback to local session if Supabase Auth email confirmation or connection blocks
        }
      }

      const newUser: UserProfile = {
        id: createdUserId,
        email: normalizedEmail,
        full_name: fullName,
        role,
        phone_number: phone,
        address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'
      };

      // Save to registered users dictionary in localStorage so they can re-login anytime
      try {
        const stored = localStorage.getItem('cv_registered_users');
        const registeredUsers = stored ? JSON.parse(stored) : {};
        registeredUsers[normalizedEmail] = newUser;
        localStorage.setItem('cv_registered_users', JSON.stringify(registeredUsers));
      } catch {
        // ignore
      }

      setUser(newUser);
      localStorage.setItem('cv_current_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('cv_current_user');
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

