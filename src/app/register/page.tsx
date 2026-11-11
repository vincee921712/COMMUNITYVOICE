'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [zone, setZone] = useState('Zone 1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(fullName, email, 'resident', phone);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resident Registration</h2>
          <p className="text-xs text-slate-500">
            Instant Sign-Up • Barangay Hibao-an Sur, Mandurriao, Iloilo City
          </p>
        </div>

        {/* Benefits reminder */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
          <span className="font-bold flex items-center gap-1 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Instant Access Enabled
          </span>
          <p>Register once to file incident reports with photo attachments and track certificate requests in real time.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan S. Dela Cruz"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan.delacruz@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Number (For SMS Tracking) *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0917-123-4567"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Barangay Zone / Purok *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Zone 1">Zone 1 (Purok Narra / Main Road)</option>
                <option value="Zone 2">Zone 2 (Drainage / Central Pathway)</option>
                <option value="Zone 3">Zone 3 (Near Covered Basketball Court)</option>
                <option value="Zone 4">Zone 4 (Perimeter / Outer Subdivisions)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Create Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating Account...' : 'Complete Instant Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline">
              Sign In Here
            </Link>
          </p>
          <p className="text-[11px] text-slate-400">
            Complies with the Data Privacy Act of 2012 (RA 10173)
          </p>
        </div>
      </div>
    </div>
  );
}

