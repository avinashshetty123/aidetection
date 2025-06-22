import { useState, useRef, useEffect } from 'react';

interface MediaCaptureProps {
  onDetectionResult: (result: any) => void;
  onProcessingChange: (isProcessing: boolean) => void;
}

const MediaCapture = ({ onDetectionResult, onProcessingChange }: MediaCaptureProps) => {
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isComponentMounted = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start audio recording with enhanced error handling
  const startAudioCapture = async () => {
    if (!isComponentMounted.current) return;
    
    try {
      console.log('Starting audio capture...');
      setAudioError('');
      
      // Request audio with enhanced settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      if (!isComponentMounted.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      audioStreamRef.current = stream;
      console.log('Audio stream obtained successfully');
      
      // Check MediaRecorder support with fallback
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            throw new Error('No supported audio format available');
          }
        }
      }
      
      // Create media recorder with error handling
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      // Handle data available event with improved error handling
      mediaRecorder.ondataavailable = async (event) => {
        if (!isComponentMounted.current || !isAudioRecording) {
          return;
        }
        
        if (event.data && event.data.size > 0) {
          console.log(`Audio data available: ${event.data.size} bytes`);
          onProcessingChange(true);
          
          try {
            if (!isComponentMounted.current) {
              onProcessingChange(false);
              return;
            }
            
            const formData = new FormData();
            const extension = mimeType.includes('webm') ? '.webm' : mimeType.includes('mp4') ? '.mp4' : '.wav';
            formData.append('media', event.data, `audio_${Date.now()}${extension}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch('http://localhost:3001/api/detect', {
              method: 'POST',
              body: formData,
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!isComponentMounted.current) {
              onProcessingChange(false);
              return;
            }
            
            if (response.ok) {
              const result = await response.json();
              console.log('Audio detection result:', result);
              onDetectionResult(result);
            } else {
              console.error('Audio detection failed:', response.status, response.statusText);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn('Audio detection request timed out');
            } else {
              console.error('Audio detection error:', error);
            }
          } finally {
            if (isComponentMounted.current) {
              onProcessingChange(false);
            }
          }
        }
      };
      
      // Handle recorder errors
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setAudioError('Recording error occurred');
        restartAudioCapture();
      };
      
      // Handle recorder state changes
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
        setIsAudioRecording(true);
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
        setIsAudioRecording(false);
      };
      
      // Start recording with 2-second intervals
      mediaRecorder.start(2000);
      audioRecorderRef.current = mediaRecorder;
      
      // Handle stream errors
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          console.log('Audio track ended');
          restartAudioCapture();
        };
      });
      
    } catch (error) {
      console.error('Error starting audio capture:', error);
      
      let errorMessage = 'Failed to start audio capture';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Audio recording not supported';
        } else {
          errorMessage = error.message;
        }
      }
      
      setAudioError(errorMessage);
      
      // Retry after 5 seconds
      if (isComponentMounted.current) {
        retryTimeoutRef.current = setTimeout(() => {
          if (isComponentMounted.current) {
            console.log('Retrying audio capture...');
            startAudioCapture();
          }
        }, 5000);
      }
    }
  };
  
  // Restart audio capture
  const restartAudioCapture = () => {
    console.log('Restarting audio capture...');
    stopAudioCapture();
    
    if (isComponentMounted.current) {
      setTimeout(() => {
        if (isComponentMounted.current) {
          startAudioCapture();
        }
      }, 1000);
    }
  };
  
  // Stop audio recording
  const stopAudioCapture = () => {
    console.log('Stopping audio capture...');
    setIsAudioRecording(false);
    setAudioError('');
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (audioRecorderRef.current) {
      try {
        if (audioRecorderRef.current.state !== 'inactive') {
          audioRecorderRef.current.stop();
        }
      } catch (e) {
        console.warn('Error stopping audio recorder:', e);
      }
      
      audioRecorderRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping audio track:', e);
        }
      });
      audioStreamRef.current = null;
    }
  };
  
  // Start recording on mount, stop on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    console.log('MediaCapture component mounted, starting audio capture...');
    startAudioCapture();
    
    return () => {
      console.log('MediaCapture component unmounting, stopping audio capture...');
      isComponentMounted.current = false;
      stopAudioCapture();
    };
  }, []);
  
  // Show error state if needed (for debugging)
  if (audioError) {
    console.warn('Audio capture error:', audioError);
  }
  
  return null; // No UI needed
};

export default MediaCapture;