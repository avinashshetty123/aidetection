import { useState, useRef, useEffect } from 'react';

interface ScreenCaptureProps {
  onDataAvailable: (blob: Blob, type: string) => void;
  isActive: boolean;
}

const ScreenCapture = ({ onDataAvailable, isActive }: ScreenCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Start screen recording
  const startScreenCapture = async () => {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          frameRate: 15
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 1000000 // Lower bitrate for efficiency
      });
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && isActive) {
          onDataAvailable(event.data, 'video');
        }
      };
      
      // Set recording interval (2 seconds)
      mediaRecorder.start(2000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      // Handle stream stop
      stream.getVideoTracks()[0].onended = () => {
        stopScreenCapture();
      };
    } catch (error) {
      console.error('Error starting screen capture:', error);
    }
  };
  
  // Stop screen recording
  const stopScreenCapture = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      setIsRecording(false);
      mediaRecorderRef.current = null;
      streamRef.current = null;
    }
  };
  
  // Handle active state changes
  useEffect(() => {
    if (isActive && !isRecording) {
      startScreenCapture();
    } else if (!isActive && isRecording) {
      stopScreenCapture();
    }
    
    // Clean up on unmount or when isActive changes to false
    return () => {
      if (isRecording) {
        stopScreenCapture();
      }
    };
  }, [isActive]);
  
  return (
    <div className="screen-capture">
      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse-dot"></span>
          Screen Recording
        </div>
      )}
    </div>
  );
};

export default ScreenCapture;