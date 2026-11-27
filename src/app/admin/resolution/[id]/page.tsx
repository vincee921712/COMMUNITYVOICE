'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Printer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { INITIAL_COMPLAINTS } from '@/lib/mockData';
import { Complaint, IncidentResolutionReport } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';

export default function ResolutionReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const complaintId = String(params.id);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [summary, setSummary] = useState('');
  const [actions, setActions] = useState('');
  const [investigation, setInvestigation] = useState('');
  const [resolution, setResolution] = useState('');
  const [remarks, setRemarks] = useState('');
  const [resolvedAt, setResolvedAt] = useState(new Date().toISOString().slice(0, 16));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || !['staff', 'official', 'admin'].includes(user.role))) {
      router.replace('/login');
      return;
    }
    const locals: Complaint[] = JSON.parse(localStorage.getItem('cv_custom_complaints') || '[]');
    const found = [...locals, ...INITIAL_COMPLAINTS].find((item) => item.id === complaintId);
    setComplaint(found || null);
  }, [complaintId, loading, router, user]);

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !user) return;
    if (!summary.trim() || !actions.trim() || !investigation.trim() || !resolution.trim()) {
      setError('Summary, actions taken, investigation, and resolution details are required.');
      return;
    }
    const report: IncidentResolutionReport = {
      incident_summary: summary.trim(),
      actions_taken: actions.trim(),
      investigation_conducted: investigation.trim(),
      resolution_details: resolution.trim(),
      resolved_at: new Date(resolvedAt).toISOString(),
      assigned_official: user.full_name,
      remarks: remarks.trim() || undefined,
    };
    const resolvedComplaint = {
      ...complaint,
      status: 'Resolved' as const,
      resolution_notes: resolution.trim(),
      resolution_report: report,
      resolved_at: report.resolved_at,
      status_history: [
        ...(complaint.status_history || []),
        { status: 'Resolved', changed_at: report.resolved_at, changed_by: user.full_name }
      ],
      updated_at: new Date().toISOString(),
    };

    try {
      const locals: Complaint[] = JSON.parse(localStorage.getItem('cv_custom_complaints') || '[]');
      const index = locals.findIndex((item) => item.id === complaint.id);
      if (index >= 0) {
        locals[index] = resolvedComplaint;
        localStorage.setItem('cv_custom_complaints', JSON.stringify(locals));
      } else {
        localStorage.setItem('cv_custom_complaints', JSON.stringify([...locals, resolvedComplaint]));
      }
      if (isSupabaseConfigured && supabase) {
        await supabase.from('complaints').update({
          status: 'Resolved',
          resolution_notes: resolution.trim(),
          resolution_report: report,
          resolved_at: report.resolved_at,
          status_history: resolvedComplaint.status_history,
          updated_at: resolvedComplaint.updated_at,
        }).eq('id', complaint.id);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the resolution report.');
      return;
    }

    setComplaint(resolvedComplaint);
    setError('');
  };

  if (loading || !user) return null;
  if (!complaint) return <div className="max-w-xl mx-auto p-10 text-sm text-slate-500">Complaint not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <ArrowLeft className="w-4 h-4" /> Back to Staff Dashboard
      </button>

      {complaint.resolution_report ? (
        <article className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-5 print:border-0">
          <header className="text-center border-b border-slate-200 pb-5">
            <p className="text-xs font-bold uppercase text-blue-700">CommunityVoice System</p>
            <h1 className="text-xl font-extrabold mt-1">Official Incident Resolution Report</h1>
            <p className="text-xs text-slate-500">Barangay Hibao-an Sur, Mandurriao, Iloilo City</p>
          </header>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div><dt className="text-slate-400">Reference Number</dt><dd className="font-mono font-bold text-blue-700">{complaint.tracking_number}</dd></div>
            <div><dt className="text-slate-400">Category</dt><dd className="font-bold">{complaint.category_id}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Complaint Title</dt><dd className="font-bold">{complaint.title}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Incident Description</dt><dd>{complaint.description}</dd></div>
            <div className="sm:col-span-2"><dt className="text-slate-400">Incident Location</dt><dd>{complaint.location_address}</dd></div>
          </dl>
          <div className="space-y-3 text-sm border-t border-slate-100 pt-5">
            <p><strong>Actions Taken:</strong> {complaint.resolution_report.actions_taken}</p>
            <p><strong>Investigation / Response:</strong> {complaint.resolution_report.investigation_conducted}</p>
            <p><strong>Resolution Details:</strong> {complaint.resolution_report.resolution_details}</p>
            <p><strong>Assigned Official:</strong> {complaint.resolution_report.assigned_official}</p>
            <p><strong>Date Resolved:</strong> {new Date(complaint.resolution_report.resolved_at).toLocaleString()}</p>
            {complaint.resolution_report.remarks && <p><strong>Remarks:</strong> {complaint.resolution_report.remarks}</p>}
          </div>
          <button onClick={() => window.print()} className="print:hidden inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </article>
      ) : (
        <form onSubmit={submitReport} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs font-mono font-bold text-blue-700">{complaint.tracking_number}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">Resolve Complaint with Final Report</h1>
            <p className="text-xs text-slate-500 mt-1">{complaint.title}</p>
          </div>
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">{error}</div>}
          {[
            ['Incident summary', summary, setSummary, '3'],
            ['Actions taken', actions, setActions, '3'],
            ['Investigation or response conducted', investigation, setInvestigation, '3'],
            ['Resolution details', resolution, setResolution, '3'],
            ['Additional remarks or recommendations', remarks, setRemarks, '2'],
          ].map(([label, value, setter, rows]) => (
            <label key={String(label)} className="block text-xs font-semibold text-slate-700">
              {String(label)}
              <textarea
                required={String(label) !== 'Additional remarks or recommendations'}
                value={String(value)}
                onChange={(e) => (setter as (value: string) => void)(e.target.value)}
                rows={Number(rows)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal text-slate-900"
              />
            </label>
          ))}
          <label className="block text-xs font-semibold text-slate-700">
            Date resolved
            <input type="datetime-local" value={resolvedAt} onChange={(e) => setResolvedAt(e.target.value)} required className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2" />
          </label>
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Assigned official: <strong>{user.full_name}</strong></p>
            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> Submit & Resolve
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
