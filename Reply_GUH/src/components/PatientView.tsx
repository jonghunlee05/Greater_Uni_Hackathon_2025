import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockPatientDB, videoOptions } from '@/lib/mockData';
import { calculateWaitTime } from '@/lib/aiSubstitutions';
import { Patient } from '@/types/patient';
import { AlertCircle, CheckCircle, Phone, Loader2, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HospitalSelector, Hospital } from '@/components/HospitalSelector';
import { AmbulanceMap } from '@/components/AmbulanceMap';
import { FirstAidInstructions } from '@/components/FirstAidInstructions';
import { AmbulanceChat } from '@/components/AmbulanceChat';
import { VideoRecorder } from '@/components/VideoRecorder';
import { VoiceRecorder } from '@/components/VoiceRecorder';

interface PatientViewProps {
  onPatientRegistered: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  patients: Patient[];
  currentQueueLength: number;
}

export function PatientView({ onPatientRegistered, onUpdatePatient, patients, currentQueueLength }: PatientViewProps) {
  const [nhsNumber, setNhsNumber] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [result, setResult] = useState<{ 
    severity: number; 
    waitTime?: number; 
    requiresDispatch: boolean;
    recommendations?: string;
    triageNotes?: string;
  } | null>(null);
  const [showConfirmDispatch, setShowConfirmDispatch] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [dispatchConfirmed, setDispatchConfirmed] = useState(false);
  const [firstAidInstructions, setFirstAidInstructions] = useState<string>('');
  const [queueNumber, setQueueNumber] = useState<string>('');
  const [ambulanceDispatchTime, setAmbulanceDispatchTime] = useState<number>(0);

  const handleSubmit = async () => {
    if (!nhsNumber || !selectedHospital || !symptoms || !selectedVideo) {
      alert('Please fill in all fields');
      return;
    }

    const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
    if (!patientData) {
      alert('NHS Number not found in mock database');
      return;
    }

    setIsProcessing(true);

    try {
      // Call AI triage agent
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory
        }
      });

      if (error) throw error;

      console.log(`[TriageAgent]: Patient ${nhsNumber} (${patientData.name}) - AI assessment complete`);

      // Check if AI needs more information
      if (data.needsMoreInfo && data.question) {
        setAiQuestion(data.question);
        setConversationHistory([...conversationHistory, { role: 'assistant', content: data.question }]);
        setIsProcessing(false);
        return;
      }

      const severity = data.severity;
      const triageNotes = data.triageNotes;
      const recommendations = data.recommendations;

      if (severity >= 8) {
        setResult({ severity, requiresDispatch: true, recommendations, triageNotes });
        setShowConfirmDispatch(true);
        console.log(`[TriageAgent]: HIGH SEVERITY DETECTED - Severity ${severity}/10`);
      } else {
        const waitTime = calculateWaitTime(severity, currentQueueLength);
        setResult({ severity, waitTime, requiresDispatch: false, recommendations, triageNotes });
        
          const queueId = `Q${Date.now()}`;
          const newPatient: Patient = {
            queue_id: queueId,
            patient_name: patientData.name,
            nhs_number: nhsNumber,
            severity,
            status: 'Waiting (Remote)',
            triage_notes: triageNotes,
            symptom_description: symptoms,
            video_filename: selectedVideo
          };

          console.log(`[OpsAgent]: Registering new patient (ID ${nhsNumber}). Severity ${severity}.`);
          console.log(`[System]: Patient data successfully transmitted to hospital system.`);
          onPatientRegistered(newPatient);
          setQueueNumber(queueId);
          setRegistrationComplete(true);
      }
    } catch (error) {
      console.error('Error in AI triage assessment:', error);
      alert('Error processing assessment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiQuestionResponse = async () => {
    if (!userResponse.trim()) return;

    const updatedHistory = [...conversationHistory, { role: 'user', content: userResponse }];
    setConversationHistory(updatedHistory);
    setUserResponse('');
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory: updatedHistory
        }
      });

      if (error) throw error;

      if (data.needsMoreInfo && data.question) {
        setAiQuestion(data.question);
        setConversationHistory([...updatedHistory, { role: 'assistant', content: data.question }]);
      } else {
        setAiQuestion(null);
        const severity = data.severity;
        const triageNotes = data.triageNotes;
        const recommendations = data.recommendations;

        if (severity >= 8) {
          setResult({ severity, requiresDispatch: true, recommendations, triageNotes });
          setShowConfirmDispatch(true);
        } else {
          const waitTime = calculateWaitTime(severity, currentQueueLength);
          setResult({ severity, waitTime, requiresDispatch: false, recommendations, triageNotes });
          
          const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
          const queueId = `Q${Date.now()}`;
          const newPatient: Patient = {
            queue_id: queueId,
            patient_name: patientData!.name,
            nhs_number: nhsNumber,
            severity,
            status: 'Waiting (Remote)',
            triage_notes: triageNotes,
            symptom_description: symptoms,
            video_filename: selectedVideo
          };

          console.log(`[System]: Patient data successfully transmitted to hospital system.`);
          onPatientRegistered(newPatient);
          setQueueNumber(queueId);
          setRegistrationComplete(true);
        }
      }
    } catch (error) {
      console.error('Error processing follow-up:', error);
      alert('Error processing response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDispatch = async () => {
    const patientData = mockPatientDB.find(p => p.nhs_number === nhsNumber);
    if (!patientData || !result) return;

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('triage-assessment', {
        body: {
          symptoms,
          videoFilename: selectedVideo,
          conversationHistory
        }
      });

      if (error) throw error;

      // Get first-aid instructions
      const { data: instructionsData } = await supabase.functions.invoke('first-aid-instructions', {
        body: { symptoms }
      });

      if (instructionsData?.instructions) {
        setFirstAidInstructions(instructionsData.instructions);
      }

      const dispatchTime = Date.now();
      setAmbulanceDispatchTime(dispatchTime);
      
      const newPatient: Patient = {
        queue_id: `Q${Date.now()}`,
        patient_name: patientData.name,
        nhs_number: nhsNumber,
        severity: result.severity,
        status: 'Ambulance Dispatched',
        triage_notes: data.triageNotes,
        symptom_description: symptoms,
        video_filename: selectedVideo,
        eta_minutes: 0.5,
        dispatch_time: dispatchTime
      };

      console.log(`[OpsAgent]: High-severity event (ID ${nhsNumber}). Severity ${result.severity}. Requesting dispatch.`);
      console.log(`[EMSAgent]: Ambulance dispatched for patient ${nhsNumber}`);
      onPatientRegistered(newPatient);
      setShowConfirmDispatch(false);
      setDispatchConfirmed(true);
    } catch (error) {
      console.error('Error in dispatch:', error);
      alert('Error processing dispatch. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrived = () => {
    // Find the current patient and update their status
    const currentPatient = patients.find(p => p.nhs_number === nhsNumber);
    if (currentPatient) {
      const updatedPatient: Patient = {
        ...currentPatient,
        status: 'In Waiting Lobby'
      };
      onUpdatePatient(updatedPatient);
      console.log(`[System]: Patient ${nhsNumber} marked as arrived - status changed to "In Waiting Lobby"`);
      alert('Thank you! Hospital staff have been notified of your arrival.');
    }
  };

  const resetForm = () => {
    setNhsNumber('');
    setSelectedHospital('');
    setSymptoms('');
    setSelectedVideo('');
    setResult(null);
    setShowConfirmDispatch(false);
    setConversationHistory([]);
    setAiQuestion(null);
    setUserResponse('');
    setRegistrationComplete(false);
    setDispatchConfirmed(false);
    setFirstAidInstructions('');
    setQueueNumber('');
    setAmbulanceDispatchTime(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Patient Triage Interface</h2>
          <p className="text-muted-foreground">TriageAgent - Remote Assessment & Registration</p>
        </div>
        {(dispatchConfirmed || registrationComplete) && (
          <Button onClick={resetForm} variant="secondary" size="sm">
            Reset Form
          </Button>
        )}
      </div>

      {!dispatchConfirmed && !registrationComplete && (
        <>
          <HospitalSelector onHospitalsUpdate={setNearbyHospitals} />

      <Card>
        <CardHeader>
          <CardTitle>Enter Symptoms</CardTitle>
          <CardDescription>Enter patient symptoms for remote triage assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nhs-number">NHS Number</Label>
            <Input
              id="nhs-number"
              placeholder="e.g., 9912003071"
              value={nhsNumber}
              onChange={(e) => setNhsNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospital">Select Hospital</Label>
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger id="hospital">
                <SelectValue placeholder="Choose a hospital" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {nearbyHospitals.map(hospital => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.distance} km ({hospital.capacity}/{hospital.maxCapacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="symptoms">Describe Symptoms</Label>
              <VoiceRecorder 
                formType="patient"
                onTranscription={(text) => setSymptoms(text)}
                label="Use Voice"
              />
            </div>
            <Textarea
              id="symptoms"
              placeholder="Please describe the symptoms or injury... or use voice input above"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video">Upload Video Assessment (Simulated)</Label>
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger id="video">
                <SelectValue placeholder="Select mock video file" />
              </SelectTrigger>
              <SelectContent>
                {videoOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <VideoRecorder />

          {aiQuestion && (
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-primary text-lg">AI Assessment Question</p>
                  <p className="text-base text-foreground leading-relaxed">{aiQuestion}</p>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response here..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAiQuestionResponse}
                      disabled={isProcessing || !userResponse.trim()}
                      size="lg"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
        </CardContent>
      </Card>
        </>
      )}

      {showConfirmDispatch && result && (
        <Alert className="border-critical bg-critical/10">
          <AlertCircle className="h-5 w-5 text-critical" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-critical text-lg mb-1">HIGH SEVERITY DETECTED</p>
                <p className="text-foreground">Severity: {result.severity}/10</p>
                <p className="text-muted-foreground mt-2">
                  This requires immediate emergency response. Please confirm 999 dispatch.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConfirmDispatch} 
                  className="bg-critical hover:bg-critical/90"
                  size="lg"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Confirm 999 Dispatch
                </Button>
                <Button onClick={resetForm} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {dispatchConfirmed && result && (
        <div className="space-y-6">
          <Alert className="border-critical bg-critical/10">
            <AlertCircle className="h-5 w-5 text-critical" />
            <AlertDescription>
              <p className="font-semibold text-critical text-lg">🚨 Emergency Services Dispatched</p>
              <p className="text-foreground mt-1">Ambulance is en route to your location. Track progress below.</p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-critical" />
                Live Ambulance Tracking
              </CardTitle>
              <CardDescription>Real-time location and ETA</CardDescription>
            </CardHeader>
            <CardContent>
              <AmbulanceMap 
                patientName={mockPatientDB.find(p => p.nhs_number === nhsNumber)?.name || 'Patient'} 
                eta={0.5}
                dispatchTime={ambulanceDispatchTime}
                reverseDirection={true}
              />
            </CardContent>
          </Card>

          {firstAidInstructions && (
            <FirstAidInstructions instructions={firstAidInstructions} />
          )}

          <AmbulanceChat 
            patientContext={`Patient symptoms: ${symptoms}. Severity: ${result.severity}. First-aid instructions: ${firstAidInstructions?.substring(0, 200) || 'N/A'}...`}
          />

          <Button onClick={resetForm} className="w-full">
            Return to Triage
          </Button>
        </div>
      )}

      {result && !result.requiresDispatch && registrationComplete && !dispatchConfirmed && (
        <div className="space-y-6">
          <Alert className="border-success bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
            <AlertDescription>
              <p className="font-semibold text-success text-xl mb-2">✓ You're in the Queue</p>
              <p className="text-muted-foreground">
                Your information has been sent to the hospital. Please wait for your turn.
              </p>
            </AlertDescription>
          </Alert>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">Your Queue Status</CardTitle>
              <CardDescription>Live updates on your waiting time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">#</span>
                    </div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Queue Number</p>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{queueNumber}</p>
                </div>

                <div className="p-6 bg-accent/5 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-6 w-6 text-accent animate-pulse" />
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">Estimated Wait</p>
                  </div>
                  <p className="text-4xl font-bold text-foreground">{result.waitTime} <span className="text-xl">min</span></p>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Severity Level</p>
                    <p className="font-semibold text-foreground">{result.severity}/10</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold text-foreground">Waiting Remotely</p>
                  </div>
                </div>
              </div>

              {result.triageNotes && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Assessment Notes</p>
                  <p className="text-sm text-foreground">{result.triageNotes}</p>
                </div>
              )}

              {result.recommendations && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">⚕️ Recommendations</p>
                  <p className="text-sm text-foreground font-medium">{result.recommendations}</p>
                </div>
              )}

              <Button onClick={handleArrived} size="lg" className="w-full">
                <MapPin className="mr-2 h-5 w-5" />
                I've Arrived at Hospital
              </Button>

              <Alert className="border-amber-500/50 bg-amber-500/5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-xs text-muted-foreground">
                  <strong>Please note:</strong> Wait times are estimates and may change due to emergency cases or changes in hospital capacity.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Button onClick={resetForm} className="w-full">
            Register Another Patient
          </Button>
        </div>
      )}
    </div>
  );
}
