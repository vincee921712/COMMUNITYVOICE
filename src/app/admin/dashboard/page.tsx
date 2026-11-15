'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  FileCheck, 
  Users, 
  Building,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_BLOTTER, 
  INITIAL_CERTIFICATES, 
  INITIAL_TANOD_SCHEDULE,
  CATEGORIES 
} from '@/lib/mockData';
import { Complaint, CertificateRequest, BlotterRecord } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'complaints' | 'blotter' | 'certificates' | 'tanod'>('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [certificates, setCertificates] = useState<CertificateRequest[]>(INITIAL_CERTIFICATES);
  const [blotterRecords, setBlotterRecords] = useState<BlotterRecord[]>(INITIAL_BLOTTER);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Walk-in Blotter Entry Form State
  const [showBlotterForm, setShowBlotterForm] = useState(false);
  const [incidentType, setIncidentType] = useState('Neighborhood Dispute');
  const [incidentLocation, setIncidentLocation] = useState('Zone 1, Hibao-an Sur');
  const [complainantName, setComplainantName] = useState('');
  const [respondentName, setRespondentName] = useState('');
  const [assignedPersonnel, setAssignedPersonnel] = useState('Kagawad on Peace & Order');
  const [narrative, setNarrative] = useState('');
  const [isSubmittingBlotter, setIsSubmittingBlotter] = useState(false);

  // Load complaints from localStorage and Supabase
  useEffect(() => {
    async function fetchComplaints() {
      let combined: Complaint[] = [...INITIAL_COMPLAINTS];

      // 1. Read from localStorage custom complaints
      try {
        const stored = localStorage.getItem('cv_custom_complaints');
        if (stored) {
          const locals: Complaint[] = JSON.parse(stored);
          // Prepend local complaints
          combined = [...locals, ...combined];
        }
      } catch (e) {
        console.warn('Could not read local complaints', e);
      }

      // 2. Read from Supabase if connected
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            // Deduplicate by tracking_number
            const existingTracking = new Set(data.map(d => d.tracking_number));
            const filteredCombined = combined.filter(c => !existingTracking.has(c.tracking_number));
            combined = [...(data as Complaint[]), ...filteredCombined];
          }
        } catch (e) {
          console.warn('Could not fetch complaints from Supabase', e);
        }
      }

      setComplaints(combined);
    }

    fetchComplaints();
  }, []);

  // Load certificates from localStorage and Supabase
  useEffect(() => {
    async function fetchCertificates() {
      let combined: CertificateRequest[] = [...INITIAL_CERTIFICATES];

      // 1. Read from localStorage
      try {
        const stored = localStorage.getItem('cv_custom_certificates');
        if (stored) {
          const locals: CertificateRequest[] = JSON.parse(stored);
          combined = [...locals, ...combined];
        }
      } catch (err) {
        console.warn('Could not read local certificates:', err);
      }

      // 2. Read from Supabase if connected
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('certification_requests')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data && data.length > 0) {
            const existingTracking = new Set(data.map(d => d.tracking_number));
            const filteredCombined = combined.filter(c => !existingTracking.has(c.tracking_number));
            combined = [...(data as CertificateRequest[]), ...filteredCombined];
          }
        } catch (err) {
          console.warn('Could not fetch certificates from Supabase:', err);
        }
      }

      setCertificates(combined);
    }

    fetchCertificates();
  }, []);

  // Load blotter records from localStorage and Supabase
  useEffect(() => {
    async function fetchBlotter() {
      let combined: BlotterRecord[] = [...INITIAL_BLOTTER];

      try {
        const stored = localStorage.getItem('cv_custom_blotter');
        if (stored) {
          const locals: BlotterRecord[] = JSON.parse(stored);
          combined = [...locals, ...combined];
        }
      } catch (err) {
        console.warn('Could not read local blotter:', err);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('blotter_records')
            .select('*')
            .order('incident_date', { ascending: false });

          if (!error && data && data.length > 0) {
            const existingEntries = new Set(data.map(d => d.blotter_entry_number));
            const filteredCombined = combined.filter(b => !existingEntries.has(b.blotter_entry_number));
            combined = [...(data as BlotterRecord[]), ...filteredCombined];
          }
        } catch (err) {
          console.warn('Could not fetch blotter records from Supabase:', err);
        }
      }

      setBlotterRecords(combined);
    }

    fetchBlotter();
  }, []);

  // Handle Walk-in Blotter Submission
  const handleBlotterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBlotter(true);

    const blotterEntryNumber = `BLOTTER-2026-${Math.floor(100 + blotterRecords.length + 1)}`;
    const newRecord: BlotterRecord = {
      id: `blot-${Date.now()}`,
      blotter_entry_number: blotterEntryNumber,
      incident_type: incidentType,
      incident_date: new Date().toISOString(),
      incident_location: incidentLocation,
      complainant_name: complainantName,
      respondent_name: respondentName || 'Unidentified / Unknown',
      narrative,
      assigned_personnel: assignedPersonnel,
      status: 'Active',
      created_at: new Date().toISOString()
    };

    // 1. Save to local storage
    try {
      const stored = localStorage.getItem('cv_custom_blotter');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newRecord);
      localStorage.setItem('cv_custom_blotter', JSON.stringify(list));
    } catch (err) {
      console.warn('Local storage write blotter error:', err);
    }

    // 2. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('blotter_records').insert({
          blotter_entry_number: blotterEntryNumber,
          incident_type: incidentType,
          incident_date: new Date().toISOString(),
          incident_location: incidentLocation,
          complainant_name: complainantName,
          respondent_name: respondentName || 'Unidentified / Unknown',
          narrative,
          assigned_personnel: assignedPersonnel,
          status: 'Active'
        });
      } catch (err) {
        console.warn('Supabase blotter insert warning:', err);
      }
    }

    setBlotterRecords([newRecord, ...blotterRecords]);
    setSuccessBanner(`Blotter entry ${blotterEntryNumber} successfully logged into the Electronic Blotter Book.`);
    setShowBlotterForm(false);
    setComplainantName('');
    setRespondentName('');
    setNarrative('');
    setIsSubmittingBlotter(false);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Human-in-the-Loop: Staff confirms AI recommendation
  const handleConfirmAI = async (id: string) => {
    const matched = complaints.find(c => c.id === id);
    const assignedRole = CATEGORIES.find(cat => cat.id === (matched?.ai_category_id || matched?.category_id))?.assigned_role || 'Barangay Staff';

    const updated = complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          is_staff_confirmed: true,
          status: 'Assigned' as const,
          assigned_to: assignedRole
        };
      }
      return c;
    });

    setComplaints(updated);

    // Sync to local storage
    try {
      localStorage.setItem('cv_custom_complaints', JSON.stringify(updated));
    } catch {}

    // Sync to Supabase
    if (isSupabaseConfigured && supabase && matched?.tracking_number) {
      await supabase
        .from('complaints')
        .update({
          status: 'Assigned',
          is_staff_confirmed: true,
          assigned_to: assignedRole
        })
        .eq('tracking_number', matched.tracking_number);
    }

    setSuccessBanner(`Confirmed AI recommendation for ${id}. Routing assigned and resident notified via simulated SMS.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Human-in-the-Loop: Staff overrides
  const handleOverride = async (id: string, newPriority: 'High' | 'Medium' | 'Low') => {
    const matched = complaints.find(c => c.id === id);
    const updated = complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          priority: newPriority,
          is_staff_confirmed: true,
          status: 'Assigned' as const
        };
      }
      return c;
    });

    setComplaints(updated);

    try {
      localStorage.setItem('cv_custom_complaints', JSON.stringify(updated));
    } catch {}

    if (isSupabaseConfigured && supabase && matched?.tracking_number) {
      await supabase
        .from('complaints')
        .update({
          priority: newPriority,
          status: 'Assigned',
          is_staff_confirmed: true
        })
        .eq('tracking_number', matched.tracking_number);
    }

    setSuccessBanner(`Priority updated to ${newPriority} for ${id}.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Certificate Approval by Captain
  const handleApproveCert = async (id: string) => {
    const matched = certificates.find(cert => cert.id === id);
    const updated = certificates.map(cert => {
      if (cert.id === id) {
        return {
          ...cert,
          status: 'Ready for Pickup' as const,
          approved_by: 'Hon. Punong Barangay (Barangay Captain)',
          approved_at: new Date().toISOString(),
          remarks: 'Approved. Available at Window 1.'
        };
      }
      return cert;
    });

    setCertificates(updated);

    // Sync to local storage
    try {
      localStorage.setItem('cv_custom_certificates', JSON.stringify(updated));
    } catch {}

    // Sync to Supabase
    if (isSupabaseConfigured && supabase && matched?.tracking_number) {
      await supabase
        .from('certification_requests')
        .update({
          status: 'Ready for Pickup',
          approved_at: new Date().toISOString(),
          remarks: 'Approved. Available at Window 1.'
        })
        .eq('tracking_number', matched.tracking_number);
    }

    setSuccessBanner(`Certificate ${id} approved! Marked as 'Ready for Pickup' and SMS notification sent.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-800 text-white px-2 py-0.5 rounded">
              Official Administration
            </span>
            <span className="text-xs text-slate-500">Barangay Hibao-an Sur, Iloilo City</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Barangay Staff & Officials Portal</h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'complaints' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Complaint Queue ({complaints.filter(c => !c.is_staff_confirmed).length} New)
          </button>
          <button
            onClick={() => setActiveTab('blotter')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'blotter' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Electronic Blotter
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'certificates' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Certificates Approval
          </button>
          <button
            onClick={() => setActiveTab('tanod')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tanod' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tanod Schedules
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>✓ {successBanner}</span>
          <span className="font-mono text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">Live Audit Logged</span>
        </div>
      )}

      {/* TAB 1: COMPLAINT QUEUE & AI RECOMMENDATIONS */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <p className="text-slate-500">
              Review AI-recommended category, priority scoring, and routing rules before assigning to officials.
            </p>
            <span className="font-semibold text-slate-700">Total Submissions: {complaints.length}</span>
          </div>

          <div className="space-y-4">
            {complaints.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-600">{c.tracking_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.priority} Priority
                      </span>
                      {c.is_minor_flagged && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                          ⚠️ Involves Minor (SWDO Protocol)
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mt-1">{c.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{c.description}</p>
                    <p className="text-[11px] text-slate-400 mt-2">📍 {c.location_address} • Complainant: <strong>{c.resident_name}</strong></p>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      c.is_staff_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800 animate-pulse'
                    }`}>
                      {c.is_staff_confirmed ? 'Assigned' : 'Needs Staff Review'}
                    </span>
                  </div>
                </div>

                {/* AI Recommendation Box */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-blue-800">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI Model Assessment (FastAPI Engine)</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-mono">Confidence: {((c.ai_confidence || 0.9) * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-700"><strong>Justification:</strong> {c.ai_justification}</p>
                  <p className="text-slate-700"><strong>Recommended Routing:</strong> {c.assigned_to || 'Assigned Kagawad'}</p>
                </div>

                {/* Human-in-the-Loop Action Buttons */}
                {!c.is_staff_confirmed ? (
                  <div className="pt-2 flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 text-xs">
                    <span className="text-slate-400 mr-2 text-[11px]">Human Staff Decision:</span>
                    <button
                      onClick={() => handleConfirmAI(c.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm & Route</span>
                    </button>
                    <button
                      onClick={() => handleOverride(c.id, c.priority === 'High' ? 'Medium' : 'High')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg"
                    >
                      Override Priority
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 text-right text-[11px] text-slate-400 border-t border-slate-100">
                    ✓ Confirmed by Staff • Currently being handled by: <strong className="text-slate-700">{c.assigned_to}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ELECTRONIC BLOTTER */}
      {activeTab === 'blotter' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Electronic Blotter Logbook</h3>
              <p className="text-xs text-slate-500">Official digital records for walk-in peace & order incidents (Replacing paper logbooks).</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono">
                RA 10173 Protected
              </span>
              <button
                type="button"
                onClick={() => setShowBlotterForm(!showBlotterForm)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                {showBlotterForm ? 'Cancel Entry' : '+ Encode Walk-in Blotter'}
              </button>
            </div>
          </div>

          {/* New Walk-in Blotter Entry Form */}
          {showBlotterForm && (
            <form onSubmit={handleBlotterSubmit} className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Encode Walk-in Incident / Citizen Dispute
                </span>
                <span className="text-[10px] text-blue-600 font-mono">Date: {new Date().toLocaleDateString()}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incident Classification *</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Neighborhood Dispute">Neighborhood Dispute / Verbal Argument</option>
                    <option value="Noise Disturbance">Noise Disturbance (Videoke / Nighttime)</option>
                    <option value="Curfew Violation">Curfew Violation / Minors Out Late</option>
                    <option value="Property Boundary Conflict">Property Boundary / Right of Way Conflict</option>
                    <option value="Physical Altercation">Physical Altercation / Brawl</option>
                    <option value="Pet / Animal Complaint">Pet / Stray Animal Disturbance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Incident Location (Purok/Zone) *</label>
                  <select
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Zone 1 (Purok Narra / Main Road)">Zone 1 (Purok Narra / Main Road)</option>
                    <option value="Zone 2 (Drainage / Central Pathway)">Zone 2 (Drainage / Central Pathway)</option>
                    <option value="Zone 3 (Near Covered Court)">Zone 3 (Near Covered Court)</option>
                    <option value="Zone 4 (Outer Subdivision Boundary)">Zone 4 (Outer Subdivision Boundary)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Complainant (Reporting Citizen) *</label>
                  <input
                    type="text"
                    required
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    placeholder="Full Name (e.g. Maria Corazon)"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Respondent (Party Complained Against)</label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Full Name or 'Unknown / Neighbor'"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Barangay Official / Tanod *</label>
                <select
                  value={assignedPersonnel}
                  onChange={(e) => setAssignedPersonnel(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Kagawad on Peace & Order">Kagawad on Peace & Order</option>
                  <option value="Barangay Tanod On-Duty Team Leader">Barangay Tanod On-Duty Team Leader</option>
                  <option value="Lupong Tagapamayapa (Lupon Member)">Lupong Tagapamayapa (Lupon Conciliation)</option>
                  <option value="Punong Barangay (Captain)">Punong Barangay (Captain Direct Intervention)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Narrative Summary & Statements *</label>
                <textarea
                  required
                  rows={3}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Summarize the incident facts, time of occurrence, witnesses, and immediate action taken by the desk officer."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlotterForm(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBlotter}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmittingBlotter ? 'Encoding Entry...' : 'Save Official Blotter Record'}
                </button>
              </div>
            </form>
          )}

          {/* Blotter Records List */}
          <div className="divide-y divide-slate-100 text-xs">
            {blotterRecords.map((b) => (
              <div key={b.id} className="py-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-blue-600 font-bold block">{b.blotter_entry_number}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{b.incident_type}</h4>
                    <p className="text-slate-500">
                      Location: <strong>{b.incident_location}</strong> • Date: {new Date(b.incident_date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    b.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' :
                    b.status === 'Referred to SWDO' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                  <p><strong>Narrative:</strong> {b.narrative}</p>
                  <p className="mt-1 text-slate-500 text-[11px]">
                    Complainant: <strong>{b.complainant_name}</strong> • Respondent: <strong>{b.respondent_name}</strong> • Assigned: <strong className="text-blue-700">{b.assigned_personnel}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CERTIFICATES APPROVAL */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Certificate Request Approvals</h3>
              <p className="text-xs text-slate-500">Punong Barangay review for Indigency, Residency, and Barangay ID.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {certificates.map((cert) => (
              <div key={cert.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-blue-600 font-bold text-[10px]">{cert.tracking_number}</span>
                  <h4 className="font-bold text-slate-900 text-sm uppercase">{cert.certificate_type.replace(/_/g, ' ')}</h4>
                  <p className="text-slate-600">Applicant: <strong>{cert.resident_name}</strong> • Contact: {cert.contact_number}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Purpose: {cert.purpose}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    cert.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cert.status}
                  </span>

                  {cert.status !== 'Ready for Pickup' && (
                    <button
                      onClick={() => handleApproveCert(cert.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Approve Document
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TANOD SCHEDULES */}
      {activeTab === 'tanod' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Barangay Tanod Duty Schedules</h3>
              <p className="text-xs text-slate-500">Patrol duty assignments encoded by staff.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {INITIAL_TANOD_SCHEDULE.map((ts) => (
              <div key={ts.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-800">{ts.shift}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{ts.duty_date}</span>
                </div>
                <p className="text-slate-600 font-medium">Assigned Sector: <strong>{ts.sector_assigned}</strong></p>
                <div className="text-slate-500">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase">On-Duty Tanod:</span>
                  <ul className="list-disc pl-4 space-y-0.5 mt-1">
                    {ts.tanod_names.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

