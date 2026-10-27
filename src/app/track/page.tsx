'use client';

import React, { useState } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { INITIAL_COMPLAINTS, INITIAL_CERTIFICATES } from '@/lib/mockData';

export default function TrackPage() {
  const [query, setQuery] = useState('CV-2026-001');
  const [result, setResult] = useState<any>(INITIAL_COMPLAINTS[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().toUpperCase();

    // Check complaints
    const foundComplaint = INITIAL_COMPLAINTS.find(c => c.tracking_number.toUpperCase() === cleanQuery);
    if (foundComplaint) {
      setResult({ type: 'complaint', ...foundComplaint });
      return;
    }

    // Check certificates
    const foundCert = INITIAL_CERTIFICATES.find(c => c.tracking_number.toUpperCase() === cleanQuery);
    if (foundCert) {
      setResult({ type: 'certificate', ...foundCert });
      return;
    }

    setResult(null);
  };

  const steps = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Track Barangay Submission</h1>
        <p className="text-slate-500 text-sm mt-1">
          Enter your tracking reference number to inspect real-time progress and assigned officials.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., CV-2026-001 or CERT-2026-001"
            className="w-full pl-11 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-sm"
        >
          Track Status
        </button>
      </form>

      {/* Results View */}
      {result ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider block">
                {result.tracking_number}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{result.title || result.purpose}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
              result.status === 'Resolved' || result.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800' :
              result.status === 'In Progress' || result.status === 'For Approval' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {result.status}
            </span>
          </div>

          {/* Progress Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress Timeline</h4>
            <div className="flex items-center justify-between relative py-4">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
              {steps.map((s, idx) => {
                const currentIdx = steps.indexOf(result.status);
                const isPassed = currentIdx >= idx;
                const isCurrent = currentIdx === idx;
                return (
                  <div key={s} className="relative z-10 flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      isCurrent ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100' :
                      isPassed ? 'bg-emerald-500 text-white border-emerald-500' :
                      'bg-white text-slate-300 border-slate-200'
                    }`}>
                      {isPassed && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 hidden sm:block ${
                      isCurrent ? 'font-bold text-blue-700' : isPassed ? 'text-slate-700 font-medium' : 'text-slate-400'
                    }`}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
              <span className="text-slate-400 font-medium">Assigned Barangay Official</span>
              <p className="font-semibold text-slate-800">{result.assigned_to || result.approved_by || 'Under Automated Routing'}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
              <span className="text-slate-400 font-medium">Location Landmark</span>
              <p className="font-semibold text-slate-800">{result.location_address || 'Barangay Hall, Hibao-an Sur'}</p>
            </div>
          </div>

          {result.ai_justification && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700">
                AI Assessment & Safeguards
              </span>
              <p>{result.ai_justification}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No record found for &quot;{query}&quot;</h3>
          <p className="text-xs text-slate-400 mt-1">Please ensure you entered the exact reference code from your SMS receipt.</p>
        </div>
      )}
    </div>
  );
}

