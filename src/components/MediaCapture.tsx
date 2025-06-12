import { useState, useRef, useEffect } from 'react';

interface MediaCaptureProps {
  onDetectionResult: (result: any) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

const MediaCapture = ({ onDetectionResult, onProcessingChange }: MediaCaptureProps) => {
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  
  // Start audio recording
  const startAudioCapture = async () => {
    if (!isComponentMounted.current) return;
    
    try {
      // Request audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      // Check if component is still mounted
      if (!isComponentMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      audioStreamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      
      // Handle data available event
      mediaRecorder.ondataavailable = async (event) => {
        // Check if component is still mounted and recording
        if (!isComponentMounted.current || !isAudioRecording) {
          return;
        }
        
        if (event.data && event.data.size > 0) {
          onProcessingChange(true);
          
          try {
            // Double check component is still mounted
            if (!isComponentMounted.current) {
              onProcessingChange(false);
              return;
            }
            
            const formData = new FormData();
            formData.append('media', event.data, `audio_${Date.now()}.wav`);
            
            const response = await fetch('http://localhost:3001/api/detect', {
              method: 'POST',
              body: formData
            });
            
            // Check again if component is still mounted
            if (!isComponentMounted.current) {
              onProcessingChange(false);
              return;
            }
            
            if (response.ok) {
              const result = await response.json();
              onDetectionResult(result);
            }
          } catch (error) {
            console.error('Audio detection error:', error);
          } finally {
            if (isComponentMounted.current) {
              onProcessingChange(false);
            }
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
    setIsAudioRecording(false);
    
    if (audioRecorderRef.current) {
      try {
        audioRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping audio recorder:', e);
      }
      
      // Stop all tracks
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping audio track:', e);
          }
        });
      }
      
      audioRecorderRef.current = null;
      audioStreamRef.current = null;
    }
  };
  
  // Start recording on mount, stop on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    startAudioCapture();
    
    return () => {
      isComponentMounted.current = false;
      stopAudioCapture();
    };
  }, []);
  
  return null; // No UI needed
};

export default MediaCapture;