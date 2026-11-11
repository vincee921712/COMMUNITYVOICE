-- =====================================================================
-- STEP 2: FIX ROW LEVEL SECURITY (RLS) FOR PUBLIC ACCESS & SEED DATA
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/gnzknuscmuwqbfmwoxph/sql
-- =====================================================================

-- 1. Insert Predefined Categories for Barangay Hibao-an Sur
INSERT INTO public.categories (id, name, description, default_priority, assigned_role)
VALUES
    ('sanitation', 'Sanitation and Waste Management', 'Uncollected garbage, canal clogging, illegal dumping', 'Medium', 'Kagawad on Health and Sanitation'),
    ('peace_order', 'Peace and Order (Blotter)', 'Noise disturbances, street brawls, neighborhood disputes', 'High', 'Kagawad on Peace and Order'),
    ('infrastructure', 'Infrastructure and Roads', 'Potholes, damaged public facilities, bridge/sidewalk repairs', 'Medium', 'Kagawad on Infrastructure and Public Works'),
    ('utilities', 'Public Utilities (Water, Power, Streetlights)', 'Broken street lamps, busted water pipes, dangling wires', 'High', 'Kagawad on Public Utilities'),
    ('health', 'Health and Sanitation', 'Stagnant water/dengue hazard, animal control, public sanitation', 'Medium', 'Barangay Health Center Staff'),
    ('minors', 'Cases Involving Minors (SWDO Referral)', 'Child welfare concerns, minors out during curfew, disputes', 'High', 'SWDO Focal Officer and Punong Barangay'),
    ('general', 'General Community Feedback', 'Inquiries, suggestions, general community feedback', 'Low', 'Barangay Secretary')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_priority = EXCLUDED.default_priority,
    assigned_role = EXCLUDED.assigned_role;

-- 2. Allow Public Read on Categories (Needed for Citizen Report Dropdown)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

-- 3. Allow Citizens to Submit Complaints (With or without Auth during submission)
DROP POLICY IF EXISTS "Residents can insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Public can insert complaints" ON public.complaints;
CREATE POLICY "Public can insert complaints" ON public.complaints FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view complaints" ON public.complaints;
CREATE POLICY "Public can view complaints" ON public.complaints FOR SELECT USING (true);

-- 4. Allow Public to Request Certifications
DROP POLICY IF EXISTS "Residents can submit certification requests" ON public.certification_requests;
DROP POLICY IF EXISTS "Public can submit certification requests" ON public.certification_requests;
CREATE POLICY "Public can submit certification requests" ON public.certification_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view certification requests" ON public.certification_requests;
CREATE POLICY "Public can view certification requests" ON public.certification_requests FOR SELECT USING (true);

-- 5. Allow Public to View Barangay Projects
DROP POLICY IF EXISTS "Public can view projects" ON public.barangay_projects;
CREATE POLICY "Public can view projects" ON public.barangay_projects FOR SELECT USING (true);

