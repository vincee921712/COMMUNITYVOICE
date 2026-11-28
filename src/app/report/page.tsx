'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  X, 
  Shield, 
  PhoneCall,
  ExternalLink,
  Eye,
  Info,
  Lock
} from 'lucide-react';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Category, PriorityLevel, Complaint } from '@/lib/types';
import { 
  checkDuplicateProximity, 
  fetchAllActiveComplaints,
  DuplicateDetectionResult 
} from '@/lib/duplicateDetection';
import { 
  notifyComplaintSubmitted, 
  notifyCaptainHighPriorityAlert 
} from '@/lib/smsService';
import { useAuth } from '@/context/AuthContext';

const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
      Loading Barangay Hibao-an Sur Map...
    </div>
  ),
});

export default function ReportPage() {
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [selectedPin, setSelectedPin] = useState<[number, number]>([10.7314, 122.5228]);
  
  // Existing complaints cache for proximity/duplicate checking
  const [existingComplaints, setExistingComplaints] = useState<Complaint[]>([]);
  
  // Image Upload State
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Recommendation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: string;
    priority: PriorityLevel;
    justification: string;
    involves_minor: boolean;
  } | null>(null);

  // Duplicate Check Modal State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [previewingExistingComplaint, setPreviewingExistingComplaint] = useState<Complaint | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTracking, setSubmittedTracking] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [savedToDatabase, setSavedToDatabase] = useState(false);

  // Fetch live categories and existing active complaints on mount
  useEffect(() => {
    if (!user) return;
    async function loadInitialData() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('categories').select('*');
          if (!error && data && data.length > 0) {
            setCategories(data as Category[]);
          }
        } catch {
          // Keep default fallback categories
        }
      }

      // Fetch active complaints for duplicate detection
      try {
        const complaintsList = await fetchAllActiveComplaints();
        setExistingComplaints(complaintsList);
      } catch (err) {
        console.warn('Failed to load complaints for duplicate check:', err);
      }
    }
    loadInitialData();
  }, [user]);

  // Compute real-time proximity warning whenever pin, category, title, or description changes
  const duplicateAlert: DuplicateDetectionResult = useMemo(() => {
    return checkDuplicateProximity(
      selectedPin[0],
      selectedPin[1],
      title,
      description,
      categoryId,
      existingComplaints,
      100 // 100 meters threshold
    );
  }, [selectedPin, title, description, categoryId, existingComplaints]);

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage(e.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleAIAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);

    try {
      const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/api/ai/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          resident_name: name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult({
          category: data.category_id,
          priority: data.priority,
          justification: data.justification,
          involves_minor: data.involves_minor
        });
        setCategoryId(data.category_id);
      } else {
        throw new Error('AI Service offline');
      }
    } catch {
      // Local fallback heuristic
      const descLower = description.toLowerCase();
      const hasMinor = /minor|child|bata|curfew|underage/.test(descLower);
      const isHigh = hasMinor || /wire|kuryente|fire|away|danger/.test(descLower);
      const category = hasMinor ? 'minors' :
        /basura|garbage|trash|drainage|canal/.test(descLower) ? 'sanitation' :
        /kalsada|road|pothole/.test(descLower) ? 'infrastructure' :
        /wire|streetlight|water/.test(descLower) ? 'utilities' : 'general';

      setAiResult({
        category,
        priority: isHigh ? 'High' : 'Medium',
        justification: hasMinor 
          ? 'Case mentions underage individuals; automated priority flag for SWDO protocol.'
          : 'Grounded on keywords identified in your submitted description.',
        involves_minor: hasMinor
      });
      setCategoryId(category);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Form submission handler: checks for duplicates before proceeding
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If a nearby duplicate is found, intercept with warning confirmation modal
    if (duplicateAlert.isDuplicateFound && duplicateAlert.matchedComplaint) {
      setShowDuplicateModal(true);
      return;
    }

    // Otherwise proceed to execute submission
    executeSubmission(false);
  };

  // Execute database and local storage submission
  const executeSubmission = async (isBypassedDuplicate: boolean) => {
    setIsSubmitting(true);
    setShowDuplicateModal(false);
    setSubmitError('');
    setSubmittedTracking(null);
    setSavedToDatabase(false);

    const trackingCode = `CV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedCategory = categories.find(c => c.id === categoryId);
    const matchedRef = duplicateAlert.matchedComplaint?.id;
    const submittedAt = new Date().toISOString();

    const newComplaintRecord: Complaint = {
      id: `cmp-${Date.now()}`,
      tracking_number: trackingCode,
      resident_id: user?.id,
      resident_name: name || 'Anonymous Resident',
      resident_contact: contact || undefined,
      title,
      description,
      location_address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City',
      latitude: selectedPin[0],
      longitude: selectedPin[1],
      category_id: categoryId,
      priority: aiResult?.priority || assignedCategory?.default_priority || 'Medium',
      status: 'Submitted',
      ai_category_id: aiResult?.category || categoryId,
      ai_priority: aiResult?.priority || 'Medium',
      ai_justification: aiResult?.justification || 'Self-submitted by resident',
      is_staff_confirmed: false,
      is_minor_flagged: aiResult?.involves_minor || false,
      is_duplicate_flagged: isBypassedDuplicate,
      duplicate_of_id: isBypassedDuplicate && matchedRef ? matchedRef : undefined,
      duplicate_similarity_score: isBypassedDuplicate ? duplicateAlert.similarityScore / 100 : undefined,
      status_history: [{
        status: 'Submitted',
        changed_at: submittedAt,
        changed_by: user?.full_name || name || 'Resident'
      }],
      created_at: submittedAt,
      updated_at: submittedAt
    };

    try {
      if (isSupabaseConfigured && supabase) {
        if (!user || !/^[0-9a-f-]{36}$/i.test(user.id)) {
          throw new Error('Sign in with a verified resident account before submitting a complaint.');
        }
        const { error } = await supabase.from('complaints').insert({
          tracking_number: trackingCode,
          resident_id: user.id,
          title,
          description,
          location_address: 'Barangay Hibao-an Sur, Mandurriao, Iloilo City',
          latitude: selectedPin[0],
          longitude: selectedPin[1],
          category_id: categoryId,
          priority: aiResult?.priority || assignedCategory?.default_priority || 'Medium',
          status: 'Submitted',
          ai_category_id: aiResult?.category || categoryId,
          ai_priority: aiResult?.priority || 'Medium',
          ai_justification: aiResult?.justification || 'Self-submitted by resident',
          is_minor_flagged: aiResult?.involves_minor || false,
          is_duplicate_flagged: isBypassedDuplicate,
          duplicate_of_id: isBypassedDuplicate && matchedRef && /^[0-9a-f-]{36}$/i.test(matchedRef) ? matchedRef : null,
          status_history: newComplaintRecord.status_history,
          attachments: attachedImage ? [{ name: imageFileName, data: attachedImage }] : []
        });

        if (error) throw new Error(`Your complaint was not saved: ${error.message}`);
        setSavedToDatabase(true);
      } else {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Complaint submission is unavailable because the database is not configured.');
        }
        setSavedToDatabase(false);
      }

      try {
        const stored = localStorage.getItem('cv_custom_complaints');
        const list: Complaint[] = stored ? JSON.parse(stored) : [];
        list.unshift(newComplaintRecord);
        localStorage.setItem('cv_custom_complaints', JSON.stringify(list));

        const myTrackings: string[] = JSON.parse(localStorage.getItem('cv_my_tracking_numbers') || '[]');
        if (!myTrackings.includes(trackingCode)) {
          myTrackings.unshift(trackingCode);
          localStorage.setItem('cv_my_tracking_numbers', JSON.stringify(myTrackings));
        }
      } catch (storageError) {
        if (!isSupabaseConfigured) throw new Error('The local demo could not save this complaint in browser storage.');
        console.warn('Complaint saved to Supabase, but local cache update failed:', storageError);
      }

      try {
        if (contact && contact.trim()) {
          notifyComplaintSubmitted(contact, trackingCode, title, name);
        }
        const finalPriority = aiResult?.priority || assignedCategory?.default_priority || 'Medium';
        if (finalPriority === 'High' || aiResult?.involves_minor) {
          notifyCaptainHighPriorityAlert(
            '0917-555-0100',
            trackingCode,
            title,
            'Barangay Hibao-an Sur',
            'High'
          );
        }
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr);
      }
      setSubmittedTracking(trackingCode);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not submit the complaint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in required</h1>
          <p className="text-sm text-slate-500">Sign in or register as a resident before filing a community concern.</p>
          <Link href="/login" className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Barangay Hibao-an Sur Resident Reporting</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File a Community Concern or Complaint
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Your submission is automatically analyzed for priority scoring, checked for minor safety protocols, verified against nearby duplicates, and routed to the assigned official.
        </p>
      </div>

      {submittedTracking ? (
        /* Submission Success Card */
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-md text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Incident Successfully Submitted!</h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
              {savedToDatabase
                ? 'Your concern has been saved in the live database and registered in the Barangay Hibao-an Sur queue.'
                : 'This local demo report is saved in this browser only and is not visible to barangay staff.'}
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 inline-block max-w-sm w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Reference Tracking Number
            </span>
            <span className="text-3xl font-mono font-extrabold text-blue-600 block mt-1 tracking-wider">
              {submittedTracking}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Keep this code to track resolution milestones</p>
          </div>

          <div className="p-3.5 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl text-xs max-w-md mx-auto flex items-center space-x-2 text-left">
            <PhoneCall className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Notification Receipt:</strong> A status log was generated for <strong>{contact || 'your contact'}</strong>.
            </span>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedTracking(null);
                setTitle('');
                setDescription('');
                setAttachedImage(null);
                setImageFileName(null);
                setAiResult(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              Submit Another Report
            </button>
            <a
              href={`/track?id=${submittedTracking}`}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
            >
              Track Real-Time Status →
            </a>
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          {submitError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{submitError}</p>}
          
          {/* STEP 1: Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-sm font-bold text-slate-800">Incident Information</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.assigned_role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Subject / Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Clogged roadside canal causing dirty water overflow"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Detailed Description *</label>
                <button
                  type="button"
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing || !description.trim()}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAnalyzing ? 'Classifying...' : 'Auto-Classify with AI'}</span>
                </button>
              </div>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what occurred, any hazards, landmarks, or affected residents..."
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                🔒 In compliance with the Data Privacy Act (RA 10173), phone numbers and personal names are masked prior to external AI processing.
              </p>
            </div>

            {/* AI Recommendation Box */}
            {aiResult && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Recommendation Pipeline Result</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    aiResult.priority === 'High' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {aiResult.priority} Priority Recommended
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Justification Quote:</strong> {aiResult.justification}
                </p>
                {aiResult.involves_minor && (
                  <div className="flex items-center space-x-1.5 text-purple-700 font-semibold bg-purple-100/80 border border-purple-200 px-2.5 py-1.5 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Minor involvement detected: Automatic SWDO referral protocol activated.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: Photo Attachment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="text-sm font-bold text-slate-800">Photo Evidence (Optional)</h3>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {attachedImage ? (
                <div className="relative inline-block group" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={attachedImage}
                    alt="Uploaded incident evidence"
                    className="max-h-48 rounded-xl border border-slate-200 shadow-sm mx-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedImage(null);
                      setImageFileName(null);
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">{imageFileName}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Drag & drop an incident photo here, or <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, or JPEG up to 5MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Location Pin on Leaflet Map */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="text-sm font-bold text-slate-800">Pin Incident Location</h3>
              </div>
              <span className="text-xs text-blue-700 font-mono font-semibold bg-blue-50 px-2 py-0.5 rounded">
                {selectedPin[0].toFixed(4)}° N, {selectedPin[1].toFixed(4)}° E
              </span>
            </div>

            <div className="h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <LeafletMap
                center={[10.7314, 122.5228]}
                zoom={15}
                selectedLocation={selectedPin}
                interactiveSelect={true}
                onSelectLocation={(lat, lng) => setSelectedPin([lat, lng])}
              />
            </div>

            <p className="text-[11px] text-slate-500 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Click anywhere on the map of Barangay Hibao-an Sur to adjust the pin location.</span>
            </p>

            {/* LIVE PROXIMITY DUPLICATE ALERT BANNER */}
            {duplicateAlert.isDuplicateFound && duplicateAlert.matchedComplaint && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 space-y-2 animate-in fade-in">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                    <span>Potential Duplicate Incident Nearby ({duplicateAlert.distanceMeters}m away)</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono text-[10px] font-bold">
                    {duplicateAlert.matchedComplaint.tracking_number}
                  </span>
                </div>

                <p className="text-amber-800 text-xs leading-relaxed">
                  <strong>Existing Active Report:</strong> &ldquo;{duplicateAlert.matchedComplaint.title}&rdquo; is already logged approximately <strong>{duplicateAlert.distanceMeters} meters</strong> from this location.
                </p>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-amber-700">
                    Current Status: <strong className="uppercase">{duplicateAlert.matchedComplaint.status}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewingExistingComplaint(duplicateAlert.matchedComplaint)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-amber-900 hover:text-amber-950 underline underline-offset-2"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Existing Incident Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Complainant Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
              <h3 className="text-sm font-bold text-slate-800">Contact & Notification Preference</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz (Optional / Anonymous)"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Contact Number (For SMS)</label>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="0917-123-4567"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Proximity Warning Summary before submit button if duplicate alert is active */}
          {duplicateAlert.isDuplicateFound && duplicateAlert.matchedComplaint && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Note:</strong> A similar report exists nearby. You will be prompted to confirm if your report is distinct before filing.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 ${
              duplicateAlert.isDuplicateFound
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {duplicateAlert.isDuplicateFound ? (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>{isSubmitting ? 'Evaluating Submission...' : 'Review & Submit Report (Proximity Check)'}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving to Database...' : 'Submit Report to Barangay Hibao-an Sur'}</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* MODAL 1: PRE-SUBMISSION DUPLICATE WARNING MODAL */}
      {showDuplicateModal && duplicateAlert.matchedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Similar Incident Already Reported Nearby</h3>
                <p className="text-xs text-slate-500">Proximity & Duplicate Incident Safeguard</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Our automated geospatial check found an active complaint registered within <strong>{duplicateAlert.distanceMeters} meters</strong> of your pinned location. Submitting multiple reports for the same incident may delay emergency and tanod crew dispatch.
            </p>

            {/* Existing Complaint Details Card */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                  Ref: {duplicateAlert.matchedComplaint.tracking_number}
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Status: {duplicateAlert.matchedComplaint.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">{duplicateAlert.matchedComplaint.title}</h4>
                <p className="text-slate-600 text-xs mt-1 line-clamp-2">{duplicateAlert.matchedComplaint.description}</p>
              </div>

              <div className="pt-2 border-t border-amber-200/60 text-[11px] text-slate-500 space-y-1">
                <p>📍 <strong>Distance:</strong> Approx. {duplicateAlert.distanceMeters} meters away</p>
                {duplicateAlert.matchedComplaint.assigned_to && (
                  <p>👤 <strong>Assigned To:</strong> {duplicateAlert.matchedComplaint.assigned_to}</p>
                )}
                <p>📅 <strong>Date Reported:</strong> {new Date(duplicateAlert.matchedComplaint.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="space-y-2 pt-2">
              <a
                href={`/track?id=${duplicateAlert.matchedComplaint.tracking_number}`}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Track Existing Case ({duplicateAlert.matchedComplaint.tracking_number}) Instead</span>
              </a>

              <button
                type="button"
                onClick={() => executeSubmission(true)}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center space-x-1"
              >
                <span>Submit Anyway (This is a Distinct / Separate Incident)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDuplicateModal(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium text-xs text-center"
              >
                Go Back & Adjust Pin / Description
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PREVIEW OF EXISTING NEARBY COMPLAINT */}
      {previewingExistingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-600">{previewingExistingComplaint.tracking_number}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {previewingExistingComplaint.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingExistingComplaint(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="text-base font-bold text-slate-900">{previewingExistingComplaint.title}</h3>
              <p className="text-slate-600 leading-relaxed">{previewingExistingComplaint.description}</p>
              
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px] text-slate-600 mt-2">
                <p>📍 <strong>Location:</strong> {previewingExistingComplaint.location_address}</p>
                <p>⚡ <strong>Priority:</strong> {previewingExistingComplaint.priority}</p>
                {previewingExistingComplaint.assigned_to && (
                  <p>👤 <strong>Handling Official:</strong> {previewingExistingComplaint.assigned_to}</p>
                )}
                <p>📅 <strong>Filed:</strong> {new Date(previewingExistingComplaint.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between gap-2">
              <a
                href={`/track?id=${previewingExistingComplaint.tracking_number}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-1"
              >
                <span>Full Tracking Page</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewingExistingComplaint(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
