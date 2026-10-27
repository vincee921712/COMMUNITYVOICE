'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  PlusCircle, 
  Sparkles, 
  MapPin, 
  AlertTriangle, 
  CheckCircle,
  Upload,
  Image as ImageIcon,
  X,
  FileCheck2,
  Shield,
  PhoneCall
} from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';

const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
      Loading Barangay Hibao-an Sur Map...
    </div>
  ),
});

export default function ReportPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [selectedPin, setSelectedPin] = useState<[number, number]>([10.7314, 122.5228]);
  
  // Image Upload State
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Recommendation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: string;
    priority: string;
    justification: string;
    involves_minor: boolean;
  } | null>(null);

  const [submittedTracking, setSubmittedTracking] = useState<string | null>(null);

  // Handle Image Drop / Upload
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

  // Trigger AI evaluation
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
        throw new Error('API offline');
      }
    } catch {
      // Local fallback classifier
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingCode = `CV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedTracking(trackingCode);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5" />
          <span>Barangay Hibao-an Sur Citizen Reporting Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File a Community Concern or Complaint
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Your submission is automatically analyzed for priority scoring, checked for minor safety protocols, and routed to the assigned official.
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
              Your concern has been registered in the Barangay Hibao-an Sur digital blotter queue.
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
              <strong>Simulated SMS Receipt:</strong> A notification was generated for <strong>{contact || 'your mobile contact'}</strong> with live status updates.
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
          
          {/* STEP 1: Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-sm font-bold text-slate-800">Incident Information</h3>
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Report to Barangay Hibao-an Sur</span>
          </button>
        </form>
      )}
    </div>
  );
}
