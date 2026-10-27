-- =====================================================================
-- COMMUNITYVOICE: Initial Demo Seed Data
-- Barangay Hibao-an Sur, Mandurriao, Iloilo City
-- =====================================================================

-- 1. Sample Community Projects
INSERT INTO public.barangay_projects (title, description, status, budget, start_date, target_completion_date, location_address, latitude, longitude)
VALUES
    (
        'Drainage Clearing & Rehabilitation - Zone 2',
        'De-silting and repair of main roadside canal to prevent localized flooding during heavy monsoon rains.',
        'Ongoing',
        85000.00,
        '2026-10-15',
        '2026-11-30',
        'Zone 2, Hibao-an Sur, Mandurriao, Iloilo City',
        10.7321,
        122.5215
    ),
    (
        'Installation of Solar-Powered Streetlights',
        'Installation of 15 LED solar streetlights along dimly-lit residential pathways to enhance night safety.',
        'Completed',
        120000.00,
        '2026-08-01',
        '2026-09-15',
        'Zone 4 Perimeter Road, Hibao-an Sur',
        10.7305,
        122.5242
    ),
    (
        'Upgrading of Barangay Health Center Facility',
        'Expansion of immunization area and medicine storage cabinet for mother-and-child healthcare supplies.',
        'Proposed',
        150000.00,
        '2026-12-01',
        '2027-02-28',
        'Barangay Hall Compound, Hibao-an Sur',
        10.7314,
        122.5228
    )
ON CONFLICT DO NOTHING;

-- 2. Sample Tanod Duty Schedules
INSERT INTO public.tanod_duty_schedules (duty_date, shift, tanod_names, sector_assigned)
VALUES
    (
        CURRENT_DATE,
        'Night Patrol (10PM - 6AM)',
        ARRAY['Tanod Roberto Perez', 'Tanod Danilo Alunan', 'Tanod Mario Gomez'],
        'Zone 1 & Zone 2 (Main Access Roads)'
    ),
    (
        CURRENT_DATE,
        'Afternoon Shift (2PM - 10PM)',
        ARRAY['Tanod Ernesto Ramos', 'Tanod Joel Dela Cruz'],
        'Zone 3 & Health Center Perimeter'
    )
ON CONFLICT DO NOTHING;

