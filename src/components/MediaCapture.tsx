import { useState, useRef, useEffect } from 'react';

interface MediaCaptureProps {
  onDetectionResult: (result: any) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

const MediaCapture = ({ onDetectionResult, onProcessingChange }: MediaCaptureProps) => {
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  // Start audio recording
  const startAudioCapture = async () => {
    try {
      // Request audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      audioStreamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      
      // Handle data available event
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data && event.data.size > 0) {
          onProcessingChange(true);
          
          try {
            const formData = new FormData();
            formData.append('media', event.data, `audio_${Date.now()}.wav`);
            
            const response = await fetch('http://localhost:3001/api/detect', {
              method: 'POST',
              body: formData
            });
            
            if (response.ok) {
              const result = await response.json();
              onDetectionResult(result);
            }
          } catch (error) {
            console.error('Audio detection error:', error);
          } finally {
            onProcessingChange(false);
          }
        }
      };
      
      // Set recording interval (2 seconds)
      mediaRecorder.start(2000);
      audioRecorderRef.current = mediaRecorder;
      setIsAudioRecording(true);
    } catch (error) {
      console.error('Error starting audio capture:', error);
    }
  };
  
  // Stop audio recording
  const stopAudioCapture = () => {
    if (audioRecorderRef.current && isAudioRecording) {
      audioRecorderRef.current.stop();
      
      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsAudioRecording(false);
      audioRecorderRef.current = null;
      audioStreamRef.current = null;
    }
  };
  
  // Start recording on mount, stop on unmount
  useEffect(() => {
    startAudioCapture();
    
    return () => {
      stopAudioCapture();
    };
  }, []);
  
  return null; // No UI needed
};

export default MediaCapture;