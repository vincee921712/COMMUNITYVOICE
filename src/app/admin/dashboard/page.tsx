'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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
  RefreshCw,
  MapPin,
  BarChart3,
  Download,
  Printer,
  PieChart,
  FileSpreadsheet,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_BLOTTER, 
  INITIAL_CERTIFICATES, 
  INITIAL_TANOD_SCHEDULE,
  INITIAL_PROJECTS,
  CATEGORIES 
} from '@/lib/mockData';
import { Complaint, CertificateRequest, BlotterRecord, BarangayProject, TanodSchedule } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const LeafletMap = dynamic(() => import('@/components/Map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
      Loading Interactive Project Location Picker...
    </div>
  ),
});

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'complaints' | 'blotter' | 'certificates' | 'projects' | 'tanod' | 'analytics'>('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [certificates, setCertificates] = useState<CertificateRequest[]>(INITIAL_CERTIFICATES);
  const [blotterRecords, setBlotterRecords] = useState<BlotterRecord[]>(INITIAL_BLOTTER);
  const [projects, setProjects] = useState<BarangayProject[]>(INITIAL_PROJECTS);
  const [tanodSchedules, setTanodSchedules] = useState<TanodSchedule[]>(INITIAL_TANOD_SCHEDULE);
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

  // Tanod Schedule Encoder & Dispatch State
  const [showTanodForm, setShowTanodForm] = useState(false);
  const [dutyDate, setDutyDate] = useState(new Date().toISOString().split('T')[0]);
  const [dutyShift, setDutyShift] = useState<'Night Patrol (10PM - 6AM)' | 'Afternoon Shift (2PM - 10PM)' | 'Day Shift (6AM - 2PM)'>('Night Patrol (10PM - 6AM)');
  const [dutySector, setDutySector] = useState('Zone 1 & Zone 2 (Main Access Roads)');
  const [tanodNamesInput, setTanodNamesInput] = useState('Tanod Roberto Perez, Tanod Danilo Alunan');
  const [isSubmittingTanod, setIsSubmittingTanod] = useState(false);
  const [activeDispatchFilter, setActiveDispatchFilter] = useState<'All' | 'Night Patrol' | 'Afternoon Shift' | 'Day Shift'>('All');

  // Barangay Projects Form State
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState(50000);
  const [projectStatus, setProjectStatus] = useState<'Proposed' | 'Ongoing' | 'Completed' | 'On Hold'>('Ongoing');
  const [projectZone, setProjectZone] = useState('Zone 1');
  const [projectPin, setProjectPin] = useState<[number, number]>([10.7314, 122.5228]);
  const [projectStartDate, setProjectStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectTargetDate, setProjectTargetDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 1000).toISOString().split('T')[0]);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

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

  // Load projects from localStorage and Supabase
  useEffect(() => {
    async function fetchProjects() {
      let combined: BarangayProject[] = [...INITIAL_PROJECTS];

      try {
        const stored = localStorage.getItem('cv_custom_projects');
        if (stored) {
          const locals: BarangayProject[] = JSON.parse(stored);
          combined = [...locals, ...combined];
        }
      } catch (err) {
        console.warn('Could not read local projects:', err);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('barangay_projects')
            .select('*')
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            const existing = new Set(data.map(d => d.title));
            const filtered = combined.filter(p => !existing.has(p.title));
            combined = [...(data as BarangayProject[]), ...filtered];
          }
        } catch (err) {
          console.warn('Could not fetch projects from Supabase:', err);
        }
      }

      setProjects(combined);
    }

    fetchProjects();
  }, []);

  // Load Tanod Schedules from localStorage and Supabase
  useEffect(() => {
    async function fetchTanodSchedules() {
      let combined: TanodSchedule[] = [...INITIAL_TANOD_SCHEDULE];

      try {
        const stored = localStorage.getItem('cv_custom_tanod');
        if (stored) {
          const locals: TanodSchedule[] = JSON.parse(stored);
          combined = [...locals, ...combined];
        }
      } catch (err) {
        console.warn('Could not read local tanod schedules:', err);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase
            .from('tanod_duty_schedules')
            .select('*')
            .order('duty_date', { ascending: false });

          if (data && data.length > 0) {
            const existing = new Set(data.map(d => `${d.duty_date}_${d.shift}_${d.sector_assigned}`));
            const filtered = combined.filter(ts => !existing.has(`${ts.duty_date}_${ts.shift}_${ts.sector_assigned}`));
            combined = [...(data as TanodSchedule[]), ...filtered];
          }
        } catch (err) {
          console.warn('Could not fetch tanod schedules from Supabase:', err);
        }
      }

      setTanodSchedules(combined);
    }

    fetchTanodSchedules();
  }, []);

  // Handle Tanod Schedule Creation & Patrol Dispatch
  const handleTanodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTanod(true);

    const names = tanodNamesInput
      .split(',')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    const newSchedule: TanodSchedule = {
      id: `ts-${Date.now()}`,
      duty_date: dutyDate,
      shift: dutyShift,
      tanod_names: names.length > 0 ? names : ['Barangay Tanod On-Duty'],
      sector_assigned: dutySector
    };

    // 1. Save to local storage
    try {
      const stored = localStorage.getItem('cv_custom_tanod');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newSchedule);
      localStorage.setItem('cv_custom_tanod', JSON.stringify(list));
    } catch (err) {
      console.warn('Local storage write tanod error:', err);
    }

    // 2. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('tanod_duty_schedules').insert({
          duty_date: dutyDate,
          shift: dutyShift,
          tanod_names: names.length > 0 ? names : ['Barangay Tanod On-Duty'],
          sector_assigned: dutySector
        });
      } catch (err) {
        console.warn('Supabase tanod insert warning:', err);
      }
    }

    setTanodSchedules([newSchedule, ...tanodSchedules]);
    setSuccessBanner(`Patrol duty schedule encoded and dispatched for ${dutySector} (${dutyShift})!`);
    setShowTanodForm(false);
    setIsSubmittingTanod(false);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Handle New Project Creation
  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProject(true);

    const newProject: BarangayProject = {
      id: `proj-${Date.now()}`,
      title: projectTitle,
      description: projectDescription,
      status: projectStatus,
      budget: Number(projectBudget),
      start_date: projectStartDate,
      target_completion_date: projectTargetDate,
      location_address: `${projectZone}, Hibao-an Sur, Mandurriao, Iloilo City`,
      latitude: projectPin[0],
      longitude: projectPin[1]
    };

    // 1. Save to localStorage
    try {
      const stored = localStorage.getItem('cv_custom_projects');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newProject);
      localStorage.setItem('cv_custom_projects', JSON.stringify(list));
    } catch (err) {
      console.warn('Local storage write project error:', err);
    }

    // 2. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('barangay_projects').insert({
          title: projectTitle,
          description: projectDescription,
          status: projectStatus,
          budget: Number(projectBudget),
          start_date: projectStartDate,
          target_completion_date: projectTargetDate,
          location_address: `${projectZone}, Hibao-an Sur, Mandurriao, Iloilo City`,
          latitude: projectPin[0],
          longitude: projectPin[1]
        });
      } catch (err) {
        console.warn('Supabase project insert warning:', err);
      }
    }

    setProjects([newProject, ...projects]);
    setSuccessBanner(`Community Project "${projectTitle}" published! Now visible to citizens on Homepage and Incident Map.`);
    setShowProjectForm(false);
    setProjectTitle('');
    setProjectDescription('');
    setProjectBudget(50000);
    setIsSubmittingProject(false);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

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

  // Export Report as CSV (Compatible with Excel)
  const handleExportCSV = () => {
    const headers = ['Tracking Number', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Date Reported'];
    const rows = complaints.map(c => [
      `"${c.tracking_number}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${CATEGORIES.find(cat => cat.id === (c.ai_category_id || c.category_id))?.name || c.category_id}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.assigned_to || 'Unassigned'}"`,
      `"${new Date(c.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CommunityVoice_Council_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessBanner('Official CSV Monthly Report exported successfully for Council review!');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Export Report as Printable Council Summary (PDF Preview)
  const handlePrintReport = () => {
    window.print();
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

  // RBAC Access Control Guard
  if (!authLoading && (!user || (user.role !== 'staff' && user.role !== 'official' && user.role !== 'admin'))) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Restricted Barangay Staff Portal</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Access to the complaint routing engine, electronic blotter, and administrative controls is strictly reserved for authorized Barangay Officials, Tanods, and Staff.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200">
            Currently logged in as: <strong className="text-slate-800">{user?.full_name || 'Guest / Resident'}</strong> ({user?.role || 'resident'})
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              Sign In as Barangay Staff / Captain
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Return to Citizen Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'projects' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Community Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('tanod')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'tanod' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patrol Dispatch & Tanod ({tanodSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analytics & Reports
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

      {/* TAB 4: BARANGAY COMMUNITY PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Community Infrastructure & Public Works Projects</h3>
              <p className="text-xs text-slate-500">
                Official development programs in Barangay Hibao-an Sur. Automatically plotted on the Citizen Incident Map.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {showProjectForm ? 'Cancel Project' : '+ Add New Barangay Project'}
            </button>
          </div>

          {/* New Project Encoder Form */}
          {showProjectForm && (
            <form onSubmit={handleProjectSubmit} className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-600" />
                  Encode New Barangay Project / Public Works
                </span>
                <span className="text-[10px] text-blue-600 font-mono">Barangay Hibao-an Sur Development Fund</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Solar LED Streetlights Phase 2"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Sector / Zone *</label>
                  <select
                    value={projectZone}
                    onChange={(e) => setProjectZone(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Zone 1">Zone 1 (Purok Narra / Main Road)</option>
                    <option value="Zone 2">Zone 2 (Drainage / Central Pathway)</option>
                    <option value="Zone 3">Zone 3 (Near Covered Court & Hall)</option>
                    <option value="Zone 4">Zone 4 (Outer Subdivision Boundary)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget Allocation (PHP ₱) *</label>
                  <input
                    type="number"
                    required
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(Number(e.target.value))}
                    placeholder="e.g. 150000"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Status *</label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Proposed">Proposed (Under Council Review)</option>
                    <option value="Ongoing">Ongoing (Construction / In-Progress)</option>
                    <option value="Completed">Completed (Turned Over)</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={projectTargetDate}
                    onChange={(e) => setProjectTargetDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Scope & Description *</label>
                <textarea
                  required
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Provide scope details, contractor/committee in charge, and expected impact on residents."
                  className="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Exact Location Pin Picker */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Exact Project Site on Barangay Map (Click to pinpoint)
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                    Lat: {projectPin[0].toFixed(4)}, Lng: {projectPin[1].toFixed(4)}
                  </span>
                </div>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <LeafletMap
                    center={projectPin}
                    zoom={16}
                    interactiveSelect={true}
                    selectedLocation={projectPin}
                    onSelectLocation={(lat, lng) => setProjectPin([lat, lng])}
                    projects={projects}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Tip: Click directly on the road or purok on the map where the project construction or maintenance will happen.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProject}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmittingProject ? 'Publishing Project...' : 'Publish Project to Map & Portal'}
                </button>
              </div>
            </form>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {projects.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                    <span className="text-[11px] text-slate-500">{p.location_address}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] shrink-0 ${
                    p.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <p className="text-slate-600 line-clamp-2">{p.description}</p>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-800">
                    Budget: <strong className="text-blue-700 font-bold">₱{Number(p.budget).toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-500">
                    Target: {p.target_completion_date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TANOD SCHEDULES & PATROL DISPATCH BOARD */}
      {activeTab === 'tanod' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Barangay Tanod Patrol Dispatch & Duty Board</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage patrol sector assignments, nighttime curfew monitoring, and emergency response personnel for Hibao-an Sur.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowTanodForm(!showTanodForm)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                {showTanodForm ? 'Cancel Form' : '+ Assign Patrol Shift'}
              </button>
            </div>
          </div>

          {/* Quick Patrol Coverage Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Night Patrol Coverage</span>
              <span className="text-xl font-extrabold text-indigo-950">
                {tanodSchedules.filter(t => t.shift.includes('Night')).length} Scheduled Shifts
              </span>
              <p className="text-[11px] text-indigo-600">Active Curfew (10PM - 6AM) Enforcement</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Tanod Personnel</span>
              <span className="text-xl font-extrabold text-emerald-950">
                {Array.from(new Set(tanodSchedules.flatMap(t => t.tanod_names))).length} Active Officers
              </span>
              <p className="text-[11px] text-emerald-600">Barangay Public Safety Officers (BPSO)</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Sectors Monitored</span>
              <span className="text-xl font-extrabold text-amber-950">Zones 1, 2, 3 & 4</span>
              <p className="text-[11px] text-amber-600">Mandurriao District Coordination</p>
            </div>
          </div>

          {/* Patrol Shift Encoder Form */}
          {showTanodForm && (
            <form onSubmit={handleTanodSubmit} className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Encode Patrol Shift & Tanod Roster
                </span>
                <span className="text-[10px] text-blue-600 font-mono">BPSO Operations • Hibao-an Sur</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duty Date *</label>
                  <input
                    type="date"
                    required
                    value={dutyDate}
                    onChange={(e) => setDutyDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patrol Shift Period *</label>
                  <select
                    value={dutyShift}
                    onChange={(e) => setDutyShift(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Night Patrol (10PM - 6AM)">Night Patrol (10PM - 6AM) • Curfew & Security</option>
                    <option value="Afternoon Shift (2PM - 10PM)">Afternoon Shift (2PM - 10PM) • Traffic & School Patrol</option>
                    <option value="Day Shift (6AM - 2PM)">Day Shift (6AM - 2PM) • Barangay Center & Outpost</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Sector & Area Assigned *</label>
                  <select
                    value={dutySector}
                    onChange={(e) => setDutySector(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Zone 1 & Zone 2 (Main Access Roads)">Zone 1 & Zone 2 (Main Access Roads & Purok Narra)</option>
                    <option value="Zone 3 & Health Center Perimeter">Zone 3 & Health Center Perimeter / Covered Court</option>
                    <option value="Zone 4 & Outer Boundary Pathways">Zone 4 & Outer Boundary Pathways / Monterosa area</option>
                    <option value="Barangay Hall Outpost & Public Market Entrance">Barangay Hall Outpost & Public Area Entrance</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned On-Duty Tanod Personnel (Comma-separated names) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tanodNamesInput}
                    onChange={(e) => setTanodNamesInput(e.target.value)}
                    placeholder="e.g. Tanod Roberto Perez, Tanod Danilo Alunan, Tanod Mario Gomez"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Separate names with commas to list each officer individually on the dispatch board.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTanodForm(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTanod}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTanod ? 'Saving Dispatch...' : 'Publish Patrol Shift'}
                </button>
              </div>
            </form>
          )}

          {/* Shift Filter Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Filter Shifts:</span>
              {(['All', 'Night Patrol', 'Afternoon Shift', 'Day Shift'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveDispatchFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeDispatchFilter === filter
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Showing {tanodSchedules.filter(ts => activeDispatchFilter === 'All' || ts.shift.includes(activeDispatchFilter)).length} assignments
            </span>
          </div>

          {/* Tanod Shift Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {tanodSchedules
              .filter(ts => activeDispatchFilter === 'All' || ts.shift.includes(activeDispatchFilter))
              .map((ts) => (
                <div key={ts.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 hover:border-slate-300 transition-all">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block mb-1 ${
                        ts.shift.includes('Night') ? 'bg-indigo-100 text-indigo-800' :
                        ts.shift.includes('Afternoon') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ts.shift}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{ts.sector_assigned}</h4>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                      📅 {ts.duty_date}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Tanod Patrol Team ({ts.tanod_names.length} Officers)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ts.tanod_names.map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[11px] font-medium">
                          <Users className="w-3 h-3 text-slate-400" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                    <span>Dispatch Status: <strong className="text-emerald-700">Active Duty</strong></span>
                    <span>Hibao-an Sur Peace & Order</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      {/* TAB 6: ANALYTICS DASHBOARD & MONTHLY REPORT EXPORT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header & Export Actions Toolbar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Barangay Governance Analytics & Council Reporting</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprehensive performance metrics, category distribution, resolution tracking, and DILG/Sangguniang Barangay export.
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV (Excel)</span>
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* High-Level Council KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Total Recorded Incidents</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{complaints.length + blotterRecords.length}</div>
              <p className="text-[11px] text-slate-400">
                {complaints.length} Online Complaints • {blotterRecords.length} Walk-in Blotters
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">High-Priority Hazard Index</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                {complaints.filter(c => c.priority === 'High').length} Urgent Cases
              </div>
              <p className="text-[11px] text-slate-400">
                Immediate dispatch to Kagawad / BPSO
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Resolution & Routing Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {complaints.length > 0 
                  ? Math.round((complaints.filter(c => c.is_staff_confirmed).length / complaints.length) * 100)
                  : 100}%
              </div>
              <p className="text-[11px] text-slate-400">
                {complaints.filter(c => c.is_staff_confirmed).length} Assigned or Settled
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Document Requests Processed</span>
                <FileCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {certificates.filter(c => c.status === 'Ready for Pickup').length} / {certificates.length}
              </div>
              <p className="text-[11px] text-slate-400">
                Indigency, Residency, Barangay IDs
              </p>
            </div>
          </div>

          {/* Detailed Analytical Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Category Breakdown Progress Bars */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-blue-600" />
                  Incident Volume by Category
                </h4>
                <span className="text-[11px] text-slate-400">Hibao-an Sur Service Portals</span>
              </div>

              <div className="space-y-3 pt-1">
                {CATEGORIES.map(cat => {
                  const count = complaints.filter(c => (c.ai_category_id || c.category_id) === cat.id).length;
                  const percentage = complaints.length > 0 ? Math.round((count / complaints.length) * 100) : 0;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">{cat.name}</span>
                        <span className="text-slate-500 font-mono">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat.id === 'peace_order' ? 'bg-amber-500' :
                            cat.id === 'sanitation' ? 'bg-emerald-500' :
                            cat.id === 'utilities' ? 'bg-indigo-500' :
                            cat.id === 'infrastructure' ? 'bg-cyan-500' :
                            cat.id === 'minors' ? 'bg-rose-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.max(percentage, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority & Safeguards Compliance */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Priority Levels & Citizen Safeguards
                </h4>
                <span className="text-[11px] text-slate-400">RA 10173 & SWDO Protocol</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80">
                  <span className="block text-rose-800 font-extrabold text-xl">
                    {complaints.filter(c => c.priority === 'High').length}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-600">High Priority</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80">
                  <span className="block text-amber-800 font-extrabold text-xl">
                    {complaints.filter(c => c.priority === 'Medium').length}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-600">Medium Priority</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80">
                  <span className="block text-emerald-800 font-extrabold text-xl">
                    {complaints.filter(c => c.priority === 'Low').length}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Low Priority</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                  Special Protocols Logged:
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Minor-Flagged Cases (SWDO Protocol):</span>
                  <strong className="text-rose-600 font-mono">
                    {complaints.filter(c => c.is_minor_flagged).length} Cases
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Duplicate Incident Safeguards Triggered:</span>
                  <strong className="text-blue-600 font-mono">
                    {complaints.filter(c => c.is_duplicate_flagged).length} Cases
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Staff AI Confirmations / Overrides:</span>
                  <strong className="text-emerald-700 font-mono">
                    {complaints.filter(c => c.is_staff_confirmed).length} Reviewed
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sangguniang Barangay Council Summary Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Monthly Incident Log for Council Meeting</h4>
                <p className="text-xs text-slate-500">Official log sheet generated for Punong Barangay & Kagawad review.</p>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                Total Records: {complaints.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Tracking #</th>
                    <th className="py-2.5 px-3">Incident Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Assigned Committee</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{c.tracking_number}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs truncate">{c.title}</td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {CATEGORIES.find(cat => cat.id === (c.ai_category_id || c.category_id))?.name || c.category_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.priority === 'High' ? 'bg-rose-100 text-rose-800' :
                          c.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {c.assigned_to || 'Barangay Staff'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{c.status}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

