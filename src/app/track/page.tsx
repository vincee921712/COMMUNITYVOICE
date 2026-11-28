'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Clock, CheckCircle2, AlertCircle, Shield, ArrowRight, Lock, FileText, AlertTriangle } from 'lucide-react';
import { INITIAL_COMPLAINTS, INITIAL_CERTIFICATES } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Complaint, CertificateRequest, ConversationMessage } from '@/lib/types';

type TrackRecord = (Complaint & { type: 'complaint' }) | (CertificateRequest & { type: 'certificate' });

interface TrackingOwnershipRecord {
  tracking_number?: string;
  resident_name?: string;
  resident_contact?: string;
  contact_number?: string;
}

export default function TrackPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('CV-2026-001');
  const [result, setResult] = useState<TrackRecord | null>({ type: 'complaint', ...INITIAL_COMPLAINTS[0] });
  const [isSearching, setIsSearching] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [myTrackings, setMyTrackings] = useState<string[]>([]);
  const [allUserRecords, setAllUserRecords] = useState<{
    tracking_number: string;
    title: string;
    type: 'complaint' | 'certificate';
    status: string;
  }[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState('');

  const isStaffOrOfficial = Boolean(
    user && (user.role === 'staff' || user.role === 'official' || user.role === 'admin')
  );

  // Load tracking numbers submitted on this browser/session
  useEffect(() => {
    let localTrackings: string[] = [];
    try {
      const stored = localStorage.getItem('cv_my_tracking_numbers');
      if (stored) localTrackings = JSON.parse(stored);
    } catch {}
    setMyTrackings(localTrackings);

    // Collect all local user transactions
    const items: { tracking_number: string; title: string; type: 'complaint' | 'certificate'; status: string; }[] = [];

    // Local complaints
    try {
      const storedC = localStorage.getItem('cv_custom_complaints');
      if (storedC) {
        const parsed = JSON.parse(storedC);
        parsed.forEach((c: Complaint) => {
          items.push({
            tracking_number: c.tracking_number,
            title: c.title,
            type: 'complaint',
            status: c.status
          });
        });
      }
    } catch {}

    // Local certificates
    try {
      const storedCert = localStorage.getItem('cv_custom_certificates');
      if (storedCert) {
        const parsed = JSON.parse(storedCert);
        parsed.forEach((crt: CertificateRequest) => {
          items.push({
            tracking_number: crt.tracking_number,
            title: crt.purpose,
            type: 'certificate',
            status: crt.status
          });
        });
      }
    } catch {}

    // Initial mock data belonging to demo resident Maria Santos
    if (user?.email === 'resident@hibaoan.gov.ph' || !user || user.role === 'resident') {
      items.push({
        tracking_number: 'CV-2026-001',
        title: 'Dangling Low Electrical Wire over Pathway',
        type: 'complaint',
        status: 'In Progress'
      });
      items.push({
        tracking_number: 'CERT-2026-001',
        title: 'Certificate of Indigency (Medical WVMC)',
        type: 'certificate',
        status: 'Ready for Pickup'
      });
    }

    // Deduplicate by tracking_number
    const seen = new Set<string>();
    const unique = items.filter(it => {
      if (seen.has(it.tracking_number)) return false;
      seen.add(it.tracking_number);
      return true;
    });

    setAllUserRecords(unique);

    // Auto-select first user transaction if available
    if (unique.length > 0) {
      setQuery(unique[0].tracking_number);
    }
  }, [user]);

  // Check if a record belongs to the current logged-in resident
  const verifyRecordOwnership = (record: TrackingOwnershipRecord): boolean => {
    if (isStaffOrOfficial) return true; // Officials have oversight access
    if (!record) return false;

    const tracking = record.tracking_number?.toUpperCase();
    if (!tracking) return false;

    // 1. In browser-tracked submissions
    if (myTrackings.map(t => t.toUpperCase()).includes(tracking)) return true;

    // 2. Name matches
    const userName = user?.full_name?.toLowerCase().trim();
    const recordName = (record.resident_name || '').toLowerCase().trim();
    if (userName && recordName && userName === recordName) return true;

    // 3. Contact phone matches
    const userPhone = user?.phone_number?.replace(/\D/g, '');
    const recordPhone = (record.resident_contact || record.contact_number || '').replace(/\D/g, '');
    if (userPhone && recordPhone && userPhone === recordPhone) return true;

    // 4. Default demo resident Maria Santos matches
    if ((user?.email === 'resident@hibaoan.gov.ph' || !user) && (tracking === 'CV-2026-001' || tracking === 'CERT-2026-001')) {
      return true;
    }

    return false;
  };

  const executeSearch = async (targetQuery: string) => {
    const cleanQuery = targetQuery.trim().toUpperCase();
    if (!cleanQuery) return;

    setIsSearching(true);
    setIsAccessDenied(false);

    try {
      let foundRecord: TrackRecord | null = null;

      // 1. Check custom complaints saved in localStorage
      try {
        const stored = localStorage.getItem('cv_custom_complaints');
        if (stored) {
          const locals = JSON.parse(stored) as Complaint[];
          const match = locals.find((c) => c.tracking_number?.toUpperCase() === cleanQuery);
          if (match) foundRecord = { type: 'complaint', ...match };
        }
      } catch {}

      // 2. Check custom certificates in localStorage
      if (!foundRecord) {
        try {
          const stored = localStorage.getItem('cv_custom_certificates');
          if (stored) {
            const locals = JSON.parse(stored) as CertificateRequest[];
            const match = locals.find((c) => c.tracking_number?.toUpperCase() === cleanQuery);
            if (match) foundRecord = { type: 'certificate', ...match };
          }
        } catch {}
      }

      // 3. Check Supabase live complaints & certificates
      if (!foundRecord && isSupabaseConfigured && supabase) {
        try {
          const { data: dbComplaint } = await supabase
            .from('complaints')
            .select('*')
            .ilike('tracking_number', cleanQuery)
            .maybeSingle();

          if (dbComplaint) {
            foundRecord = { type: 'complaint', ...dbComplaint };
          } else {
            const { data: dbCert } = await supabase
              .from('certification_requests')
              .select('*')
              .ilike('tracking_number', cleanQuery)
              .maybeSingle();

            if (dbCert) {
              foundRecord = { type: 'certificate', ...dbCert };
            }
          }
        } catch {}
      }

      // 4. Check demo/mock complaints
      if (!foundRecord) {
        const foundComplaint = INITIAL_COMPLAINTS.find(c => c.tracking_number.toUpperCase() === cleanQuery);
        if (foundComplaint) foundRecord = { type: 'complaint', ...foundComplaint };
      }

      // 5. Check demo/mock certificates
      if (!foundRecord) {
        const foundCert = INITIAL_CERTIFICATES.find(c => c.tracking_number.toUpperCase() === cleanQuery);
        if (foundCert) foundRecord = { type: 'certificate', ...foundCert };
      }

      // If record found, check privacy permissions
      if (foundRecord) {
        if (verifyRecordOwnership(foundRecord)) {
          setResult(foundRecord);
          setIsAccessDenied(false);
        } else {
          // Resident is trying to view another resident's transaction!
          setResult(null);
          setIsAccessDenied(true);
        }
      } else {
        setResult(null);
        setIsAccessDenied(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  useEffect(() => {
    const trackingNumber = result?.tracking_number;
    if (!trackingNumber) {
      setMessages([]);
      return;
    }
    async function loadMessages() {
      let combined: ConversationMessage[] = [];
      try {
        const all: ConversationMessage[] = JSON.parse(localStorage.getItem('cv_record_messages') || '[]');
        combined = all.filter((item) => item.tracking_number === trackingNumber);
      } catch {}

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('record_messages')
          .select('*')
          .eq('tracking_number', trackingNumber)
          .order('created_at', { ascending: true });
        if (!error && data) {
          const remote = data.map((item) => ({
            id: item.id,
            record_type: item.record_type,
            tracking_number: item.tracking_number,
            sender_id: item.sender_id,
            sender_name: item.sender_name || 'Barangay User',
            sender_role: item.sender_role || 'staff',
            message: item.message,
            created_at: item.created_at,
          })) as ConversationMessage[];
          combined = [...combined.filter((item) => !remote.some((remoteItem) => remoteItem.created_at === item.created_at && remoteItem.message === item.message)), ...remote];
        }
      }
      setMessages(combined);
    }
    loadMessages();
  }, [result]);

  const sendMessage = async () => {
    const text = messageDraft.trim();
    if (!result?.tracking_number || !text || !user) return;
    const message: ConversationMessage = {
      id: `msg-${Date.now()}`,
      record_type: result.type === 'complaint' ? 'complaint' : 'request',
      tracking_number: result.tracking_number,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      message: text,
      created_at: new Date().toISOString(),
    };
    const all: ConversationMessage[] = JSON.parse(localStorage.getItem('cv_record_messages') || '[]');
    localStorage.setItem('cv_record_messages', JSON.stringify([...all, message]));
    setMessages((current) => [...current, message]);
    setMessageDraft('');
    if (isSupabaseConfigured && supabase && /^[0-9a-f-]{36}$/i.test(user.id)) {
      try {
        await supabase.from('record_messages').insert({
          record_type: message.record_type,
          tracking_number: message.tracking_number,
          sender_id: message.sender_id,
          sender_name: message.sender_name,
          sender_role: message.sender_role,
          message: message.message,
        });
        if (isStaffOrOfficial && message.record_type === 'complaint') {
          const { data: complaint } = await supabase
            .from('complaints')
            .select('first_official_response_at')
            .eq('tracking_number', message.tracking_number)
            .maybeSingle();
          if (complaint && !complaint.first_official_response_at) {
            const { error: responseError } = await supabase
              .from('complaints')
              .update({ first_official_response_at: message.created_at })
              .eq('tracking_number', message.tracking_number);
            if (responseError) throw responseError;
          }
        }
      } catch {
        // Local persistence keeps the conversation available in demo/offline mode.
      }
    }
  };

  const steps = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Barangay Hibao-an Sur Resident Services</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {isStaffOrOfficial ? 'Track Barangay Submissions (Staff Audit)' : 'Track My Transactions'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isStaffOrOfficial
            ? 'Official tracking search. Enter any reference code to inspect routing status and logs.'
            : 'Track the real-time milestone progress of your personal complaints and document requests.'}
        </p>
      </div>

      {/* Quick Select: My Recent Submissions (Residents Only) */}
      {!isStaffOrOfficial && allUserRecords.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Active Submissions ({allUserRecords.length})</span>
            </span>
            <span className="text-[10px] text-slate-400">Click to track instant status</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allUserRecords.map((item) => (
              <button
                key={item.tracking_number}
                type="button"
                onClick={() => {
                  setQuery(item.tracking_number);
                  executeSearch(item.tracking_number);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold flex items-center space-x-1.5 border transition-all ${
                  query.toUpperCase() === item.tracking_number.toUpperCase()
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{item.type === 'complaint' ? '🚨' : '📄'}</span>
                <span>{item.tracking_number}</span>
                <span className="text-[10px] opacity-75 font-sans">({item.status})</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
          disabled={isSearching}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
        >
          {isSearching ? 'Checking...' : 'Track Status'}
        </button>
      </form>

      {/* ACCESS DENIED PRIVACY WARNING */}
      {isAccessDenied && (
        <div className="p-8 bg-amber-50/90 border border-amber-200 rounded-3xl text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-amber-950">Protected Resident Record (Access Restricted)</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
            Reference code <strong className="font-mono">{query}</strong> belongs to another resident. Under the <strong>Data Privacy Act of 2012 (RA 10173)</strong>, citizens can only view their own transactions. Neighbor dispute narratives and personal certificate details are strictly confidential.
          </p>
          <p className="text-[11px] text-amber-700">
            If you need updates regarding this case, please visit the Barangay Hibao-an Sur Hall in person with a valid government ID.
          </p>
        </div>
      )}

      {/* Results View */}
      {result && !isAccessDenied ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider block">
                {result.tracking_number}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">{'title' in result ? result.title : result.purpose}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted by: <strong>{result.resident_name || 'You'}</strong>
              </p>
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
              <p className="font-semibold text-slate-800">
                {result.type === 'complaint'
                  ? (result.assigned_role_label || result.assigned_to || 'Under Automated Routing')
                  : (result.approved_by_name || result.approved_by || 'Barangay Administration')}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
              <span className="text-slate-400 font-medium">Location Landmark</span>
              <p className="font-semibold text-slate-800">{'location_address' in result ? result.location_address : 'Barangay Hall, Hibao-an Sur'}</p>
            </div>
          </div>

          {result.type === 'complaint' && result.ai_justification && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider text-blue-700">
                AI Assessment & Routing Note
              </span>
              <p>{result.ai_justification}</p>
            </div>
          )}

          {result.type === 'complaint' && result.resolution_report && (
            <section className="p-5 border border-emerald-200 bg-emerald-50/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-900">Official Incident Resolution Report</h3>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold"
                >
                  Print / PDF
                </button>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><dt className="text-emerald-700">Assigned Official</dt><dd className="font-semibold">{result.resolution_report.assigned_official}</dd></div>
                <div><dt className="text-emerald-700">Date Resolved</dt><dd className="font-semibold">{new Date(result.resolution_report.resolved_at).toLocaleString()}</dd></div>
              </dl>
              <p className="text-xs"><strong>Incident Summary:</strong> {result.resolution_report.incident_summary}</p>
              <p className="text-xs"><strong>Actions Taken:</strong> {result.resolution_report.actions_taken}</p>
              <p className="text-xs"><strong>Resolution Details:</strong> {result.resolution_report.resolution_details}</p>
              {!!result.resolution_report.photos?.length && (
                <div className="space-y-2 border-t border-emerald-200 pt-3">
                  <h4 className="text-xs font-bold text-emerald-900">Photos of Completed Work</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {result.resolution_report.photos.map((photo: { name: string; data: string }, index: number) => (
                      <figure key={`${photo.name}-${index}`} className="space-y-1">
                        <img src={photo.data} alt={photo.name} className="aspect-[4/3] w-full rounded-lg border border-emerald-200 object-cover" />
                        <figcaption className="break-words text-[10px] text-emerald-800">{photo.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Communication</h3>
              <p className="text-[11px] text-slate-500">Messages and progress updates for this submission</p>
            </div>
            <div className="max-h-72 overflow-y-auto p-4 space-y-3 bg-white">
              {messages.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No messages yet.</p>
              )}
              {messages.map((message) => (
                <div key={message.id} className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                  message.sender_id === user?.id ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-slate-100 text-slate-800'
                }`}>
                  <p className="font-bold text-[11px]">{message.sender_name} · {message.sender_role}</p>
                  <p className="mt-1 leading-relaxed">{message.message}</p>
                  <p className={`mt-1 text-[9px] ${message.sender_id === user?.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            {user && (
              <div className="p-3 border-t border-slate-100 flex gap-2">
                <input
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                  placeholder="Write a message..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={sendMessage} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
                  Send
                </button>
              </div>
            )}
          </section>
        </div>
      ) : !isAccessDenied && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No record found for &quot;{query}&quot;</h3>
          <p className="text-xs text-slate-400 mt-1">Please ensure you entered the exact reference code from your SMS receipt.</p>
        </div>
      )}
    </div>
  );
}
