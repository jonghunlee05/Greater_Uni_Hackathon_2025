import { Patient } from '@/types/patient';

interface SeverityAnalysisResult {
  severity: number;
  triage_notes: string;
}

interface ChatbotAnswers {
  bleeding?: 'Yes' | 'No';
}

export function mockSeverityAnalysis(
  videoFilename: string,
  symptomText: string,
  chatbotAnswers: ChatbotAnswers
): SeverityAnalysisResult {
  let severity = 1;
  let triage_notes = '';

  console.log(`[TriageAgent]: Analyzing patient data - Video: ${videoFilename}, Symptoms: "${symptomText}"`);

  // Laceration/Bleeding Logic
  if (videoFilename.includes('laceration') && chatbotAnswers.bleeding === 'Yes') {
    severity = 9;
    triage_notes = 'Severe laceration with active bleeding.';
  }
  // Ankle/Gait Logic (Functional Assessment)
  else if (videoFilename.includes('ankle_no_weight')) {
    severity = 7;
    triage_notes = 'Musculoskeletal injury. Patient unable to bear weight.';
  }
  else if (videoFilename.includes('ankle_limp')) {
    severity = 4;
    triage_notes = 'Musculoskeletal injury. Impaired gait (limp).';
  }
  // Stroke Logic
  else if (symptomText.toLowerCase().includes('face drooping') || 
           symptomText.toLowerCase().includes('face is drooping') ||
           videoFilename.includes('stroke')) {
    severity = 10;
    triage_notes = 'Suspected stroke symptoms.';
  }
  else {
    severity = 3;
    triage_notes = 'Minor injury or illness.';
  }

  console.log(`[TriageAgent]: Analysis complete - Severity: ${severity}/10, Notes: "${triage_notes}"`);

  return { severity, triage_notes };
}

export function mockResourcePlan(patient: Patient) {
  console.log(`[OpsAgent]: Generating resource plan for patient ${patient.nhs_number} (${patient.patient_name})`);

  if (patient.triage_notes.includes('stroke')) {
    const plan = {
      plan_text: '1. Reserve Stroke Bay 2.\n2. Page On-Call Neurologist.\n3. Prep CT Scanner.',
      entrance: 'Ambulance Bay Z'
    };
    console.log(`[OpsAgent]: Stroke protocol activated - ${plan.entrance}`);
    return plan;
  }
  
  if (patient.triage_notes.includes('laceration')) {
    const plan = {
      plan_text: '1. Assign to Trauma Room 3.\n2. Page On-Call Surgeon.\n3. Prep Suture Kit.',
      entrance: 'Ambulance Bay A'
    };
    console.log(`[OpsAgent]: Trauma protocol activated - ${plan.entrance}`);
    return plan;
  }

  const plan = {
    plan_text: 'Assign to A&E General Pod.',
    entrance: 'Main Entrance'
  };
  console.log(`[OpsAgent]: Standard protocol - ${plan.entrance}`);
  return plan;
}

export function calculateWaitTime(severity: number, queueLength: number): number {
  // Higher severity = shorter wait time
  const baseWait = 300; // 5 hours base
  const severityModifier = (10 - severity) * 20;
  const queueModifier = queueLength * 15;
  
  return Math.max(15, baseWait - severityModifier + queueModifier);
}
