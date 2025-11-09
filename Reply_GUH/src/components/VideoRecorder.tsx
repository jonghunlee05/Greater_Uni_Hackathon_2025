import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, VideoOff, Circle, Square } from 'lucide-react';

export function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    setIsDialogOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingTime(0);
    setIsDialogOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Live Camera Demo (for demonstration)</p>
          
          <Button
            onClick={startCamera}
            size="sm"
            className="w-full"
          >
            <Video className="h-4 w-4 mr-2" />
            Activate Camera
          </Button>

          <p className="text-xs text-muted-foreground">
            Click to demonstrate live video assessment capability
          </p>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) stopCamera();
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Video Assessment
            </DialogTitle>
            <DialogDescription>
              {isRecording ? 'Recording patient assessment...' : 'Camera active - Ready to record'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              {isRecording && (
                <div className="absolute top-4 right-4 bg-critical text-critical-foreground px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                  <Circle className="h-3 w-3 fill-current animate-pulse" />
                  REC {formatTime(recordingTime)}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="flex-1"
                  variant="default"
                >
                  <Circle className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="flex-1"
                  variant="destructive"
                >
                  <Square className="h-5 w-5 mr-2" />
                  Stop Recording
                </Button>
              )}
              
              <Button
                onClick={stopCamera}
                size="lg"
                variant="secondary"
              >
                <VideoOff className="h-5 w-5 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
