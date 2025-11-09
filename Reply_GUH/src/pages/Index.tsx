import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientView } from '@/components/PatientView';
import { FirstResponderView } from '@/components/FirstResponderView';
import { HospitalOpsView } from '@/components/HospitalOpsView';
import { ClinicianView } from '@/components/ClinicianView';
import { HospitalPrepView } from '@/components/HospitalPrepView';
import { Patient } from '@/types/patient';
import { Activity } from 'lucide-react';

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentTab, setCurrentTab] = useState('patient');

  useEffect(() => {
    console.log('=== ER-Flow System Initialized ===');
    console.log('[System]: Multi-agent healthcare optimization platform active');
    console.log('[System]: Agents: TriageAgent, EMSAgent, OpsAgent, ClinicianAgent');
  }, []);

  // Set prep tab dispatch time when Preparation tab is activated
  useEffect(() => {
    if (currentTab === 'preparation') {
      setPatients(prev =>
        prev.map(patient => {
          // Only set prep_tab_dispatch_time for patients that are ready for prep and don't have it set yet
          if ((patient.status === 'Prep Ready' || patient.status === 'In Transit' || patient.status === 'Moving to Operation Theatre') 
              && !patient.prep_tab_dispatch_time 
              && !patient.has_arrived_at_hospital) {
            console.log(`[System]: Starting hospital arrival countdown for ${patient.patient_name}`);
            return { ...patient, prep_tab_dispatch_time: Date.now() };
          }
          return patient;
        })
      );
    }
  }, [currentTab, patients.map(p => p.status).join(',')])

  // No automatic arrival - handled by respective views

  // Note: Transition from Arrived to Moving to Operation Theatre now happens
  // when first responder submits their assessment in FirstResponderView

  // Auto-transition from Ambulance Dispatched to Prep Ready
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Ambulance Dispatched' && patient.resource_plan) {
            console.log(`[System]: Hospital preparation ready for ${patient.patient_name}`);
            return { ...patient, status: 'Prep Ready' as const };
          }
          return patient;
        })
      );
    }, 3000); // Wait 3 seconds for preparation

    return () => clearInterval(interval);
  }, []);

  // Auto-transition from Prep Ready to In Transit
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.status === 'Prep Ready' && patient.dispatch_time) {
            console.log(`[System]: Ambulance with ${patient.patient_name} is now in transit`);
            return { ...patient, status: 'In Transit' as const };
          }
          return patient;
        })
      );
    }, 2000); // Wait 2 seconds before in transit

    return () => clearInterval(interval);
  }, []);

  // Transition to In Operation Theatre when ambulance arrives at hospital
  useEffect(() => {
    const hasArrivedPatients = patients.filter(p => p.has_arrived_at_hospital);
    
    if (hasArrivedPatients.length > 0) {
      setPatients(prev => 
        prev.map(patient => {
          if (patient.has_arrived_at_hospital) {
            console.log(`[System]: Patient ${patient.patient_name} is now in operation theatre`);
            return { 
              ...patient, 
              status: 'In Operation Theatre' as const,
              has_arrived_at_hospital: false 
            };
          }
          return patient;
        })
      );
    }
  }, [patients.map(p => p.has_arrived_at_hospital).join(',')]);

  const handlePatientRegistered = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.queue_id === updatedPatient.queue_id) {
          // Set dispatch time when ambulance is dispatched
          if (updatedPatient.status === 'Ambulance Dispatched' && !updatedPatient.dispatch_time) {
            return { ...updatedPatient, dispatch_time: Date.now() };
          }
          return updatedPatient;
        }
        return p;
      })
    );
  };

  const handleApprovePlan = (patient: Patient) => {
    const approvedPatient: Patient = {
      ...patient,
      status: 'Prep Ready'
    };

    setPatients(prev =>
      prev.map(p => p.queue_id === approvedPatient.queue_id ? approvedPatient : p)
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-success/5 rounded-full blur-3xl animate-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Premium Header */}
      <header className="glass-strong border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50" />
                <div className="relative bg-gradient-primary p-2.5 rounded-xl shadow-premium">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gradient">A&E Accelerate</h1>
                <p className="text-sm text-muted-foreground font-medium">Agentic AI for Emergency Care Optimization</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-3 px-4 py-2 glass rounded-full animate-slide-in">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success-foreground">System Active</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10">
        <Tabs defaultValue="patient" value={currentTab} onValueChange={setCurrentTab} className="space-y-8 animate-fade-in-up">
          {/* Premium Tab List */}
          <div className="flex justify-center">
            <TabsList className="glass-strong p-1.5 rounded-2xl inline-flex gap-2 border border-white/10 shadow-premium">
              <TabsTrigger 
                value="patient" 
                className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                Patient View
              </TabsTrigger>
              <TabsTrigger 
                value="firstresponder"
                className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                First Responder
              </TabsTrigger>
              <TabsTrigger 
                value="hospital"
                className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                Hospital Ops
              </TabsTrigger>
              <TabsTrigger 
                value="preparation"
                className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                Preparation
              </TabsTrigger>
              <TabsTrigger 
                value="clinician"
                className="px-6 py-3 rounded-xl font-medium data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                Clinician
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="patient" className="space-y-4">
            <PatientView 
              onPatientRegistered={handlePatientRegistered}
              onUpdatePatient={handleUpdatePatient}
              patients={patients}
              currentQueueLength={patients.length}
            />
          </TabsContent>

          <TabsContent value="firstresponder" className="space-y-4">
            <FirstResponderView 
              patients={patients}
              onUpdatePatient={handleUpdatePatient}
            />
          </TabsContent>

          <TabsContent value="hospital" className="space-y-4">
            <HospitalOpsView patients={patients} />
          </TabsContent>

          <TabsContent value="preparation" className="space-y-4">
            <HospitalPrepView patients={patients} onUpdatePatient={handleUpdatePatient} />
          </TabsContent>

          <TabsContent value="clinician" className="space-y-4">
            <ClinicianView 
              patients={patients}
              onApprovePlan={handleApprovePlan}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Premium Footer */}
      <footer className="glass border-t border-white/10 mt-20 relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-premium">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-foreground">A&E Accelerate Demo</p>
                <p className="text-muted-foreground">Hackathon Prototype • Multi-Agent AI System</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="px-3 py-1 glass rounded-full text-xs font-medium text-accent">AI-Powered</div>
              <div className="px-3 py-1 glass rounded-full text-xs font-medium text-success">Real-Time</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
