'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, CheckCircle2, Clock, PlusCircle, Search, Bell, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_COMPLAINTS, INITIAL_CERTIFICATES } from '@/lib/mockData';
import { Complaint, CertificateRequest } from '@/lib/types';

export default function ResidentDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    try {
      const customComplaints: Complaint[] = JSON.parse(localStorage.getItem('cv_custom_complaints') || '[]');
      const customRequests: CertificateRequest[] = JSON.parse(localStorage.getItem('cv_custom_certificates') || '[]');
      const allComplaints = [...customComplaints, ...INITIAL_COMPLAINTS];
      const ownComplaints = allComplaints.filter((c) =>
        c.resident_name?.toLowerCase() === user.full_name.toLowerCase()
        || user.email === 'resident@hibaoan.gov.ph' && c.tracking_number === 'CV-2026-001'
        || JSON.parse(localStorage.getItem('cv_my_tracking_numbers') || '[]').includes(c.tracking_number)
      );
      const ownRequests = customRequests.length
        ? customRequests
        : INITIAL_CERTIFICATES.filter((c) => user.email === 'resident@hibaoan.gov.ph');
      setComplaints(ownComplaints);
      setRequests(ownRequests);
    } catch {
      setComplaints(INITIAL_COMPLAINTS.slice(0, 1));
      setRequests(INITIAL_CERTIFICATES.slice(0, 1));
    }
  }, [user]);

  const counts = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length,
    resolved: complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length,
  }), [complaints]);

  if (loading || !user) return null;
  if (user.role !== 'resident') {
    router.replace('/admin/dashboard');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Resident Overview</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Welcome, {user.full_name}</h1>
        </div>
        <Link href="/report" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm">
          <PlusCircle className="w-4 h-4" /> Submit Complaint
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between"><span className="text-xs text-slate-500">My Complaints</span><AlertCircle className="w-4 h-4 text-blue-600" /></div>
          <p className="text-3xl font-extrabold mt-2">{counts.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Pending</span><Clock className="w-4 h-4 text-amber-600" /></div>
          <p className="text-3xl font-extrabold mt-2">{counts.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between"><span className="text-xs text-slate-500">Resolved</span><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
          <p className="text-3xl font-extrabold mt-2">{counts.resolved}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Recent Complaints</h2>
            <Link href="/track" className="text-xs font-semibold text-blue-700">View all</Link>
          </div>
          <div className="space-y-3">
            {complaints.slice(0, 5).map((c) => (
              <Link key={c.id} href={`/track?id=${c.tracking_number}`} className="block p-3 rounded-xl border border-slate-100 hover:border-blue-200">
                <div className="flex justify-between gap-3"><span className="font-semibold text-sm">{c.title}</span><span className="text-[10px] font-bold">{c.status}</span></div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{c.tracking_number}</p>
              </Link>
            ))}
            {!complaints.length && <p className="text-sm text-slate-400 py-6 text-center">No complaints submitted yet.</p>}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Recent Requests</h2>
            <Link href="/certificates" className="text-xs font-semibold text-blue-700">View all</Link>
          </div>
          <div className="space-y-3">
            {requests.slice(0, 5).map((r) => (
              <Link key={r.id} href={`/track?id=${r.tracking_number}`} className="block p-3 rounded-xl border border-slate-100 hover:border-blue-200">
                <div className="flex justify-between gap-3"><span className="font-semibold text-sm">{r.purpose}</span><span className="text-[10px] font-bold">{r.status}</span></div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{r.tracking_number}</p>
              </Link>
            ))}
            {!requests.length && <p className="text-sm text-slate-400 py-6 text-center">No document requests submitted yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
