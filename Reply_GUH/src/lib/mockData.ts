import { MockPatientDB, MockHospitalDB } from "@/types/patient";

export const mockPatientDB: MockPatientDB[] = [
  {
    nhs_number: "9912003071",
    name: "Jane Doe",
    dob: "2002-03-15",
    medical_history: ["Asthma", "Penicillin Allergy"],
  },
  {
    nhs_number: "9912003072",
    name: "John Smith",
    dob: "1955-11-20",
    medical_history: ["Hypertension", "Type 2 Diabetes", "Previous MI (2018)"],
  },
  {
    nhs_number: "9912003073",
    name: "Ban Joe",
    dob: "2002-03-15",
    medical_history: ["Asthma", "Penicillin Allergy"],
  },
  {
    nhs_number: "9912003074",
    name: "Gui Tar",
    dob: "1955-11-20",
    medical_history: ["Hypertension", "Type 2 Diabetes", "Previous MI (2018)"],
  },
  {
    nhs_number: "9912003075",
    name: "Harp Haze",
    dob: "2002-03-15",
    medical_history: ["Asthma", "Penicillin Allergy"],
  },
  {
    nhs_number: "9912003076",
    name: "Clair aNet",
    dob: "1955-11-20",
    medical_history: ["Hypertension", "Type 2 Diabetes", "Previous MI (2018)"],
  },
  {
    nhs_number: "9912003077",
    name: "Pian Over",
    dob: "2002-03-15",
    medical_history: ["Asthma", "Penicillin Allergy"],
  },
  {
    nhs_number: "9912003078",
    name: "Kay Bord",
    dob: "1955-11-20",
    medical_history: ["Hypertension", "Type 2 Diabetes", "Previous MI (2018)"],
  },
];

export const mockHospitalDB: MockHospitalDB[] = [
  {
    hospital_id: "H001",
    name: "St. Elsewhere's Hospital",
    current_capacity: 47,
    max_capacity: 60,
  },
  {
    hospital_id: "H002",
    name: "Royal General Hospital",
    current_capacity: 52,
    max_capacity: 70,
  },
];

export const videoOptions = [
  { value: "ankle_limp.mp4", label: "Ankle Injury - Limp (Mock Video)" },
  { value: "light_cough.mp4", label: "Light Cough - Coughing (Mock Video)" },
  { value: "ankle_no_weight.mp4", label: "Ankle Injury - No Weight Bearing (Mock Video)" },
  { value: "laceration.mp4", label: "Laceration/Bleeding (Mock Video)" },
  { value: "stroke_symptoms.mp4", label: "Suspected Stroke Symptoms (Mock Video)" },
  { value: "in_transit_vitals.mp4", label: "In Transit - Vitals Update (Mock Video)" },
];
