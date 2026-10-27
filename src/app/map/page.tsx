'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  MapPin, 
  Filter, 
  Layers, 
  Flame, 
  Navigation, 
  Eye, 
  Building2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_COMPLAINTS, INITIAL_PROJECTS, CATEGORIES } from '@/lib/mockData';

const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
      Loading Interactive Community Map...
    </div>
  ),
});

export default function MapPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showProjects, setShowProjects] = useState<boolean>(true);
  const [layerMode, setLayerMode] = useState<'all' | 'markers' | 'heatmap'>('all');
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.7314, 122.5228]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  // Quick jump zones in Barangay Hibao-an Sur
  const quickZones = [
    { label: 'Barangay Hall (Center)', coords: [10.7314, 122.5228] as [number, number], zoom: 16 },
    { label: 'Zone 1 (Purok Narra)', coords: [10.7328, 122.5220] as [number, number], zoom: 16 },
    { label: 'Zone 2 (Canal Area)', coords: [10.7318, 122.5210] as [number, number], zoom: 16 },
    { label: 'Zone 3 (Court / Utilities)', coords: [10.7325, 122.5235] as [number, number], zoom: 16 },
    { label: 'Zone 4 (Perimeter)', coords: [10.7305, 122.5242] as [number, number], zoom: 16 },
  ];

  // Filter complaints
  const filteredComplaints = INITIAL_COMPLAINTS.filter((c) => {
    if (selectedCategory !== 'all' && c.category_id !== selectedCategory) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Geospatial Intelligence • Barangay Hibao-an Sur</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Incident & Heatmap Analytics
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Visualize recurring complaints, high-density hotspots, and public community investments in real time.
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
              <option value="High">🔴 High Priority (Immediate Action)</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>
        </div>

        {/* Right: Layer Mode Switches (Heatmap vs Markers) */}
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
              onClick={() => setLayerMode('heatmap')}
              className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                layerMode === 'heatmap' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Heatmap Only</span>
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
          </div>

          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-semibold select-none">
            <input
              type="checkbox"
              checked={showProjects}
              onChange={(e) => setShowProjects(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>Show Projects</span>
          </label>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="h-[620px] rounded-3xl overflow-hidden border border-slate-200 shadow-md">
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          complaints={filteredComplaints}
          projects={showProjects ? INITIAL_PROJECTS : []}
          layerMode={layerMode}
        />
      </div>

      {/* Map Legend & Insights Footer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Legend */}
        <div className="md:col-span-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow"></span>
            <span>High Priority (Safety / SWDO Minors)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow"></span>
            <span>Medium Priority (Drainage / Roads)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow"></span>
            <span>Low (General Suggestions)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-4 h-4 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">P</span>
            <span>Barangay Infrastructure Project</span>
          </div>
        </div>

        {/* Hotspot Insight Note */}
        <div className="md:col-span-4 bg-orange-50 border border-orange-200 p-4 rounded-2xl text-xs text-orange-950 flex items-start space-x-2">
          <Flame className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Hotspot Density:</strong> Warmer red/orange circles indicate higher frequency and severity of complaints. Officials can use this pattern to target proactive inspections.
          </p>
        </div>
      </div>
    </div>
  );
}
