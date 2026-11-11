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
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  register: (fullName: string, email: string, role: UserRole, phone?: string) => Promise<void>;
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

  const login = async (email: string, requestedRole: UserRole = 'resident') => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        // Live Supabase Auth hook point
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'password123'
        });
        if (error) throw error;
        // Profile mapping will happen once Supabase is connected
      }

      // Demo/Local session resolution
      const matched = DEMO_USERS[email.toLowerCase()] || {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0].toUpperCase(),
        role: requestedRole,
        address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'
      };

      setUser(matched);
      localStorage.setItem('cv_current_user', JSON.stringify(matched));
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, role: UserRole, phone?: string) => {
    setLoading(true);
    try {
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: fullName,
        role,
        phone_number: phone,
        address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City'
      };
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
