import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Navigation, Clock, MapPin, Radio } from 'lucide-react';

interface AmbulanceMapProps {
  patientName: string;
  eta: number;
  dispatchTime?: number;
  reverseDirection?: boolean; // When true, ambulance goes from hospital to patient
  onArrival?: () => void; // Callback when ambulance reaches destination
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

export function AmbulanceMap({ patientName, eta, dispatchTime, reverseDirection = false, onArrival }: AmbulanceMapProps) {
  const [progress, setProgress] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);

  useEffect(() => {
    if (!dispatchTime) {
      // Fallback to simple animation if no dispatch time
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 100));
      }, 500);
      return () => clearInterval(interval);
    }

    // Calculate progress based on elapsed time since dispatch
    const totalDuration = eta * 60 * 1000; // Convert minutes to milliseconds
    
    // Set initial state based on elapsed time
    const initialElapsed = Date.now() - dispatchTime;
    const initialProgress = Math.min((initialElapsed / totalDuration) * 100, 100);
    
    setProgress(initialProgress);
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - dispatchTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(newProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatchTime, eta]);

  // Calculate remaining time based on progress and original ETA
  const totalSeconds = eta * 60;
  const remainingSeconds = Math.max(totalSeconds * (1 - progress / 100), 0);
  
  // Calculate remaining distance based on progress (assuming 4.5km total distance)
  const totalDistance = 4.5;
  const remainingDistance = totalDistance * (1 - progress / 100);

  // Trigger arrival callback when ambulance reaches destination
  useEffect(() => {
    if (progress >= 100 && !hasArrived && onArrival) {
      console.log(`[AmbulanceMap DEBUG]: Progress reached 100%, triggering onArrival callback for ${patientName}`);
      setHasArrived(true);
      onArrival();
    } else if (progress >= 100 && hasArrived) {
      console.log(`[AmbulanceMap DEBUG]: Progress at 100% but hasArrived already true for ${patientName}`);
    } else if (progress >= 100 && !onArrival) {
      console.log(`[AmbulanceMap DEBUG]: Progress at 100% but no onArrival callback provided for ${patientName}`);
    }
  }, [progress, hasArrived, onArrival, patientName]);

  // Calculate ambulance position along the bezier curve path
  const getPointOnPath = (t: number, reverse: boolean) => {
    // Bezier path segments
    if (reverse) {
      // M 700 100 Q 600 130, 500 160 Q 400 190, 300 220 Q 200 250, 50 300
      if (t <= 0.33) {
        const segT = t / 0.33;
        return {
          x: (1-segT)*(1-segT)*700 + 2*(1-segT)*segT*600 + segT*segT*500,
          y: (1-segT)*(1-segT)*100 + 2*(1-segT)*segT*130 + segT*segT*160
        };
      } else if (t <= 0.66) {
        const segT = (t - 0.33) / 0.33;
        return {
          x: (1-segT)*(1-segT)*500 + 2*(1-segT)*segT*400 + segT*segT*300,
          y: (1-segT)*(1-segT)*160 + 2*(1-segT)*segT*190 + segT*segT*220
        };
      } else {
        const segT = (t - 0.66) / 0.34;
        return {
          x: (1-segT)*(1-segT)*300 + 2*(1-segT)*segT*200 + segT*segT*50,
          y: (1-segT)*(1-segT)*220 + 2*(1-segT)*segT*250 + segT*segT*300
        };
      }
    } else {
      // M 50 300 Q 200 250, 300 220 Q 400 190, 500 160 Q 600 130, 700 100
      if (t <= 0.33) {
        const segT = t / 0.33;
        return {
          x: (1-segT)*(1-segT)*50 + 2*(1-segT)*segT*200 + segT*segT*300,
          y: (1-segT)*(1-segT)*300 + 2*(1-segT)*segT*250 + segT*segT*220
        };
      } else if (t <= 0.66) {
        const segT = (t - 0.33) / 0.33;
        return {
          x: (1-segT)*(1-segT)*300 + 2*(1-segT)*segT*400 + segT*segT*500,
          y: (1-segT)*(1-segT)*220 + 2*(1-segT)*segT*190 + segT*segT*160
        };
      } else {
        const segT = (t - 0.66) / 0.34;
        return {
          x: (1-segT)*(1-segT)*500 + 2*(1-segT)*segT*600 + segT*segT*700,
          y: (1-segT)*(1-segT)*160 + 2*(1-segT)*segT*130 + segT*segT*100
        };
      }
    }
  };

  const pathPoint = getPointOnPath(progress / 100, reverseDirection);
  const ambulanceX = (pathPoint.x / 800) * 100; // Convert to percentage of viewBox
  const ambulanceY = (pathPoint.y / 400) * 100; // Convert to percentage of viewBox

  return (
    <Card className="overflow-hidden border-2 border-critical/20 glass-strong">
      <div className="relative w-full aspect-video bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Street grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-10" style={{ zIndex: 0 }} preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Top Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-background/95 to-background/60 backdrop-blur-sm border-b border-border/50 p-3">
          <div className="flex items-center justify-between max-w-full">
            <div className="flex items-center gap-3">
              <div className="bg-critical/10 p-2 rounded-lg border border-critical/20">
                <Navigation className="h-4 w-4 text-critical animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{patientName}</p>
                <p className="text-xs text-muted-foreground">Emergency Transport - Code Red</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-2 py-1 bg-critical/10 rounded-lg border border-critical/20">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-critical"></span>
                </div>
                <span className="text-xs font-semibold text-critical">LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Map content */}
        <div className="absolute inset-0 pt-20 pb-24" style={{ zIndex: 1 }}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
            <defs>
              {/* Glow filter for ambulance */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Route path - Base (full route in gray - untraveled) */}
            <path
              d={reverseDirection 
                ? "M 700 100 Q 600 130, 500 160 Q 400 190, 300 220 Q 200 250, 50 300"
                : "M 50 300 Q 200 250, 300 220 Q 400 190, 500 160 Q 600 130, 700 100"
              }
              stroke="hsl(var(--muted-foreground))"
              strokeOpacity="0.3"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="15,10"
            />
            
            {/* Route path - Traveled portion (blue) with mask effect */}
            <path
              d={reverseDirection 
                ? "M 700 100 Q 600 130, 500 160 Q 400 190, 300 220 Q 200 250, 50 300"
                : "M 50 300 Q 200 250, 300 220 Q 400 190, 500 160 Q 600 130, 700 100"
              }
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="100"
              pathLength="100"
              strokeDashoffset={100 - progress}
              style={{ 
                transition: 'stroke-dashoffset 500ms linear'
              }}
            />
            
            {/* Waypoint markers */}
            <circle cx="300" cy="220" r="5" fill="hsl(var(--primary))" opacity="0.5" />
            <circle cx="500" cy="160" r="5" fill="hsl(var(--primary))" opacity="0.5" />
          </svg>

          {/* Ambulance (moving) */}
          <div 
            className="absolute transition-all duration-500 ease-linear" 
            style={{ 
              left: `${ambulanceX}%`, 
              top: `${ambulanceY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}
          >
            {/* Pulse rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-16 h-16 bg-critical/20 rounded-full animate-ping" />
              <div className="absolute w-12 h-12 bg-critical/30 rounded-full animate-pulse" />
            </div>
            
            {/* Ambulance icon */}
            <div className="relative bg-critical text-critical-foreground rounded-full p-3 shadow-premium border-2 border-background">
              <Navigation className="h-6 w-6" style={{ transform: 'rotate(45deg)' }} />
              
              {/* Speed indicator */}
              <div className="absolute -top-1 -right-1 bg-background border-2 border-critical rounded-full p-0.5">
                <Radio className="h-2 w-2 text-critical animate-pulse" />
              </div>
            </div>
          </div>

          {/* Start point - Hospital or Patient depending on direction */}
          <div className="absolute z-10" style={reverseDirection ? { right: '6%', top: '18%' } : { left: '3%', bottom: '37%' }}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg w-12 h-12 -translate-x-1/4 -translate-y-1/4" />
              
              {/* Icon */}
              <div className="relative bg-primary text-primary-foreground rounded-full p-3 shadow-premium border-2 border-background">
                <MapPin className="h-5 w-5" />
              </div>
              
              {/* Compact Label */}
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="glass px-2 py-1 rounded-md border border-primary/30 shadow-lg">
                  <p className="text-xs font-semibold text-primary">
                    {reverseDirection ? "Hospital" : patientName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* End point - Patient or Hospital depending on direction */}
          <div className="absolute z-10" style={reverseDirection ? { left: '3%', bottom: '37%' } : { right: '6%', top: '18%' }}>
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-success/20 rounded-full blur-lg w-12 h-12 -translate-x-1/4 -translate-y-1/4" />
              
              {/* Icon */}
              <div className="relative bg-success text-success-foreground rounded-full p-3 shadow-premium border-2 border-background">
                <MapPin className="h-5 w-5" />
              </div>
              
              {/* Compact Label */}
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="glass px-2 py-1 rounded-md border border-success/30 shadow-lg">
                  <p className="text-xs font-semibold text-success">
                    {reverseDirection ? patientName : "Hospital"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background/95 to-background/60 backdrop-blur-sm border-t border-border/50 p-3" style={{ zIndex: 2 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-border/50">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-bold text-foreground">{remainingDistance.toFixed(1)} km</p>
              </div>
            </div>
            
            {/* ETA */}
            <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg border border-critical/30">
              <Clock className="h-4 w-4 text-critical" />
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="text-sm font-bold text-critical">{formatTime(remainingSeconds)}</p>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden border border-border/30">
            <div 
              className="h-full bg-gradient-to-r from-primary via-critical to-success transition-all duration-500 ease-linear relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-1">
            <span>Dispatched</span>
            <span>{progress.toFixed(0)}%</span>
            <span>Arriving</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
