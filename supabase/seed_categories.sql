INSERT INTO public.categories (id, name, description, default_priority, assigned_role)
VALUES
    ('sanitation', 'Sanitation and Waste Management', 'Uncollected garbage, canal clogging, illegal dumping', 'Medium', 'Kagawad on Health & Sanitation'),
    ('peace_order', 'Peace and Order (Blotter)', 'Noise disturbances, street brawls, neighborhood disputes', 'High', 'Kagawad on Peace & Order'),
    ('infrastructure', 'Infrastructure and Roads', 'Potholes, damaged public facilities, bridge/sidewalk repairs', 'Medium', 'Kagawad on Infrastructure & Public Works'),
    ('utilities', 'Public Utilities (Water, Power, Streetlights)', 'Broken street lamps, busted water pipes, dangling wires', 'High', 'Kagawad on Public Utilities'),
    ('health', 'Health and Sanitation', 'Stagnant water/dengue hazard, animal control, public sanitation', 'Medium', 'Barangay Health Center Staff'),
    ('minors', 'Cases Involving Minors (SWDO Referral)', 'Child welfare concerns, minors out during curfew, disputes', 'High', 'SWDO Focal Officer & Punong Barangay'),
    ('general', 'General Community Feedback', 'Inquiries, suggestions, general community feedback', 'Low', 'Barangay Secretary')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    default_priority = EXCLUDED.default_priority,
    assigned_role = EXCLUDED.assigned_role;

-- Allow public read on categories for filing complaints
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

-- Allow public insert on complaints during development
CREATE POLICY "Allow public insert on complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on complaints" ON public.complaints FOR SELECT USING (true);

