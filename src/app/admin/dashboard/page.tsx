'use client';

import React, { useState } from 'react';
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
import { Complaint, CertificateRequest } from '@/lib/types';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'complaints' | 'blotter' | 'certificates' | 'tanod'>('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [certificates, setCertificates] = useState<CertificateRequest[]>(INITIAL_CERTIFICATES);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Human-in-the-Loop: Staff confirms AI recommendation
  const handleConfirmAI = (id: string) => {
    setComplaints(complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          is_staff_confirmed: true,
          status: 'Assigned',
          assigned_to: CATEGORIES.find(cat => cat.id === (c.ai_category_id || c.category_id))?.assigned_role || 'Barangay Staff'
        };
      }
      return c;
    }));
    setSuccessBanner(`Confirmed AI recommendation for ${id}. Routing assigned and resident notified via simulated SMS.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Human-in-the-Loop: Staff overrides
  const handleOverride = (id: string, newPriority: 'High' | 'Medium' | 'Low') => {
    setComplaints(complaints.map(c => {
      if (c.id === id) {
        return {
          ...c,
          priority: newPriority,
          is_staff_confirmed: true,
          status: 'Assigned'
        };
      }
      return c;
    }));
    setSuccessBanner(`Priority updated to ${newPriority} for ${id}.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Certificate Approval by Captain
  const handleApproveCert = (id: string) => {
    setCertificates(certificates.map(cert => {
      if (cert.id === id) {
        return {
          ...cert,
          status: 'Ready for Pickup',
          approved_by: 'Hon. Punong Barangay (Barangay Captain)',
          approved_at: new Date().toISOString(),
          remarks: 'Approved. Available at Window 1.'
        };
      }
      return cert;
    }));
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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Electronic Blotter Logbook</h3>
              <p className="text-xs text-slate-500">Official digital records replacing manual blotter books.</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono">
              RA 10173 Protected
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {INITIAL_BLOTTER.map((b) => (
              <div key={b.id} className="py-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-blue-600 font-bold block">{b.blotter_entry_number}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{b.incident_type}</h4>
                    <p className="text-slate-500">Location: {b.incident_location} • Date: {new Date(b.incident_date).toLocaleString()}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-slate-100 text-slate-700">
                    {b.status}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                  <p><strong>Narrative:</strong> {b.narrative}</p>
                  <p className="mt-1 text-slate-500 text-[11px]">
                    Complainant: <strong>{b.complainant_name}</strong> • Respondent: <strong>{b.respondent_name}</strong>
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

