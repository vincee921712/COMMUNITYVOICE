import { Category, Complaint, CertificateRequest, BarangayProject, BlotterRecord, TanodSchedule } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'sanitation',
    name: 'Sanitation and Waste Management',
    description: 'Uncollected garbage, canal clogging, illegal dumping',
    default_priority: 'Medium',
    assigned_role: 'Kagawad on Health & Sanitation'
  },
  {
    id: 'peace_order',
    name: 'Peace and Order (Blotter)',
    description: 'Noise disturbances, street brawls, neighborhood disputes',
    default_priority: 'High',
    assigned_role: 'Kagawad on Peace & Order'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure and Roads',
    description: 'Potholes, damaged public facilities, bridge/sidewalk repairs',
    default_priority: 'Medium',
    assigned_role: 'Kagawad on Infrastructure & Public Works'
  },
  {
    id: 'utilities',
    name: 'Public Utilities (Water, Power, Streetlights)',
    description: 'Broken street lamps, busted water pipes, dangling wires',
    default_priority: 'High',
    assigned_role: 'Kagawad on Public Utilities'
  },
  {
    id: 'health',
    name: 'Health and Sanitation',
    description: 'Stagnant water/dengue hazard, animal control, public sanitation',
    default_priority: 'Medium',
    assigned_role: 'Barangay Health Center Staff'
  },
  {
    id: 'minors',
    name: 'Cases Involving Minors (SWDO Referral)',
    description: 'Child welfare concerns, minors out during curfew, disputes',
    default_priority: 'High',
    assigned_role: 'SWDO Focal Officer & Punong Barangay'
  },
  {
    id: 'general',
    name: 'General Community Feedback',
    description: 'Inquiries, suggestions, general community feedback',
    default_priority: 'Low',
    assigned_role: 'Barangay Secretary'
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'c-101',
    tracking_number: 'CV-2026-001',
    resident_name: 'Maria Santos',
    resident_contact: '0917-555-0192',
    title: 'Dangling Low Electrical Wire over Pathway',
    description: 'Low-hanging live wire near the Zone 3 basketball court entrance after strong winds. Children pass by on their way to school.',
    location_address: 'Near Zone 3 Basketball Court, Hibao-an Sur',
    latitude: 10.7325,
    longitude: 122.5230,
    category_id: 'utilities',
    priority: 'High',
    status: 'In Progress',
    ai_category_id: 'utilities',
    ai_priority: 'High',
    ai_justification: 'Identified direct safety hazard: low-hanging live electrical wire near children pathway.',
    ai_confidence: 0.96,
    is_staff_confirmed: true,
    is_minor_flagged: false,
    is_duplicate_flagged: false,
    assigned_to: 'Kagawad on Public Utilities (Kagawad R. Villanueva)',
    created_at: '2026-10-25T08:30:00Z',
    updated_at: '2026-10-25T09:15:00Z'
  },
  {
    id: 'c-102',
    tracking_number: 'CV-2026-002',
    resident_name: 'Eduardo Ramos',
    resident_contact: '0928-555-4819',
    title: 'Clogged Drainage Causing Stagnant Water in Zone 2',
    description: 'Plastic bottles and silt blocked the roadside canal. Water has been stagnant for 5 days, strong mosquito breeding concern.',
    location_address: 'Zone 2 Main Access Road, Hibao-an Sur',
    latitude: 10.7310,
    longitude: 122.5218,
    category_id: 'sanitation',
    priority: 'Medium',
    status: 'Assigned',
    ai_category_id: 'sanitation',
    ai_priority: 'Medium',
    ai_justification: 'Drainage blockage with health hazard (mosquito breeding) but no immediate life-threat.',
    ai_confidence: 0.89,
    is_staff_confirmed: true,
    is_minor_flagged: false,
    is_duplicate_flagged: false,
    assigned_to: 'Kagawad on Health & Sanitation (Kagawad E. Morales)',
    created_at: '2026-10-26T10:15:00Z',
    updated_at: '2026-10-26T11:00:00Z'
  },
  {
    id: 'c-103',
    tracking_number: 'CV-2026-003',
    resident_name: 'Concerned Neighbor',
    title: 'Curfew Violation & Minors Playing Loudly Past 11 PM',
    description: 'Group of young teenagers (minors around 13-15 years old) loitering and making noise past curfew at the street corner.',
    location_address: 'Corner Zone 4, Hibao-an Sur',
    latitude: 10.7302,
    longitude: 122.5245,
    category_id: 'minors',
    priority: 'High',
    status: 'Under Review',
    ai_category_id: 'minors',
    ai_priority: 'High',
    ai_justification: 'Involves minors loitering past curfew hours; automated high-priority flag for SWDO protocol.',
    ai_confidence: 0.94,
    is_staff_confirmed: false,
    is_minor_flagged: true,
    is_duplicate_flagged: false,
    assigned_to: 'SWDO Focal Officer & Punong Barangay',
    created_at: '2026-10-27T01:45:00Z',
    updated_at: '2026-10-27T02:00:00Z'
  }
];

export const INITIAL_CERTIFICATES: CertificateRequest[] = [
  {
    id: 'cert-01',
    tracking_number: 'CERT-2026-001',
    resident_name: 'Analyn Joy Dela Cruz',
    certificate_type: 'certificate_of_indigency',
    purpose: 'Medical Assistance at Western Visayas Medical Center (WVMC)',
    contact_number: '0919-444-1293',
    status: 'Ready for Pickup',
    approved_by: 'Hon. Punong Barangay',
    approved_at: '2026-10-26T14:00:00Z',
    remarks: 'Approved. Available for claim at Barangay Hall Window 1.',
    created_at: '2026-10-25T11:20:00Z'
  },
  {
    id: 'cert-02',
    tracking_number: 'CERT-2026-002',
    resident_name: 'Mark Lester Tan',
    certificate_type: 'barangay_id',
    purpose: 'Employment Requirement & Local Government ID',
    contact_number: '0922-888-9012',
    status: 'For Approval',
    remarks: 'Records verified by Clerk. Awaiting Punong Barangay digital sign-off.',
    created_at: '2026-10-26T16:45:00Z'
  },
  {
    id: 'cert-03',
    tracking_number: 'CERT-2026-003',
    resident_name: 'Rosemarie Alunan',
    certificate_type: 'certificate_of_residency',
    purpose: 'Bank Account Opening',
    contact_number: '0918-222-3344',
    status: 'Pending',
    created_at: '2026-10-27T09:10:00Z'
  }
];

export const INITIAL_PROJECTS: BarangayProject[] = [
  {
    id: 'p-1',
    title: 'Drainage Clearing & Rehabilitation - Zone 2',
    description: 'De-silting and repair of main roadside canal to prevent localized flooding during heavy monsoon rains.',
    status: 'Ongoing',
    budget: 85000,
    start_date: '2026-10-15',
    target_completion_date: '2026-11-30',
    location_address: 'Zone 2, Hibao-an Sur, Mandurriao, Iloilo City',
    latitude: 10.7321,
    longitude: 122.5215
  },
  {
    id: 'p-2',
    title: 'Installation of Solar-Powered Streetlights',
    description: 'Installation of 15 LED solar streetlights along dimly-lit residential pathways to enhance night safety.',
    status: 'Completed',
    budget: 120000,
    start_date: '2026-08-01',
    target_completion_date: '2026-09-15',
    location_address: 'Zone 4 Perimeter Road, Hibao-an Sur',
    latitude: 10.7305,
    longitude: 122.5242
  },
  {
    id: 'p-3',
    title: 'Upgrading of Barangay Health Center Facility',
    description: 'Expansion of immunization area and medicine storage cabinet for mother-and-child healthcare supplies.',
    status: 'Proposed',
    budget: 150000,
    start_date: '2026-12-01',
    target_completion_date: '2027-02-28',
    location_address: 'Barangay Hall Compound, Hibao-an Sur',
    latitude: 10.7314,
    longitude: 122.5228
  }
];

export const INITIAL_BLOTTER: BlotterRecord[] = [
  {
    id: 'b-01',
    blotter_entry_number: 'BLOTTER-2026-042',
    incident_type: 'Neighborhood Noise & Boundary Dispute',
    incident_date: '2026-10-24T21:30:00Z',
    incident_location: 'Zone 1 Purok Narra, Hibao-an Sur',
    complainant_name: 'Felipe Mendoza',
    respondent_name: 'Reynaldo Castor',
    narrative: 'Complainant reports loud videoke sound beyond 10 PM and verbal disagreement regarding fence boundary placement.',
    assigned_personnel: 'Tanod Patrol Team B & Kagawad on Peace & Order',
    status: 'Settled',
    created_at: '2026-10-24T22:15:00Z'
  }
];

export const INITIAL_TANOD_SCHEDULE: TanodSchedule[] = [
  {
    id: 'ts-1',
    duty_date: '2026-10-27',
    shift: 'Night Patrol (10PM - 6AM)',
    tanod_names: ['Tanod Roberto Perez', 'Tanod Danilo Alunan', 'Tanod Mario Gomez'],
    sector_assigned: 'Zone 1 & Zone 2 (Main Access Roads)'
  },
  {
    id: 'ts-2',
    duty_date: '2026-10-27',
    shift: 'Afternoon Shift (2PM - 10PM)',
    tanod_names: ['Tanod Ernesto Ramos', 'Tanod Joel Dela Cruz'],
    sector_assigned: 'Zone 3 & Health Center Perimeter'
  }
];

