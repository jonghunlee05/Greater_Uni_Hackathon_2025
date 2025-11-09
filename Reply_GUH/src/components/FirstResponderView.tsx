import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Patient } from '@/types/patient';
import { AmbulanceMap } from '@/components/AmbulanceMap';
import { ParamedicChat } from '@/components/ParamedicChat';
import { videoOptions, mockHospitalDB } from '@/lib/mockData';
import { VideoRecorder } from '@/components/VideoRecorder';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { User, Activity, FileText, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FirstResponderViewProps {
  patients: Patient[];
  onUpdatePatient: (patient: Patient) => void;
}

export function FirstResponderView({ patients, onUpdatePatient }: FirstResponderViewProps) {
  const [updateText, setUpdateText] = useState('');
  const [updateVideo, setUpdateVideo] = useState('');
  const [symptomUpdate, setSymptomUpdate] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAtPatientLocation, setIsAtPatientLocation] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Get the first patient that's either dispatched, in transit, arrived, or moving to hospital
  const activePatient = patients.find(
    p => ['Ambulance Dispatched', 'In Transit', 'Prep Ready', 'Arrived', 'Moving to Operation Theatre', 'Awaiting Plan Approval'].includes(p.status)
  );

  const hasArrived = isAtPatientLocation;

  if (!activePatient) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">First Responder View</h2>
          <p className="text-muted-foreground">En route to emergency - Real-time navigation & patient communication</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active emergency dispatch</p>
            <p className="text-sm text-muted-foreground mt-2">Waiting for dispatch assignment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    if (severity >= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const handleSendUpdate = async () => {
    if (!activePatient || !updateText) return;
    
    setIsSending(true);

    // Combine all update information
    const fullUpdateText = `Symptoms: ${symptomUpdate || activePatient.symptom_description}. Actions taken: ${actionsTaken}. Additional notes: ${updateText}`;

    const updatedPatient: Patient = {
      ...activePatient,
      status: 'Moving to Operation Theatre',
      symptom_description: symptomUpdate || activePatient.symptom_description,
      ambulance_updates: [
        ...(activePatient.ambulance_updates || []),
        {
          timestamp: new Date().toISOString(),
          text: fullUpdateText,
          video: updateVideo || undefined
        }
      ],
      eta_minutes: 0.5
    };

    console.log(`[EMSAgent]: Sending update for patient ${activePatient.nhs_number} (${activePatient.patient_name})`);
    console.log(`[EMSAgent]: Update: "${updateText}"`);
    console.log(`[OpsAgent]: Patient (ID ${activePatient.nhs_number}) in transit. New data received. Generating AI resource plan.`);

    // Generate AI-powered resource plan for high-severity patients
    if (activePatient.severity >= 8) {
      try {
        const hospitalCapacity = mockHospitalDB[0];
        
        const { data, error } = await supabase.functions.invoke('resource-planning', {
          body: {
            patient: updatedPatient,
            hospitalCapacity: {
              current: hospitalCapacity.current_capacity,
              max: hospitalCapacity.max_capacity
            }
          }
        });

        if (error) throw error;

        updatedPatient.resource_plan = data;
        updatedPatient.status = 'Awaiting Plan Approval';
        
        console.log(`[OpsAgent]: AI resource plan generated for ${activePatient.nhs_number}`);
      } catch (error) {
        console.error('Error generating AI resource plan:', error);
      }
    }

    onUpdatePatient(updatedPatient);
    setUpdateText('');
    setUpdateVideo('');
    setSymptomUpdate('');
    setActionsTaken('');
    setDialogOpen(false);
    // Keep isAtPatientLocation true - form stays visible until ambulance returns to hospital
    setIsSending(false);
  };

  const patientContext = `Patient symptoms: ${activePatient.symptom_description}. Severity: ${activePatient.severity}. Triage notes: ${activePatient.triage_notes}`;

  const handleAmbulanceArrival = () => {
    if (activePatient && !isAtPatientLocation) {
      setIsAtPatientLocation(true);
      console.log(`[EMSAgent]: Ambulance arrived at patient location for ${activePatient.patient_name}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">First Responder View</h2>
        <p className="text-muted-foreground">En route to emergency - Real-time navigation & patient communication</p>
      </div>

      {!hasArrived ? (
        <>
          {/* Map Section */}
          <AmbulanceMap
            patientName={activePatient.patient_name}
            eta={activePatient.eta_minutes || 0.5}
            dispatchTime={activePatient.dispatch_time}
            reverseDirection={true}
            onArrival={handleAmbulanceArrival}
          />

          {/* Patient Information Card */}
          <Card className="border-l-4 border-l-destructive">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-destructive" />
                    Patient Information
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Emergency call received - En route to location
                  </CardDescription>
                </div>
                <Badge className={getSeverityColor(activePatient.severity)}>
                  Severity {activePatient.severity}/10
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{activePatient.patient_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">NHS Number:</span>
                    <span>{activePatient.nhs_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">ETA:</span>
                    <span className="text-destructive font-semibold">{activePatient.eta_minutes || 0.5} minutes</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline">{activePatient.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Reported Symptoms:</p>
                <p className="text-sm text-muted-foreground">{activePatient.symptom_description}</p>
              </div>

              {activePatient.triage_notes && (
                <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Triage Assessment:</p>
                  <p className="text-sm text-muted-foreground">{activePatient.triage_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Chat Section */}
          <ParamedicChat patientContext={patientContext} />
        </>
      ) : (
        <>
          {/* Patient Arrived - Ambulance Assessment Form */}
          <Card className="border-l-4 border-l-success">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-success" />
                    On Scene - {activePatient.patient_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Document patient assessment and actions taken
                  </CardDescription>
                </div>
                <Badge className={getSeverityColor(activePatient.severity)}>
                  Severity {activePatient.severity}/10
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{activePatient.patient_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">NHS Number:</span>
                    <span>{activePatient.nhs_number}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline">On Scene</Badge>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Initial Call Assessment:</p>
                <p className="text-sm text-muted-foreground">{activePatient.triage_notes}</p>
              </div>

              {/* Main Update Form */}
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="video-capture" className="text-base font-semibold">
                    Patient Video Documentation
                  </Label>
                  <Select value={updateVideo} onValueChange={setUpdateVideo}>
                    <SelectTrigger id="video-capture">
                      <SelectValue placeholder="Select or capture video of patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Video evidence of patient condition for hospital review
                  </p>
                </div>

                <VideoRecorder />

                <div className="flex items-center justify-center">
                  <VoiceRecorder 
                    formType="responder"
                    onTranscription={(jsonText) => {
                      try {
                        const data = JSON.parse(jsonText);
                        setSymptomUpdate(data.symptoms || '');
                        setActionsTaken(data.actions || '');
                        setUpdateText(data.notes || '');
                      } catch (e) {
                        console.error('Failed to parse structured data:', e);
                      }
                    }}
                    label="Record All Information"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symptom-update" className="text-base font-semibold">
                    Current Symptoms Observed
                  </Label>
                  <Textarea
                    id="symptom-update"
                    placeholder="Updated symptoms and observations (e.g., Patient shows signs of stroke - facial drooping, slurred speech, weakness in right arm)"
                    value={symptomUpdate}
                    onChange={(e) => setSymptomUpdate(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actions-taken" className="text-base font-semibold">
                    Actions Taken
                  </Label>
                  <Textarea
                    id="actions-taken"
                    placeholder="Medical interventions performed (e.g., Administered oxygen, secured airway, started IV line, given aspirin)"
                    value={actionsTaken}
                    onChange={(e) => setActionsTaken(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-notes" className="text-base font-semibold">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Any other relevant information for the hospital team"
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleSendUpdate} 
                  className="w-full"
                  disabled={!updateText || !actionsTaken || isSending}
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Send Update to Hospital & Clinician'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {activePatient.severity >= 8 
                    ? "AI resource plan will be generated for hospital approval" 
                    : "Update will be sent to hospital operations"}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
