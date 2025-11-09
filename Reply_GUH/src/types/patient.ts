export interface Patient {
  queue_id: string;
  patient_name: string;
  nhs_number: string;
  severity: number;
  status: 'Waiting (Remote)' | 'In Waiting Lobby' | 'Ambulance Dispatched' | 'In Transit' | 'Awaiting Plan Approval' | 'Prep Ready' | 'Arrived' | 'Moving to Operation Theatre' | 'In Operation Theatre';
  triage_notes: string;
  eta_minutes?: number;
  dispatch_time?: number;
  prep_tab_dispatch_time?: number;
  has_arrived_at_hospital?: boolean;
  resource_plan?: {
    plan_text: string;
    entrance: string;
    roomAssignment?: string;
    specialistsNeeded?: string[];
    equipmentRequired?: string[];
    staffToContact?: string[];
    areasToClear?: string[];
    priority?: string;
  };
  symptom_description?: string;
  video_filename?: string;
  ambulance_updates?: Array<{
    timestamp: string;
    text: string;
    video?: string;
  }>;
}

export interface MockPatientDB {
  nhs_number: string;
  name: string;
  dob: string;
  medical_history: string[];
}

export interface MockHospitalDB {
  hospital_id: string;
  name: string;
  current_capacity: number;
  max_capacity: number;
}
