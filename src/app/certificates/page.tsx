'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, PlusCircle, Building } from 'lucide-react';
import { INITIAL_CERTIFICATES } from '@/lib/mockData';
import { CertificateRequest, CertificateType } from '@/lib/types';

export default function CertificatesPage() {
  const [requests, setRequests] = useState<CertificateRequest[]>(INITIAL_CERTIFICATES);
  const [certType, setCertType] = useState<CertificateType>('certificate_of_indigency');
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [contact, setContact] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `CERT-2026-00${requests.length + 1}`;
    const newReq: CertificateRequest = {
      id: `cert-${Date.now()}`,
      tracking_number: newId,
      resident_name: name,
      certificate_type: certType,
      purpose,
      contact_number: contact,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    setRequests([newReq, ...requests]);
    setSubmittedId(newId);
    setName('');
    setPurpose('');
    setContact('');
  };

  const getDocName = (type: CertificateType) => {
    switch (type) {
      case 'barangay_id': return 'Barangay Identification Card (ID)';
      case 'certificate_of_indigency': return 'Certificate of Indigency';
      case 'certificate_of_residency': return 'Certificate of Residency';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Barangay Document & Certification Services</h1>
        <p className="text-slate-500 text-sm mt-1">
          Barangay Hibao-an Sur • Request official documents online and monitor approval status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Request Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
            <PlusCircle className="w-4 h-4" />
            <span>New Document Application</span>
          </div>

          {submittedId && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Request Submitted Successfully!
              </span>
              <p>Reference: <strong className="font-mono">{submittedId}</strong>. You will receive an SMS update when approved by the Punong Barangay.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Document Type *</label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as CertificateType)}
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="certificate_of_indigency">Certificate of Indigency (Medical, Educational, Burial)</option>
                <option value="certificate_of_residency">Certificate of Residency (Proof of Residence)</option>
                <option value="barangay_id">Barangay ID Card (Resident Identification)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan S. Dela Cruz"
                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purpose of Request *</label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Medical Assistance at WVMC or Scholarship Application"
                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Contact Number (For SMS updates) *</label>
              <input
                type="tel"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0917-000-0000"
                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm"
            >
              Submit Request for Captain Approval
            </button>
          </form>
        </div>

        {/* Existing Requests Tracking */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Applications</h3>
            <span className="text-xs text-slate-400">{requests.length} Requests</span>
          </div>

          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-blue-600 font-bold block">{r.tracking_number}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{getDocName(r.certificate_type)}</h4>
                    <p className="text-slate-500">Applicant: <strong>{r.resident_name}</strong></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    r.status === 'Ready for Pickup' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'For Approval' ? 'bg-blue-100 text-blue-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">
                  <span className="text-[11px] block"><strong>Purpose:</strong> {r.purpose}</span>
                  {r.remarks && <span className="text-[11px] text-blue-700 block mt-0.5">ℹ️ {r.remarks}</span>}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Contact: {r.contact_number}</span>
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

