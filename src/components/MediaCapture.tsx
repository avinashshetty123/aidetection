import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, AlertCircle } from 'lucide-react';

interface MediaCaptureProps {
  onDetectionResult: (result: any) => void;
  onProcessingChange: (processing: boolean) => void;
}

const MediaCapture: React.FC<MediaCaptureProps> = ({ onDetectionResult, onProcessingChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string>('');
  const [captureStats, setCaptureStats] = useState({
    videoChunks: 0,
    audioChunks: 0,
    lastCapture: 0
  });

  useEffect(() => {
    startCapture();
    return () => {
      stopCapture();
    };
  }, []);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start periodic capture
      startPeriodicCapture(stream);
      
    } catch (err) {
      console.error('Failed to start capture:', err);
      setError(err instanceof Error ? err.message : 'Failed to access camera/microphone');
    }
  };

  const startPeriodicCapture = (stream: MediaStream) => {
    let videoChunkCount = 0;
    let audioChunkCount = 0;

    // Capture video every 3 seconds
    const captureVideo = () => {
      if (!stream.active) return;
      
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      const videoStream = new MediaStream([videoTrack]);
      const videoRecorder = new MediaRecorder(videoStream, {
        mimeType: 'video/webm;codecs=vp8'
      });

      const chunks: BlobPart[] = [];
      
      videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      videoRecorder.onstop = async () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          await sendToBackend(blob, 'video');
          videoChunkCount++;
          setCaptureStats(prev => ({ 
            ...prev, 
            videoChunks: videoChunkCount,
            lastCapture: Date.now()
          }));
        }
      };

      videoRecorder.start();
      setTimeout(() => {
        if (videoRecorder.state === 'recording') {
          videoRecorder.stop();
        }
      }, 2000); // Record for 2 seconds
    };

    // Capture audio every 2.5 seconds (offset from video)
    const captureAudio = () => {
      if (!stream.active) return;
      
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) return;

      const audioStream = new MediaStream([audioTrack]);
      const audioRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks: BlobPart[] = [];
      
      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      audioRecorder.onstop = async () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          await sendToBackend(blob, 'audio');
          audioChunkCount++;
          setCaptureStats(prev => ({ 
            ...prev, 
            audioChunks: audioChunkCount,
            lastCapture: Date.now()
          }));
        }
      };

      audioRecorder.start();
      setTimeout(() => {
        if (audioRecorder.state === 'recording') {
          audioRecorder.stop();
        }
      }, 2000); // Record for 2 seconds
    };

    // Start capturing with different intervals
    const videoInterval = setInterval(captureVideo, 3000);
    const audioInterval = setInterval(captureAudio, 2500);

    // Initial captures after a short delay
    setTimeout(captureVideo, 1000);
    setTimeout(captureAudio, 1500);

    // Store intervals for cleanup
    (streamRef.current as any)._intervals = [videoInterval, audioInterval];
  };

  const sendToBackend = async (blob: Blob, mediaType: string) => {
    try {
      onProcessingChange(true);
      
      const formData = new FormData();
      formData.append('media', blob, `capture.${mediaType === 'video' ? 'webm' : 'wav'}`);

      const response = await fetch('http://localhost:3001/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      onDetectionResult(result);
      
    } catch (err) {
      console.error('Failed to send to backend:', err);
      setError(`Detection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      onProcessingChange(false);
    }
  };

  const stopCapture = () => {
    if (streamRef.current) {
      // Clear intervals
      const intervals = (streamRef.current as any)._intervals;
      if (intervals) {
        intervals.forEach((interval: NodeJS.Timeout) => clearInterval(interval));
      }
      
      // Stop all tracks
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700 w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-300">Live Capture</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Camera className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-slate-400">{captureStats.videoChunks}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mic className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-slate-400">{captureStats.audioChunks}</span>
            </div>
          </div>
        </div>
        
        {/* Video Preview */}
        <div className="relative mb-3">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-32 bg-slate-900 rounded object-cover"
          />
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-white">LIVE</span>
            </div>
          </div>
        </div>

        {/* Capture Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400">Video Chunks</div>
            <div className="text-blue-400 font-medium">{captureStats.videoChunks}</div>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <div className="text-slate-400">Audio Chunks</div>
            <div className="text-purple-400 font-medium">{captureStats.audioChunks}</div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          </div>
        )}

        {/* Last Capture Time */}
        {captureStats.lastCapture > 0 && (
          <div className="mt-2 text-xs text-slate-500 text-center">
            Last: {new Date(captureStats.lastCapture).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCapture;