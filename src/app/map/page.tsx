'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  MapPin, 
  Filter, 
  Layers, 
  Flame, 
  Eye, 
  Building2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  PlusCircle,
  UserCheck,
  Info
} from 'lucide-react';
import { INITIAL_COMPLAINTS, INITIAL_PROJECTS, CATEGORIES } from '@/lib/mockData';
import { Complaint, BarangayProject } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
      Loading Interactive Community Map...
    </div>
  ),
});

export default function MapPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [projects, setProjects] = useState<BarangayProject[]>(INITIAL_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showProjects, setShowProjects] = useState<boolean>(true);
  const [layerMode, setLayerMode] = useState<'all' | 'markers' | 'heatmap'>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.7314, 122.5228]);
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [myTrackings, setMyTrackings] = useState<string[]>([]);

  // Check if current user is an official or staff member
  const isStaffOrOfficial = Boolean(
    user && (user.role === 'staff' || user.role === 'official' || user.role === 'admin')
  );

  // Load tracking numbers submitted on this device / browser
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

  useEffect(() => {
    async function loadAllComplaints() {
      let combined: Complaint[] = [...INITIAL_COMPLAINTS];

      try {
        const stored = localStorage.getItem('cv_custom_complaints');
        if (stored) {
          const locals: Complaint[] = JSON.parse(stored);
          combined = [...locals, ...combined];
        }
      } catch (e) {
        console.warn('Could not read local complaints', e);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('complaints').select('*');
          if (!error && data && data.length > 0) {
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

    async function loadAllProjects() {
      let combinedProjects: BarangayProject[] = [...INITIAL_PROJECTS];

      try {
        const stored = localStorage.getItem('cv_custom_projects');
        if (stored) {
          const locals: BarangayProject[] = JSON.parse(stored);
          combinedProjects = [...locals, ...combinedProjects];
        }
      } catch (e) {
        console.warn('Could not read local projects', e);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.from('barangay_projects').select('*');
          if (data && data.length > 0) {
            const existing = new Set(data.map(d => d.title));
            const filtered = combinedProjects.filter(p => !existing.has(p.title));
            combinedProjects = [...(data as BarangayProject[]), ...filtered];
          }
        } catch (e) {
          console.warn('Could not fetch projects from Supabase', e);
        }
      }

      setProjects(combinedProjects);
    }

    loadAllComplaints();
    loadAllProjects();
  }, []);

  // Quick jump zones in Barangay Hibao-an Sur
  const quickZones = [
    { label: 'Barangay Hall (Center)', coords: [10.7314, 122.5228] as [number, number], zoom: 16 },
    { label: 'Zone 1 (Purok Narra)', coords: [10.7328, 122.5220] as [number, number], zoom: 16 },
    { label: 'Zone 2 (Canal Area)', coords: [10.7318, 122.5210] as [number, number], zoom: 16 },
    { label: 'Zone 3 (Court / Utilities)', coords: [10.7325, 122.5235] as [number, number], zoom: 16 },
    { label: 'Zone 4 (Perimeter)', coords: [10.7305, 122.5242] as [number, number], zoom: 16 },
  ];

  // RBAC Filter: Residents ONLY see their own complaints; Officials/Staff see all
  const userScopedComplaints = useMemo(() => {
    if (isStaffOrOfficial) {
      return complaints;
    }

    const userName = user?.full_name?.toLowerCase().trim();
    const userPhone = user?.phone_number?.replace(/\D/g, '');

    return complaints.filter((c) => {
      // 1. Matched by tracking codes created by this user
      if (myTrackings.includes(c.tracking_number)) return true;

      // 2. Matched by resident name
      if (userName && c.resident_name && c.resident_name.toLowerCase().trim() === userName) {
        return true;
      }

      // 3. Matched by phone number
      if (userPhone && c.resident_contact) {
        const cleanContact = c.resident_contact.replace(/\D/g, '');
        if (cleanContact === userPhone) return true;
      }

      // 4. Default mock resident Maria Santos owns CV-2026-001
      if (user?.email === 'resident@hibaoan.gov.ph' && c.tracking_number === 'CV-2026-001') {
        return true;
      }

      return false;
    });
  }, [complaints, isStaffOrOfficial, user, myTrackings]);

  // Apply UI category and priority filters
  const filteredComplaints = userScopedComplaints.filter((c) => {
    if (selectedCategory !== 'all' && c.category_id !== selectedCategory) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1 ${
            isStaffOrOfficial
              ? 'text-blue-700 bg-blue-50'
              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
          }`}>
            {isStaffOrOfficial ? (
              <>
                <MapPin className="w-3.5 h-3.5" />
                <span>Geospatial Oversight • Barangay Hibao-an Sur</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Personal Resident Map • RA 10173 Privacy Protected</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isStaffOrOfficial
              ? 'Community Incident & Heatmap Analytics'
              : 'My Transactions & Community Projects Map'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isStaffOrOfficial
              ? 'Full geospatial oversight of all community complaints, recurrence hotspots, and infrastructure projects.'
              : 'View your submitted concerns, track their pin locations, and explore official barangay infrastructure projects.'}
          </p>
        </div>

        {/* Quick Zone Navigator */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <span className="text-[11px] font-semibold text-slate-400 px-2">Jump to:</span>
          {quickZones.map((z) => (
            <button
              key={z.label}
              onClick={() => {
                setMapCenter(z.coords);
                setMapZoom(z.zoom);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition-all text-xs"
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resident Privacy Banner */}
      {!isStaffOrOfficial && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">
                Resident Privacy Protection Active (RA 10173 Data Privacy Act)
              </p>
              <p className="text-emerald-700 text-[11px] mt-0.5">
                To protect citizen confidentiality, this map displays <strong>only your own filed reports</strong> ({userScopedComplaints.length}) and official public barangay projects ({projects.length}). Neighboring dispute reports and private blotters are strictly hidden.
              </p>
            </div>
          </div>
          <Link
            href="/report"
            className="self-start sm:self-center inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>File New Concern</span>
          </Link>
        </div>
      )}

      {/* Control & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Category and Priority Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 bg-slate-50 focus:outline-none cursor-pointer"
            >
              <option value="all">All Service Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
            <span>Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 bg-slate-50 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priority Levels</option>
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>
        </div>

        {/* Right: Layer Mode Switches */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setLayerMode('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                layerMode === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pins & Heatmap</span>
            </button>
            <button
              onClick={() => setLayerMode('markers')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                layerMode === 'markers' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pins Only</span>
            </button>
            {isStaffOrOfficial && (
              <button
                onClick={() => setLayerMode('heatmap')}
                className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                  layerMode === 'heatmap' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Heatmap Only</span>
              </button>
            )}
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-semibold select-none">
            <input
              type="checkbox"
              checked={showProjects}
              onChange={(e) => setShowProjects(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Show Barangay Projects</span>
          </label>
        </div>
      </div>

      {/* Empty State for Residents with No Reports */}
      {!isStaffOrOfficial && filteredComplaints.length === 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              You do not have any active complaints plotted on the map. You can still explore ongoing barangay projects below or submit a new concern.
            </span>
          </div>
          <Link
            href="/report"
            className="text-blue-600 hover:text-blue-800 font-bold underline whitespace-nowrap"
          >
            File a Concern Now →
          </Link>
        </div>
      )}

      {/* Main Map Container */}
      <div className="h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          complaints={filteredComplaints}
          projects={showProjects ? projects : []}
          layerMode={layerMode}
        />
      </div>

      {/* Map Legend & Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Legend */}
        <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow"></span>
            <span>High Priority ({isStaffOrOfficial ? 'Safety / Minors' : 'Your High Priority'})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow"></span>
            <span>Medium Priority ({isStaffOrOfficial ? 'Drainage / Roads' : 'Your Medium Priority'})</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></span>
            <span>Low (General Suggestions)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">P</span>
            <span>Public Barangay Project</span>
          </div>
        </div>

        {/* Hotspot Insight Note */}
        <div className={`md:col-span-4 p-4 rounded-2xl text-xs flex items-start space-x-2 ${
          isStaffOrOfficial
            ? 'bg-orange-50 border border-orange-200 text-orange-950'
            : 'bg-blue-50 border border-blue-200 text-blue-950'
        }`}>
          {isStaffOrOfficial ? (
            <>
              <Flame className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Hotspot Density:</strong> Warmer red/orange circles indicate higher frequency and severity of complaints across Barangay Hibao-an Sur for tanod patrol dispatch.
              </p>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Your Location Pins:</strong> Click on any marker to inspect its tracking reference code and progress status. Other residents cannot view your location data.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
