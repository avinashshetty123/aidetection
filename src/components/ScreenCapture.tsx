import { useState, useRef, useEffect } from 'react';

interface ScreenCaptureProps {
  onDataAvailable: (blob: Blob, type: string) => void;
  isActive: boolean;
}

const ScreenCapture = ({ onDataAvailable, isActive }: ScreenCaptureProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [screenError, setScreenError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start screen recording with enhanced error handling
  const startScreenCapture = async () => {
    if (hasStartedRef.current) return;
    
    try {
      hasStartedRef.current = true;
      setScreenError('');
      console.log('Starting screen capture...');
      
      // Request screen capture with enhanced options
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          cursor: "always",
          frameRate: { ideal: 15, max: 30 },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      console.log('Screen capture stream obtained successfully');
      
      // Check MediaRecorder support
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      // Create media recorder with optimized settings
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1000000 // 1 Mbps for good quality/performance balance
      });
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && isActive) {
          console.log(`Screen data available: ${event.data.size} bytes`);
          onDataAvailable(event.data, 'video');
        }
      };
      
      // Handle recorder errors
      mediaRecorder.onerror = (event) => {
        console.error('Screen MediaRecorder error:', event);
        setScreenError('Screen recording error occurred');
        restartScreenCapture();
      };
      
      // Handle recorder state changes
      mediaRecorder.onstart = () => {
        console.log('Screen MediaRecorder started');
        setIsRecording(true);
      };
      
      mediaRecorder.onstop = () => {
        console.log('Screen MediaRecorder stopped');
        setIsRecording(false);
      };
      
      // Start recording with 2-second intervals
      mediaRecorder.start(2000);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing ended by user');
        stopScreenCapture();
      };
      
      // Handle audio track end if present
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].onended = () => {
          console.log('Screen audio track ended');
        };
      }
      
    } catch (error) {
      console.error('Error starting screen capture:', error);
      hasStartedRef.current = false;
      
      let errorMessage = 'Failed to start screen capture';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No screen available for capture';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Screen capture not supported';
        } else if (error.name === 'AbortError') {
          errorMessage = 'Screen capture cancelled by user';
        } else {
          errorMessage = error.message;
        }
      }
      
      setScreenError(errorMessage);
      
      // Don't retry if user cancelled
      if (error instanceof Error && error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        retryTimeoutRef.current = setTimeout(() => {
          if (isActive) {
            console.log('Retrying screen capture...');
            startScreenCapture();
          }
        }, 10000); // Retry after 10 seconds
      }
    }
  };
  
  // Restart screen capture
  const restartScreenCapture = () => {
    console.log('Restarting screen capture...');
    stopScreenCapture();
    
    if (isActive) {
      setTimeout(() => {
        if (isActive) {
          startScreenCapture();
        }
      }, 2000);
    }
  };
  
  // Stop screen recording
  const stopScreenCapture = () => {
    console.log('Stopping screen capture...');
    setIsRecording(false);
    setScreenError('');
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping screen media recorder:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping screen track:', e);
        }
      });
      streamRef.current = null;
    }
    
    hasStartedRef.current = false;
  };
  
  // Handle active state changes
  useEffect(() => {
    if (isActive && !isRecording && !hasStartedRef.current) {
      console.log('Screen capture activated, starting...');
      startScreenCapture();
    } else if (!isActive) {
      console.log('Screen capture deactivated, stopping...');
      stopScreenCapture();
    }
    
    return () => {
      stopScreenCapture();
    };
  }, [isActive]);
  
  // Show error state if needed (for debugging)
  if (screenError) {
    console.warn('Screen capture error:', screenError);
  }
  
  return (
    <div className="screen-capture">
      {isRecording && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Recording Screen</span>
        </div>
      )}
    </div>
  );
};

export default ScreenCapture;