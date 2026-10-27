-- =====================================================================
-- COMMUNITYVOICE: Database Schema Migration
-- Locale: Barangay Hibao-an Sur, Mandurriao, Iloilo City
-- Technology: PostgreSQL with PostGIS extension + Row Level Security (RLS)
-- =====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. User Profiles & Roles
-- Roles: resident (default), staff (secretary/clerks), official (Punong Barangay, Kagawads), admin
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT,
    address TEXT DEFAULT 'Barangay Hibao-an Sur, Mandurriao, Iloilo City',
    role TEXT NOT NULL CHECK (role IN ('resident', 'staff', 'official', 'admin')) DEFAULT 'resident',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Predefined Service Categories & Routing Rules
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    default_priority TEXT NOT NULL CHECK (default_priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    assigned_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Predefined Categories matching Barangay Hibao-an Sur Governance
INSERT INTO public.categories (id, name, description, default_priority, assigned_role)
VALUES
    ('sanitation', 'Sanitation and Waste Management', 'Uncollected garbage, drainage blockages, illegal dumping', 'Medium', 'Kagawad on Health & Sanitation'),
    ('peace_order', 'Peace and Order (Blotter)', 'Noise disturbances, street brawls, neighborhood conflicts, curfew violations', 'High', 'Kagawad on Peace & Order'),
    ('infrastructure', 'Infrastructure and Roads', 'Potholes, damaged public facilities, bridge/sidewalk repairs', 'Medium', 'Kagawad on Infrastructure & Public Works'),
    ('utilities', 'Public Utilities (Water, Power, Streetlights)', 'Broken street lamps, busted water pipes, dangling electrical wires', 'High', 'Kagawad on Public Utilities'),
    ('health', 'Health and Sanitation', 'Stagnant water/dengue hazard, animal control, public sanitation concerns', 'Medium', 'Barangay Health Center Staff'),
    ('minors', 'Cases Involving Minors (SWDO Referral)', 'Child welfare concerns, minors out during curfew, disputes involving minors', 'High', 'SWDO Focal Officer & Punong Barangay'),
    ('general', 'General Community Feedback', 'Inquiries, suggestions, general community feedback', 'Low', 'Barangay Secretary')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_priority = EXCLUDED.default_priority,
    assigned_role = EXCLUDED.assigned_role;

-- 4. Complaints & Incident Reports (with PostGIS Spatial Coordinates)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT UNIQUE NOT NULL,
    resident_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_address TEXT DEFAULT 'Hibao-an Sur, Mandurriao, Iloilo City',
    location GEOGRAPHY(POINT, 4326),
    latitude DOUBLE PRECISION NOT NULL DEFAULT 10.7314,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 122.5228,
    category_id TEXT REFERENCES public.categories(id) DEFAULT 'general',
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    status TEXT NOT NULL CHECK (status IN ('Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Submitted',
    
    -- AI Recommendation Fields
    ai_category_id TEXT REFERENCES public.categories(id),
    ai_priority TEXT CHECK (ai_priority IN ('Low', 'Medium', 'High')),
    ai_justification TEXT,
    ai_confidence DOUBLE PRECISION,
    is_staff_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Safeguard Flags
    is_minor_flagged BOOLEAN DEFAULT FALSE,
    is_duplicate_flagged BOOLEAN DEFAULT FALSE,
    duplicate_of_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
    duplicate_similarity_score DOUBLE PRECISION,
    
    -- Assignment & Resolution
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    attachments JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for Spatial Queries (Find nearby complaints)
CREATE INDEX IF NOT EXISTS idx_complaints_location ON public.complaints USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints (priority);

-- 5. Electronic Blotter Logbook (Restricted to Staff/Officials)
CREATE TABLE IF NOT EXISTS public.blotter_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blotter_entry_number TEXT UNIQUE NOT NULL,
    incident_type TEXT NOT NULL,
    incident_date TIMESTAMPTZ NOT NULL,
    incident_location TEXT NOT NULL,
    complainant_name TEXT NOT NULL,
    complainant_contact TEXT,
    respondent_name TEXT,
    narrative TEXT NOT NULL,
    assigned_personnel TEXT,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Under Investigation', 'Referred to SWDO', 'Settled', 'Closed')) DEFAULT 'Active',
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Barangay Certification Requests
-- Document Types: barangay_id, certificate_of_indigency, certificate_of_residency
-- Status Flow: Pending -> For Approval -> Ready for Pickup -> Released
CREATE TABLE IF NOT EXISTS public.certification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_number TEXT UNIQUE NOT NULL,
    resident_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    certificate_type TEXT NOT NULL CHECK (certificate_type IN ('barangay_id', 'certificate_of_indigency', 'certificate_of_residency')),
    purpose TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'For Approval', 'Ready for Pickup', 'Released', 'Rejected')) DEFAULT 'Pending',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_status ON public.certification_requests (status);
CREATE INDEX IF NOT EXISTS idx_cert_resident ON public.certification_requests (resident_id);

-- 7. SWDO Referral Tracking (Cases involving minors)
CREATE TABLE IF NOT EXISTS public.swdo_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    blotter_id UUID REFERENCES public.blotter_records(id) ON DELETE CASCADE,
    case_summary_masked TEXT NOT NULL,
    referral_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    swdo_officer_contacted TEXT,
    action_taken TEXT,
    status TEXT NOT NULL CHECK (status IN ('Referred', 'Intake Conducted', 'Ongoing Case Management', 'Closed')) DEFAULT 'Referred',
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Barangay Community Projects Dashboard
CREATE TABLE IF NOT EXISTS public.barangay_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('Proposed', 'Ongoing', 'Completed', 'On Hold')) DEFAULT 'Proposed',
    budget NUMERIC(12, 2) DEFAULT 0.00,
    start_date DATE,
    target_completion_date DATE,
    location_address TEXT DEFAULT 'Barangay Hibao-an Sur, Iloilo City',
    location GEOGRAPHY(POINT, 4326),
    latitude DOUBLE PRECISION DEFAULT 10.7314,
    longitude DOUBLE PRECISION DEFAULT 122.5228,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tanod Duty Schedules (Staff Encoded)
CREATE TABLE IF NOT EXISTS public.tanod_duty_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    duty_date DATE NOT NULL,
    shift TEXT NOT NULL CHECK (shift IN ('Day Shift (6AM - 2PM)', 'Afternoon Shift (2PM - 10PM)', 'Night Patrol (10PM - 6AM)')),
    tanod_names TEXT[] NOT NULL,
    sector_assigned TEXT NOT NULL,
    encoded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Audit Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- POSTGIS SPATIAL HELPER FUNCTION: Find Nearby Complaints (Duplicate / Clustering)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.find_nearby_complaints(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION DEFAULT 100.0
)
RETURNS TABLE (
    id UUID,
    tracking_number TEXT,
    title TEXT,
    status TEXT,
    distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id,
        c.tracking_number,
        c.title,
        c.status,
        ST_Distance(
            c.location,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM public.complaints c
    WHERE c.location IS NOT NULL
      AND ST_DWithin(
          c.location,
          ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
          p_radius_meters
      )
    ORDER BY distance_meters ASC;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blotter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swdo_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangay_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tanod_duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Is Staff or Official?
CREATE OR REPLACE FUNCTION public.is_staff_or_official(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('staff', 'official', 'admin')
    );
$$;

-- 1. Profiles RLS
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_staff_or_official(auth.uid()));

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Complaints RLS
CREATE POLICY "Residents can view their own complaints; Staff/Officials view all"
    ON public.complaints FOR SELECT
    USING (auth.uid() = resident_id OR public.is_staff_or_official(auth.uid()));

CREATE POLICY "Residents can insert complaints"
    ON public.complaints FOR INSERT
    WITH CHECK (auth.uid() = resident_id);

CREATE POLICY "Staff and Officials can update complaints"
    ON public.complaints FOR UPDATE
    USING (public.is_staff_or_official(auth.uid()));

-- 3. Blotter Records RLS (Confidential: Staff & Officials Only)
CREATE POLICY "Only Staff and Officials can view blotter records"
    ON public.blotter_records FOR SELECT
    USING (public.is_staff_or_official(auth.uid()));

CREATE POLICY "Only Staff and Officials can modify blotter records"
    ON public.blotter_records FOR ALL
    USING (public.is_staff_or_official(auth.uid()));

-- 4. Certification Requests RLS
CREATE POLICY "Residents can view their own requests; Staff/Officials view all"
    ON public.certification_requests FOR SELECT
    USING (auth.uid() = resident_id OR public.is_staff_or_official(auth.uid()));

CREATE POLICY "Residents can submit certification requests"
    ON public.certification_requests FOR INSERT
    WITH CHECK (auth.uid() = resident_id);

CREATE POLICY "Staff and Officials can update certification requests"
    ON public.certification_requests FOR UPDATE
    USING (public.is_staff_or_official(auth.uid()));

-- 5. Projects & Schedules RLS (Public Read for Transparency)
CREATE POLICY "Anyone authenticated can view community projects"
    ON public.barangay_projects FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and Officials manage projects"
    ON public.barangay_projects FOR ALL
    USING (public.is_staff_or_official(auth.uid()));

CREATE POLICY "Staff and Officials manage duty schedules"
    ON public.tanod_duty_schedules FOR ALL
    USING (public.is_staff_or_official(auth.uid()));

