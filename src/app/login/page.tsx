'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn, Mail, Lock, UserCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('resident');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password, role);
      if (role === 'staff' || role === 'official' || role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (presetEmail: string, presetRole: UserRole) => {
    setEmail(presetEmail);
    setPassword('••••••••');
    setRole(presetRole);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to CommunityVoice</h2>
          <p className="text-xs text-slate-500">
            Official Portal • Barangay Hibao-an Sur, Mandurriao, Iloilo City
          </p>
        </div>

        {/* Demo Fast-Login Presets */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Demo Fast-Login (1-Click)
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setPreset('resident@hibaoan.gov.ph', 'resident')}
              className={`p-2 rounded-xl border text-center transition-all ${
                role === 'resident' && email === 'resident@hibaoan.gov.ph'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Resident
            </button>
            <button
              type="button"
              onClick={() => setPreset('secretary@hibaoan.gov.ph', 'staff')}
              className={`p-2 rounded-xl border text-center transition-all ${
                role === 'staff' && (email === 'secretary@hibaoan.gov.ph' || email === 'staff@hibaoan.gov.ph')
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Secretary
            </button>
            <button
              type="button"
              onClick={() => setPreset('captain@hibaoan.gov.ph', 'official')}
              className={`p-2 rounded-xl border text-center transition-all ${
                role === 'official' && email === 'captain@hibaoan.gov.ph'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              Captain
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
            >
              <option value="resident">Resident / Citizen</option>
              <option value="staff">Barangay Staff (Secretary / Clerk)</option>
              <option value="official">Barangay Official (Captain / Kagawad)</option>
            </select>
          </div>

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
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

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

