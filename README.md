# CommunityVoice

> **An AI-Powered Smart Community Feedback and Complaint Management System with Priority Scoring for Automated Routing**  
> *Official Pilot: Barangay Hibao-an Sur, Mandurriao, Iloilo City, Philippines*  
> *Developed for IT 311 Project Management — University of San Agustin*

---

## 🌟 Overview

**CommunityVoice** bridges the communication gap between citizens and local barangay administration. It replaces slow, paper-based logbooks with an intelligent, transparent web platform featuring:

* **Citizen Incident & Complaint Filing:** Report community hazards (road potholes, broken streetlights, clogged canals, peace and order) with photos and interactive GPS map pins.
* **AI-Assisted Classification & Priority Scoring:** FastAPI microservice using OpenAI models with strict anti-hallucination guardrails and evidence-based justifications.
* **Child Protection (SWDO Protocol):** Automatic priority escalation and referral logging for incidents involving minors.
* **Barangay Certification Requests:** Online application and status tracking (`Pending` → `For Approval` → `Ready for Pickup` → `Released`) for Barangay ID, Certificate of Indigency, and Certificate of Residency.
* **Electronic Blotter Logbook:** Secure, digital incident registry replacing manual paper blotters in compliance with the Data Privacy Act of 2012 (RA 10173).
* **Interactive Hotspot & Projects Map:** Interactive Leaflet map with multi-tiered heatmap density halos and barangay infrastructure monitoring.

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
* **Geospatial & Mapping:** Leaflet with OpenStreetMap tiles, custom priority markers, and heatmap visualization
* **Database & Auth:** Supabase (PostgreSQL with PostGIS spatial extension, Row-Level Security)
* **AI Microservice:** Python FastAPI, OpenAI API (`gpt-4o-mini`, `text-embedding-3-small`), PII Sanitizer
* **Notifications:** Semaphore SMS Gateway (Philippine telco integration) & simulated in-app alerts

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** v20+ (v24 LTS recommended)
* **npm** or **pnpm**
* **Python** 3.10+ (for AI microservice)

### 2. Frontend Installation & Local Server

```bash
# Clone the repository
git clone https://github.com/vincee921712/COMMUNITYVOICE.git
cd COMMUNITYVOICE

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL script from `supabase/migrations/20261102000000_init_communityvoice.sql` in the Supabase SQL Editor.
3. Optionally run `supabase/seed.sql` to load demo data for Barangay Hibao-an Sur.

### 4. AI Microservice Setup (Optional)
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env # Add your OPENAI_API_KEY
python main.py
```

---

## 👥 8-Agent Development Architecture

This workspace is coordinated by an 8-agent specialized architecture:
1. **Planner:** Roadmap sequencing, milestones, and task delegation.
2. **UI/UX Designer:** Design system, tokens, and aesthetic shaping via Impeccable.
3. **Frontend (Next.js):** React 19, TypeScript, App Router, and responsive views.
4. **Database & Backend (Supabase):** PostgreSQL schema, PostGIS spatial queries, and RLS policies.
5. **AI Service (FastAPI):** OpenAI pipelines, PII masking, and duplicate detection.
6. **Map (Leaflet):** Geospatial visualizations, marker pins, and heatmaps.
7. **QA & Evaluation:** Playwright E2E browser automation and validation.
8. **Reviewer:** Security audit, code quality, and PR approval.

*See [`AGENTS.md`](./AGENTS.md) for full agent specifications.*

---

## 📄 License & Compliance

Complies with the **Data Privacy Act of 2012 (Republic Act No. 10173)** of the Philippines.  
Academic project for the College of Technology, University of San Agustin.

