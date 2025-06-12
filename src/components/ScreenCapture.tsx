import { useState, useRef, useEffect } from 'react';

interface ScreenCaptureProps {
  onDataAvailable: (blob: Blob, type: string) => void;
  isActive: boolean;
}

const ScreenCapture = ({ onDataAvailable, isActive }: ScreenCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  
  // Start screen recording
  const startScreenCapture = async () => {
    // Prevent multiple dialog prompts
    if (hasStartedRef.current) return;
    
    try {
      hasStartedRef.current = true;
      
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
      hasStartedRef.current = false;
    }
  };
  
  // Stop screen recording
  const stopScreenCapture = () => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
      }
      
      setIsRecording(false);
      mediaRecorderRef.current = null;
      streamRef.current = null;
      hasStartedRef.current = false;
    }
  };
  
  // Handle active state changes
  useEffect(() => {
    if (isActive && !isRecording) {
      startScreenCapture();
    } else if (!isActive) {
      stopScreenCapture();
    }
    
    // Clean up on unmount
    return () => {
      stopScreenCapture();
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