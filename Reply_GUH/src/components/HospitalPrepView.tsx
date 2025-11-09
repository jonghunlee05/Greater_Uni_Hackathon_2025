import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Patient } from '@/types/patient';
import { 
  Ambulance, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Wrench, 
  Users, 
  Navigation 
} from 'lucide-react';
import { AmbulanceMap } from '@/components/AmbulanceMap';

interface HospitalPrepViewProps {
  patients: Patient[];
  onUpdatePatient?: (patient: Patient) => void;
}

// Helper function to format time as HH:MM:SS or MM:SS
const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const useRemainingTime = (eta: number, dispatchTime?: number) => {
  const [progress, setProgress] = React.useState(0);
  
  React.useEffect(() => {
    if (!dispatchTime) {
      return;
    }

    const totalDuration = eta * 60 * 1000;
    const initialElapsed = Date.now() - dispatchTime;
    const initialProgress = Math.min((initialElapsed / totalDuration) * 100, 100);
    setProgress(initialProgress);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - dispatchTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [eta, dispatchTime]);
  
  // Calculate remaining time based on progress and original ETA
  const totalSeconds = eta * 60;
  const remainingSeconds = Math.max(totalSeconds * (1 - progress / 100), 0);
  
  return remainingSeconds;
};

export function HospitalPrepView({ patients, onUpdatePatient }: HospitalPrepViewProps) {
  // Filter high-severity patients that haven't reached operation theatre yet
  const highSeverityPatients = patients.filter(
    p => p.severity >= 8 && 
    (p.status === 'Ambulance Dispatched' || p.status === 'In Transit' || p.status === 'Prep Ready' || p.status === 'Moving to Operation Theatre' || p.status === 'Arrived')
  );

  const handleHospitalArrival = (patient: Patient) => {
    console.log(`[HospitalPrepView DEBUG]: handleHospitalArrival called for ${patient.patient_name}`);
    console.log(`[HospitalPrepView DEBUG]: Patient status: ${patient.status}`);
    console.log(`[HospitalPrepView DEBUG]: has_arrived_at_hospital: ${patient.has_arrived_at_hospital}`);
    console.log(`[HospitalPrepView DEBUG]: onUpdatePatient exists: ${!!onUpdatePatient}`);
    
    // Trigger arrival for any transit status when timer reaches 0
    const validTransitStatuses = ['Prep Ready', 'In Transit', 'Moving to Operation Theatre'];
    
    if (validTransitStatuses.includes(patient.status) && onUpdatePatient && !patient.has_arrived_at_hospital) {
      console.log(`[HospitalPrepView DEBUG]: All conditions met, updating patient to ARRIVED status`);
      // First, set status to 'Arrived' to show the ARRIVED message
      const arrivedPatient: Patient = {
        ...patient,
        status: 'Arrived',
        eta_minutes: 0
      };
      onUpdatePatient(arrivedPatient);
      console.log(`[System]: Ambulance arrived at hospital with ${patient.patient_name} - showing ARRIVED status`);
      
      // After 3 seconds, set the has_arrived_at_hospital flag to trigger transition to Operation Theatre
      setTimeout(() => {
        console.log(`[HospitalPrepView DEBUG]: 3 seconds passed, setting has_arrived_at_hospital flag`);
        const transitionPatient: Patient = {
          ...arrivedPatient,
          has_arrived_at_hospital: true
        };
        onUpdatePatient(transitionPatient);
        console.log(`[System]: Transitioning ${patient.patient_name} to Operation Theatre (has_arrived_at_hospital flag set)`);
      }, 3000);
    } else {
      console.log(`[HospitalPrepView DEBUG]: Conditions NOT met for arrival transition`);
      if (!validTransitStatuses.includes(patient.status)) {
        console.log(`[HospitalPrepView DEBUG]: - Status ${patient.status} not in valid statuses: ${validTransitStatuses.join(', ')}`);
      }
      if (!onUpdatePatient) {
        console.log(`[HospitalPrepView DEBUG]: - onUpdatePatient callback is missing`);
      }
      if (patient.has_arrived_at_hospital) {
        console.log(`[HospitalPrepView DEBUG]: - has_arrived_at_hospital is already true`);
      }
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    return 'bg-warning text-warning-foreground';
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'Ambulance Dispatched') return 'Starting Preparation';
    return status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Hospital Preparation Center</h2>
        <p className="text-muted-foreground">Real-time Coordination for High-Severity Cases</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active High-Severity Preparations</CardTitle>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Ambulance className="h-4 w-4 mr-1" />
              {highSeverityPatients.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {highSeverityPatients.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No high-severity cases requiring preparation</p>
              <p className="text-sm text-muted-foreground mt-2">
                System will automatically alert when critical patients are inbound
              </p>
            </div>
          ) : (
            highSeverityPatients.map(patient => {
              const remainingSeconds = useRemainingTime(patient.eta_minutes || 0, patient.dispatch_time);
              
              return (
                <Alert key={patient.queue_id} className="border-critical bg-critical/5">
                  <Ambulance className="h-5 w-5 text-critical" />
                  <AlertDescription>
                    <div className="space-y-6">
                    {/* Real-time Ambulance Tracking - Hide when arrived */}
                    {patient.status !== 'Arrived' && (patient.status === 'Prep Ready' || patient.status === 'In Transit' || patient.status === 'Moving to Operation Theatre') && patient.eta_minutes !== undefined && !patient.has_arrived_at_hospital && (
                      <div className="mb-4">
                        <AmbulanceMap 
                          patientName={patient.patient_name} 
                          eta={patient.eta_minutes}
                          dispatchTime={patient.prep_tab_dispatch_time}
                          reverseDirection={false}
                          onArrival={() => handleHospitalArrival(patient)}
                        />
                      </div>
                    )}

                    {/* Patient Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xl text-foreground mb-1">
                          {patient.status === 'Arrived' ? 'ARRIVED:' : 'INBOUND:'} {patient.patient_name}
                        </p>
                        <p className="text-sm text-muted-foreground">NHS: {patient.nhs_number}</p>
                      </div>
                      <Badge className={getSeverityColor(patient.severity)}>
                        CRITICAL {patient.severity}/10
                      </Badge>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 p-3 bg-card rounded-md">
                      <Navigation className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-bold text-foreground">{getStatusDisplay(patient.status)}</p>
                      </div>
                    </div>

                    {/* Clinical Notes */}
                    <div className="p-4 bg-card rounded-md border">
                      <p className="font-semibold mb-2 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        Clinical Assessment:
                      </p>
                      <p className="text-sm text-muted-foreground">{patient.triage_notes}</p>
                    </div>

                    {patient.resource_plan && (
                      <>
                        {/* Ambulance Entrance */}
                        <div className="p-4 bg-accent/10 rounded-md border border-accent/30">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-5 w-5 text-accent" />
                            <p className="font-semibold">Ambulance Entrance:</p>
                          </div>
                          <p className="text-lg font-bold text-accent">
                            {patient.resource_plan.entrance}
                          </p>
                        </div>

                        {/* Room Assignment */}
                        {patient.resource_plan.roomAssignment && (
                          <div className="p-4 bg-primary/10 rounded-md border border-primary/30">
                            <div className="flex items-center gap-2 mb-2">
                              <Navigation className="h-5 w-5 text-primary" />
                              <p className="font-semibold">Room Assignment:</p>
                            </div>
                            <p className="text-lg font-bold text-primary">
                              {patient.resource_plan.roomAssignment}
                            </p>
                          </div>
                        )}

                        {/* Specialists Needed */}
                        {patient.resource_plan.specialistsNeeded && (
                          <div className="p-4 bg-card rounded-md border">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-5 w-5 text-foreground" />
                              <p className="font-semibold">Specialists to Page:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.specialistsNeeded.map((specialist: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span>{specialist}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Equipment Required */}
                        {patient.resource_plan.equipmentRequired && (
                          <div className="p-4 bg-card rounded-md border">
                            <div className="flex items-center gap-2 mb-3">
                              <Wrench className="h-5 w-5 text-foreground" />
                              <p className="font-semibold">Equipment to Prepare:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.equipmentRequired.map((equipment: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span>{equipment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Staff to Contact */}
                        {patient.resource_plan.staffToContact && (
                          <div className="p-4 bg-warning/10 rounded-md border border-warning/30">
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="h-5 w-5 text-warning" />
                              <p className="font-semibold">Staff to Contact:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.staffToContact.map((staff: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-warning" />
                                  <span>{staff}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Areas to Clear */}
                        {patient.resource_plan.areasToClear && (
                          <div className="p-4 bg-critical/10 rounded-md border border-critical/30">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="h-5 w-5 text-critical" />
                              <p className="font-semibold">Areas to Clear for Patient Flow:</p>
                            </div>
                            <ul className="space-y-2">
                              {patient.resource_plan.areasToClear.map((area: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-critical" />
                                  <span>{area}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Detailed Plan */}
                        <div className="p-4 bg-accent/10 rounded-md border border-accent/30">
                          <p className="font-semibold mb-3">Detailed Preparation Plan:</p>
                          <pre className="text-sm whitespace-pre-wrap text-foreground">
                            {patient.resource_plan.plan_text}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">System Features</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• AI-powered resource allocation optimizes patient flow</p>
          <p>• Real-time coordination between ambulance, specialists, and facility teams</p>
          <p>• Automatic area clearing ensures smooth transit from entrance to treatment</p>
          <p>• Equipment and staff preparation begins during ambulance transit</p>
          <p>• Converts travel time into preparation time, reducing door-to-treatment delays</p>
        </CardContent>
      </Card>
    </div>
  );
}
