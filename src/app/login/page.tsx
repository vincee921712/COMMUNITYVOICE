'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      const authenticatedUser = await login(email, password);
      const authenticatedRole = authenticatedUser.role;
      if (authenticatedRole === 'staff' || authenticatedRole === 'official' || authenticatedRole === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/resident/dashboard');
      }
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : 'Could not sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('local-demo');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-lg shadow-blue-500/25 border border-blue-500/30">
            <Image
              src="/logo.png"
              alt="CommunityVoice Logo"
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to CommunityVoice</h2>
          <p className="text-xs text-slate-500">
            Barangay Hibao-an Sur, Mandurriao, Iloilo City
          </p>
        </div>

        {/* Demo accounts are only available for local development without Supabase. */}
        {process.env.NODE_ENV === 'development' && !isSupabaseConfigured && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Demo Fast-Login (1-Click)
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setPreset('resident@hibaoan.gov.ph')}
              className={`p-2 rounded-xl border text-center transition-all ${
                email === 'resident@hibaoan.gov.ph'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Resident
            </button>
            <button
              type="button"
              onClick={() => setPreset('secretary@hibaoan.gov.ph')}
              className={`p-2 rounded-xl border text-center transition-all ${
                email === 'secretary@hibaoan.gov.ph'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Secretary
            </button>
            <button
              type="button"
              onClick={() => setPreset('captain@hibaoan.gov.ph')}
              className={`p-2 rounded-xl border text-center transition-all ${
                email === 'captain@hibaoan.gov.ph'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Captain
            </button>
          </div>
        </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hibaoan.gov.ph or resident email"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        {errorMessage && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMessage}
          </p>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Register as Resident
            </Link>
          </p>
          <p className="text-[11px] text-slate-400">
            Protected under the Data Privacy Act of 2012 (RA 10173)
          </p>
        </div>
      </div>
    </div>
  );
}

