export type UserRole = 'resident' | 'staff' | 'official' | 'admin';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export type ComplaintStatus = 
  | 'Submitted' 
  | 'Under Review' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Resolved' 
  | 'Closed';

export interface Category {
  id: string;
  name: string;
  description: string;
  default_priority: PriorityLevel;
  assigned_role: string;
}

export interface Complaint {
  id: string;
  tracking_number: string;
  resident_name: string;
  resident_contact?: string;
  title: string;
  description: string;
  location_address: string;
  latitude: number;
  longitude: number;
  category_id: string;
  priority: PriorityLevel;
  status: ComplaintStatus;
  
  // AI recommendations
  ai_category_id?: string;
  ai_priority?: PriorityLevel;
  ai_justification?: string;
  ai_confidence?: number;
  is_staff_confirmed: boolean;
  
  // Safeguards
  is_minor_flagged: boolean;
  is_duplicate_flagged: boolean;
  duplicate_of_id?: string;
  duplicate_similarity_score?: number;
  
  assigned_to?: string;
  assigned_at?: string;
  first_official_response_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  resolution_report?: IncidentResolutionReport;
  status_history?: Array<{
    status: string;
    changed_at: string;
    changed_by?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface IncidentResolutionReport {
  incident_summary: string;
  actions_taken: string;
  investigation_conducted: string;
  resolution_details: string;
  resolved_at: string;
  assigned_official: string;
  remarks?: string;
  photos?: Array<{
    name: string;
    data: string;
  }>;
}

export interface ConversationMessage {
  id: string;
  record_type: 'complaint' | 'request';
  tracking_number: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
}

export type CertificateType = 'barangay_id' | 'certificate_of_indigency' | 'certificate_of_residency';
export type CertificateStatus = 'Pending' | 'For Approval' | 'Ready for Pickup' | 'Released' | 'Rejected';

export interface CertificateRequest {
  id: string;
  tracking_number: string;
  resident_name: string;
  certificate_type: CertificateType;
  purpose: string;
  contact_number: string;
  status: CertificateStatus;
  approved_by?: string;
  approved_at?: string;
  released_at?: string;
  remarks?: string;
  created_at: string;
  status_history?: Array<{
    status: string;
    changed_at: string;
    changed_by?: string;
  }>;
}

export interface BarangayProject {
  id: string;
  title: string;
  description: string;
  status: 'Proposed' | 'Ongoing' | 'Completed' | 'On Hold';
  budget: number;
  start_date: string;
  target_completion_date: string;
  location_address: string;
  latitude: number;
  longitude: number;
}

export interface BlotterRecord {
  id: string;
  blotter_entry_number: string;
  incident_type: string;
  incident_date: string;
  incident_location: string;
  complainant_name: string;
  respondent_name?: string;
  narrative: string;
  assigned_personnel: string;
  status: 'Active' | 'Under Investigation' | 'Referred to SWDO' | 'Settled' | 'Closed';
  created_at: string;
}

export interface TanodSchedule {
  id: string;
  duty_date: string;
  shift: string;
  tanod_names: string[];
  sector_assigned: string;
}

