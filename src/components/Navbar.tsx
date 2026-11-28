'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Search, 
  PlusCircle, 
  LayoutDashboard, 
  Bell, 
  Menu,
  X,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getStoredSmsLogs, DispatchedSms } from '@/lib/smsService';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [smsLogs, setSmsLogs] = useState<DispatchedSms[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<string | null>(null);

  useEffect(() => {
    const syncTabFromUrl = () => {
      setActiveAdminTab(new URLSearchParams(window.location.search).get('tab'));
    };
    const handleTabChange = (event: Event) => {
      setActiveAdminTab((event as CustomEvent<string>).detail || null);
    };

    syncTabFromUrl();
    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('cv_admin_tab_change', handleTabChange);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('cv_admin_tab_change', handleTabChange);
    };
  }, []);

  useEffect(() => {
    setSmsLogs(getStoredSmsLogs());
    const handler = () => setSmsLogs(getStoredSmsLogs());
    window.addEventListener('cv_sms_updated', handler);
    return () => window.removeEventListener('cv_sms_updated', handler);
  }, []);

  const isLiveSms = process.env.NEXT_PUBLIC_SMS_MODE === 'live';

  const isStaffOrOfficial = Boolean(
    user && (user.role === 'staff' || user.role === 'official' || user.role === 'admin')
  );

  const navLinks = isStaffOrOfficial
    ? [
        { href: '/admin/dashboard', label: 'Barangay Portal', icon: LayoutDashboard },
        { href: '/admin/dashboard?tab=complaints', label: 'Complaints', icon: Search },
        { href: '/admin/dashboard?tab=certificates', label: 'Requests', icon: FileText },
        { href: '/map', label: 'Incident Map', icon: MapPin },
      ]
    : user
      ? [
          { href: '/', label: 'Community Overview', icon: Building2 },
          { href: '/resident/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { href: '/track', label: 'My Complaints', icon: Search },
          { href: '/certificates', label: 'My Requests', icon: FileText },
          { href: '/report', label: 'File Concern', icon: PlusCircle },
        ]
      : [
          { href: '/', label: 'Community Overview', icon: Building2 },
        ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Gov Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="truncate">Republic of the Philippines • City of Iloilo • <strong>Barangay Hibao-an Sur</strong></span>
        </div>

        {/* User Identity / Role pill */}
        <div className="flex items-center space-x-3 text-[11px] shrink-0 ml-2">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 hidden sm:inline">Signed in as:</span>
              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                user.role === 'official' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                user.role === 'staff' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {user.role} ({user.full_name})
              </span>
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to log out?')) return;
                  await logout();
                  router.replace('/login');
                  router.refresh();
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 pl-1"
                title="Sign Out"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-blue-300 hover:text-white font-medium flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 shrink-0">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-blue-500/20 shrink-0 border border-blue-500/30">
            <Image
              src="/logo.png"
              alt="CommunityVoice Logo"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-1.5 whitespace-nowrap">
              CommunityVoice
              {isStaffOrOfficial && (
                <span className="text-[10px] font-semibold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Staff</span>
              )}
            </span>
            <p className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">Hibao-an Sur Feedback & Routing</p>
          </div>
        </Link>

        {/* Desktop Links (1-line guaranteed with whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const tab = new URLSearchParams(link.href.split('?')[1] || '').get('tab');
            const isActive = isStaffOrOfficial && pathname === '/admin/dashboard'
              ? tab ? activeAdminTab === tab : !activeAdminTab
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setActiveAdminTab(tab);
                  if (tab) window.dispatchEvent(new CustomEvent('cv_admin_tab_change', { detail: tab }));
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs xl:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 relative"
              title="SMS & In-app Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Semaphore SMS Gateway Outbox</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLiveSms 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {isLiveSms ? 'Live Gateway Active' : 'Simulation Mode'}
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-1">
                  {smsLogs.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No SMS notifications sent yet.
                    </div>
                  ) : (
                    smsLogs.map((sms) => (
                      <div key={sms.id} className="py-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-900 font-mono">
                            📱 {sms.recipient}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] uppercase ${
                            sms.status === 'Sent (Live)'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sms.status}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                          {sms.message}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>{sms.refNumber ? `Ref: ${sms.refNumber}` : (sms.recipientName || 'Alert')}</span>
                          <span>{new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  Real SMS cellular dispatch powered by Semaphore API Philippines
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          {!isStaffOrOfficial && (
            <Link
              href="/report"
              className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-all shadow-blue-500/20 whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Report Concern</span>
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const tab = new URLSearchParams(link.href.split('?')[1] || '').get('tab');
            const isActive = isStaffOrOfficial && pathname === '/admin/dashboard'
              ? tab ? activeAdminTab === tab : !activeAdminTab
              : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveAdminTab(tab);
                  if (tab) window.dispatchEvent(new CustomEvent('cv_admin_tab_change', { detail: tab }));
                }}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
