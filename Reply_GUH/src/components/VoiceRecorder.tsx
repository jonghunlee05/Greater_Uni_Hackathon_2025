import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  formType: 'patient' | 'responder';
  label?: string;
}

export function VoiceRecorder({ onTranscription, formType, label = "Voice Input" }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      console.log('[VoiceRecorder]: Transcribing audio...');
      
      // Step 1: Transcribe audio using Eleven Labs
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (transcriptionError) throw transcriptionError;
      
      const rawText = transcriptionData.text;
      console.log('[VoiceRecorder]: Raw transcription:', rawText);

      // Step 2: Structure the text using AI
      console.log('[VoiceRecorder]: Structuring text...');
      const { data: structuredData, error: structureError } = await supabase.functions.invoke('structure-medical-text', {
        body: { 
          text: rawText,
          formType 
        }
      });

      if (structureError) throw structureError;

      console.log('[VoiceRecorder]: Text structured successfully');
      
      // Return structured text to parent component
      if (formType === 'responder' && structuredData.structured?.symptoms) {
        onTranscription(JSON.stringify(structuredData.structured));
      } else {
        onTranscription(structuredData.structured);
      }

      toast({
        title: "Voice input processed",
        description: "Your input has been transcribed and structured",
      });

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "default"}
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <Square className="h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
      {isRecording && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Recording...</span>
        </div>
      )}
    </div>
  );
}
