'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, PlusCircle, Building, ShieldCheck, Lock } from 'lucide-react';
import { INITIAL_CERTIFICATES } from '@/lib/mockData';
import { CertificateRequest, CertificateType } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { notifyCertificateSubmitted } from '@/lib/smsService';

export default function CertificatesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<CertificateRequest[]>(INITIAL_CERTIFICATES);
  const [certType, setCertType] = useState<CertificateType>('certificate_of_indigency');
  const [name, setName] = useState(user?.full_name || '');
  const [purpose, setPurpose] = useState('');
  const [contact, setContact] = useState(user?.phone_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [myTrackings, setMyTrackings] = useState<string[]>([]);

  const isStaffOrOfficial = Boolean(
    user && (user.role === 'staff' || user.role === 'official' || user.role === 'admin')
  );

  // Load tracking numbers submitted on this browser/account
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cv_my_tracking_numbers');
      if (stored) {
        setMyTrackings(JSON.parse(stored));
      }
    } catch {
      setMyTrackings([]);
    }
  }, []);

  // Load existing certificates from localStorage and Supabase
  useEffect(() => {
    async function loadCertificates() {
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
          console.warn('Could not load certificates from Supabase:', err);
        }
      }

      setRequests(combined);
    }

    loadCertificates();
  }, []);

  // Update applicant defaults when auth user changes
  useEffect(() => {
    if (user?.full_name && !name) setName(user.full_name);
    if (user?.phone_number && !contact) setContact(user.phone_number);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newId = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
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

    // 1. Save to local storage for instant availability
    try {
      const stored = localStorage.getItem('cv_custom_certificates');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newReq);
      localStorage.setItem('cv_custom_certificates', JSON.stringify(list));

      // Also record in personal tracking list for resident isolation
      const storedTrackings = JSON.parse(localStorage.getItem('cv_my_tracking_numbers') || '[]');
      if (!storedTrackings.includes(newId)) {
        storedTrackings.unshift(newId);
        localStorage.setItem('cv_my_tracking_numbers', JSON.stringify(storedTrackings));
        setMyTrackings(storedTrackings);
      }
    } catch (err) {
      console.warn('Local storage write error:', err);
    }

    // 2. Save to live Supabase database
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('certification_requests').insert({
          tracking_number: newId,
          resident_name: name,
          certificate_type: certType,
          purpose,
          contact_number: contact,
          status: 'Pending'
        });

        if (error) {
          console.warn('Supabase certificate insert warning:', error.message);
        }
      } catch (err) {
        console.error('Database connection error:', err);
      }
    }

    // 3. Dispatch automated SMS confirmation receipt via Semaphore Gateway
    try {
      if (contact && contact.trim()) {
        notifyCertificateSubmitted(contact, newId, getDocName(certType), name);
      }
    } catch (smsErr) {
      console.warn('SMS dispatch error:', smsErr);
    }

    setRequests([newReq, ...requests]);
    setSubmittedId(newId);
    setPurpose('');
    setIsSubmitting(false);
  };

  const getDocName = (type: CertificateType) => {
    switch (type) {
      case 'barangay_id': return 'Barangay Identification Card (ID)';
      case 'certificate_of_indigency': return 'Certificate of Indigency';
      case 'certificate_of_residency': return 'Certificate of Residency';
    }
  };

  // Filter for resident view: Residents ONLY see their own applications
  const visibleRequests = useMemo(() => {
    if (isStaffOrOfficial) {
      return requests;
    }

    const userName = user?.full_name?.toLowerCase().trim();
    const userPhone = user?.phone_number?.replace(/\D/g, '');

    return requests.filter((r) => {
      // 1. Matched by tracking codes created by this browser/session
      if (myTrackings.includes(r.tracking_number)) return true;

      // 2. Matched by applicant name
      if (userName && r.resident_name && r.resident_name.toLowerCase().trim() === userName) {
        return true;
      }

      // 3. Matched by phone number
      if (userPhone && r.contact_number) {
        const cleanPhone = r.contact_number.replace(/\D/g, '');
        if (cleanPhone === userPhone) return true;
      }

      // 4. Default mock resident Maria Santos owns CERT-2026-001
      if (user?.email === 'resident@hibaoan.gov.ph' && r.tracking_number === 'CERT-2026-001') {
        return true;
      }

      return false;
    });
  }, [requests, isStaffOrOfficial, user, myTrackings]);

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
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                {!isStaffOrOfficial && <Lock className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isStaffOrOfficial ? 'All Barangay Document Applications' : 'My Document Applications'}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isStaffOrOfficial 
                  ? 'Official overview of all resident certificate requests.' 
                  : 'Displaying strictly your own personal requests in compliance with RA 10173.'}
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
              {visibleRequests.length} {visibleRequests.length === 1 ? 'Request' : 'Requests'}
            </span>
          </div>

          {visibleRequests.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-xs">No applications on record</h4>
              <p className="text-slate-400 text-[11px] max-w-xs mx-auto">
                You have not filed any certificate requests yet. Fill in the form on the left to apply for an official document.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleRequests.map((r) => {
                const diffHours = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
                const isOverdue = r.status !== 'Ready for Pickup' && r.status !== 'Released' && diffHours >= 48;
                const isApproaching = r.status !== 'Ready for Pickup' && r.status !== 'Released' && diffHours >= 24 && diffHours < 48;

                return (
                  <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-blue-600 font-bold block">{r.tracking_number}</span>
                          {isOverdue && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-800 font-bold border border-rose-300 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Overdue (&gt;48h)
                            </span>
                          )}
                          {isApproaching && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-900 font-semibold border border-amber-300 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> Processing (&gt;24h)
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{getDocName(r.certificate_type)}</h4>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

