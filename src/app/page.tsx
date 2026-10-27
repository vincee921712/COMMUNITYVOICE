'use client';

import React from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Search, 
  FileText, 
  MapPin, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { INITIAL_COMPLAINTS, INITIAL_PROJECTS } from '@/lib/mockData';

// Dynamically import Leaflet Map with no SSR
const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
      Loading Barangay Hibao-an Sur Map...
    </div>
  ),
});

export default function HomePage() {
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>AI-Assisted Community Governance Platform</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              A responsive, transparent Barangay for every resident of <span className="text-blue-300">Hibao-an Sur</span>.
            </h1>
            
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
              Report public hazards, request official barangay documents, and track issues in real-time. 
              Submissions are analyzed with AI priority scoring and routed directly to the responsible official.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/report"
                className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Complaint / Concern</span>
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-5 py-3 rounded-xl backdrop-blur transition-all text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Track Tracking #</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics / Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200">System Highlights</h3>
            
            <div className="grid grid-cols-2 gap-3 text-slate-100">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <span className="text-2xl font-bold text-emerald-400">100%</span>
                <p className="text-xs text-slate-300 mt-0.5">Digital Transparency</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <span className="text-2xl font-bold text-amber-400">&lt; 24h</span>
                <p className="text-xs text-slate-300 mt-0.5">High-Priority Routing</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <span className="text-2xl font-bold text-blue-300">FastAPI</span>
                <p className="text-xs text-slate-300 mt-0.5">AI Classification</p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10">
                <span className="text-2xl font-bold text-purple-300">SWDO</span>
                <p className="text-xs text-slate-300 mt-0.5">Minor Protection Flag</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-300 border-t border-white/10 flex items-center justify-between">
              <span>Privacy protected under RA 10173</span>
              <span className="text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Staff Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Barangay Citizen Services</h2>
          <p className="text-slate-600 text-sm mt-1">Convenient online services without waiting in long queues at the barangay hall.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: File Incident */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Report an Incident or Concern</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Report broken streetlights, clogged canals, stray animals, or public disturbances with photos and GPS map pin.
              </p>
            </div>
            <Link 
              href="/report" 
              className="mt-6 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 gap-1"
            >
              <span>Submit Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: Request Certificate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Request Barangay Documents</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Apply online for Barangay ID, Certificate of Indigency, or Residency. Track approval directly from Punong Barangay.
              </p>
            </div>
            <Link 
              href="/certificates" 
              className="mt-6 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 gap-1"
            >
              <span>Request Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Interactive Map */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Interactive Community Map</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                View ongoing infrastructure projects, reported hotspots, and resolution progress across Hibao-an Sur.
              </p>
            </div>
            <Link 
              href="/map" 
              className="mt-6 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 gap-1"
            >
              <span>Open Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Map Snapshot & Ongoing Projects Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Barangay Hibao-an Sur Live Map Snapshot</h3>
              <p className="text-slate-500 text-xs">Incident reports and ongoing public works in our community.</p>
            </div>
            <Link
              href="/map"
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg self-start sm:self-auto transition-colors"
            >
              Expand Full Map →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 h-[380px]">
              <LeafletMap 
                center={[10.7314, 122.5228]} 
                zoom={15} 
                complaints={INITIAL_COMPLAINTS} 
                projects={INITIAL_PROJECTS} 
              />
            </div>

            {/* Projects List Preview */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Community Projects</h4>
              <div className="space-y-2.5">
                {INITIAL_PROJECTS.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-slate-800">{p.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-slate-500 line-clamp-2">{p.description}</p>
                    <p className="text-[11px] font-medium text-slate-700">Budget: ₱{p.budget.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

