import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Patient } from '@/types/patient';
import { Activity, Users, Clock, AlertTriangle } from 'lucide-react';

interface HospitalOpsViewProps {
  patients: Patient[];
}

export function HospitalOpsView({ patients }: HospitalOpsViewProps) {
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => b.severity - a.severity);
  }, [patients]);

  const stats = useMemo(() => {
    const total = patients.length;
    const critical = patients.filter(p => p.severity >= 8).length;
    const inTransit = patients.filter(p => p.status === 'In Transit').length;
    const avgSeverity = total > 0 
      ? (patients.reduce((sum, p) => sum + p.severity, 0) / total).toFixed(1)
      : '0';

    return { total, critical, inTransit, avgSeverity };
  }, [patients]);

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-critical text-critical-foreground';
    if (severity >= 5) return 'bg-warning text-warning-foreground';
    return 'bg-success text-success-foreground';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Operation Theatre':
        return 'bg-critical text-critical-foreground';
      case 'Moving to Operation Theatre':
        return 'bg-warning text-warning-foreground';
      case 'Arrived':
        return 'bg-success text-success-foreground';
      case 'Prep Ready':
        return 'bg-success text-success-foreground';
      case 'In Transit':
        return 'bg-warning text-warning-foreground';
      case 'Awaiting Plan Approval':
        return 'bg-accent text-accent-foreground';
      case 'In Waiting Lobby':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Hospital Operations Dashboard</h2>
        <p className="text-muted-foreground">OpsAgent - Real-Time Command Center</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-critical" />
              <span className="text-3xl font-bold">{stats.critical}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold">{stats.inTransit}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-accent" />
              <span className="text-3xl font-bold">{stats.avgSeverity}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>A&E Patient Queue</CardTitle>
          <p className="text-sm text-muted-foreground">Auto-sorted by severity (refreshes in real-time)</p>
        </CardHeader>
        <CardContent>
          {sortedPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients in queue
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPatients.map(patient => (
                    <TableRow key={patient.queue_id}>
                      <TableCell className="font-mono text-sm">{patient.nhs_number}</TableCell>
                      <TableCell className="font-medium">{patient.patient_name}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(patient.severity)}>
                          {patient.severity}/10
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(patient.status)}>
                          {patient.status === 'In Operation Theatre' ? 'Operation Ongoing' : patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.eta_minutes && patient.eta_minutes > 0 ? `${patient.eta_minutes} mins` : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {patient.triage_notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
