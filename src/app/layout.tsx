import type { Metadata } from 'next';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CommunityVoice - Barangay Hibao-an Sur',
  description: 'An AI-Powered Smart Community Feedback and Complaint Management System with Priority Scoring for Automated Routing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-semibold text-slate-200">CommunityVoice: Smart Community Feedback & Complaint Management System</p>
              <p className="text-slate-400 mt-1">Official Pilot: Barangay Hibao-an Sur, Mandurriao, Iloilo City • IT 311 Project</p>
            </div>
            <div className="text-right text-slate-400">
              <p>In compliance with the Data Privacy Act of 2012 (RA 10173)</p>
              <p className="text-[11px] text-slate-400 mt-1">Powered by Next.js, Supabase PostGIS, FastAPI & Leaflet</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
