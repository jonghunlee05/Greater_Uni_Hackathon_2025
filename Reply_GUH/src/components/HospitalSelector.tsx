import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity, TrendingUp } from 'lucide-react';

export interface Hospital {
  id: string;
  name: string;
  distance: number;
  capacity: number;
  maxCapacity: number;
  isNearest: boolean;
  isFreest: boolean;
}

interface HospitalSelectorProps {
  onHospitalsUpdate?: (hospitals: Hospital[]) => void;
}

export function HospitalSelector({ onHospitalsUpdate }: HospitalSelectorProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 });

  useEffect(() => {
    // Simulate getting user GPS location (fake data)
    const fakeLocation = {
      lat: 51.5074 + (Math.random() - 0.5) * 0.1,
      lng: -0.1278 + (Math.random() - 0.5) * 0.1
    };
    setUserLocation(fakeLocation);

    // Simulate nearby hospitals with dynamic capacity updates
    const updateHospitals = () => {
      const hospitalData: Hospital[] = [
        {
          id: 'H001',
          name: 'City General Hospital',
          distance: 2.3,
          capacity: Math.floor(Math.random() * 30) + 40,
          maxCapacity: 100,
          isNearest: true,
          isFreest: false
        },
        {
          id: 'H002',
          name: 'St. Mary\'s Medical Center',
          distance: 4.1,
          capacity: Math.floor(Math.random() * 20) + 15,
          maxCapacity: 80,
          isNearest: false,
          isFreest: true
        },
        {
          id: 'H003',
          name: 'University Hospital',
          distance: 5.8,
          capacity: Math.floor(Math.random() * 35) + 55,
          maxCapacity: 120,
          isNearest: false,
          isFreest: false
        }
      ];

      // Mark the freest hospital
      const freest = hospitalData.reduce((prev, curr) => 
        (curr.capacity / curr.maxCapacity) < (prev.capacity / prev.maxCapacity) ? curr : prev
      );
      hospitalData.forEach(h => h.isFreest = h.id === freest.id);

      setHospitals(hospitalData);
      onHospitalsUpdate?.(hospitalData);
    };

    updateHospitals();
    const interval = setInterval(updateHospitals, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getCapacityColor = (capacity: number, maxCapacity: number) => {
    const percentage = (capacity / maxCapacity) * 100;
    if (percentage >= 80) return 'text-critical';
    if (percentage >= 60) return 'text-warning';
    return 'text-success';
  };

  const getCapacityLabel = (capacity: number, maxCapacity: number) => {
    const percentage = (capacity / maxCapacity) * 100;
    if (percentage >= 80) return 'High Load';
    if (percentage >= 60) return 'Moderate';
    return 'Available';
  };

  const nearest = hospitals.find(h => h.isNearest);
  const freest = hospitals.find(h => h.isFreest);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Nearby Hospitals
          <Badge variant="outline" className="ml-auto">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground mb-4">
          📍 Your location: {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nearest Hospital */}
          {nearest && (
            <div className="p-4 bg-background rounded-lg border-2 border-primary/30 relative overflow-hidden">
              <Badge className="absolute top-2 right-2 bg-primary">Nearest</Badge>
              <div className="space-y-2 pr-20">
                <h3 className="font-bold text-foreground">{nearest.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{nearest.distance} km away</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Capacity</span>
                    <span className={`text-sm font-bold ${getCapacityColor(nearest.capacity, nearest.maxCapacity)}`}>
                      {getCapacityLabel(nearest.capacity, nearest.maxCapacity)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (nearest.capacity / nearest.maxCapacity) >= 0.8 ? 'bg-critical' :
                        (nearest.capacity / nearest.maxCapacity) >= 0.6 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${(nearest.capacity / nearest.maxCapacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nearest.capacity}/{nearest.maxCapacity} beds occupied
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Freest Hospital */}
          {freest && (
            <div className="p-4 bg-background rounded-lg border-2 border-success/30 relative overflow-hidden">
              <Badge className="absolute top-2 right-2 bg-success">Most Available</Badge>
              <div className="space-y-2 pr-20">
                <h3 className="font-bold text-foreground">{freest.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{freest.distance} km away</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Capacity</span>
                    <span className={`text-sm font-bold ${getCapacityColor(freest.capacity, freest.maxCapacity)}`}>
                      {getCapacityLabel(freest.capacity, freest.maxCapacity)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (freest.capacity / freest.maxCapacity) >= 0.8 ? 'bg-critical' :
                        (freest.capacity / freest.maxCapacity) >= 0.6 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${(freest.capacity / freest.maxCapacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {freest.capacity}/{freest.maxCapacity} beds occupied
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Hospitals List */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            All Nearby Hospitals
          </p>
          <div className="space-y-2">
            {hospitals.map(hospital => (
              <div key={hospital.id} className="flex items-center justify-between text-xs p-2 bg-background/50 rounded">
                <span className="font-medium">{hospital.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{hospital.distance} km</span>
                  <span className={`font-bold ${getCapacityColor(hospital.capacity, hospital.maxCapacity)}`}>
                    {hospital.capacity}/{hospital.maxCapacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
