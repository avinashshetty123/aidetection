import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Video, Mic, Settings, History, Play, Pause, Camera, CameraOff, MonitorSmartphone, Upload, FileText, BarChart } from 'lucide-react';
import TrustMeter from './components/TrustMeter';
import LiveMonitor from './components/LiveMonitor';
import EvidencePanel from './components/EvidencePanel';
import MetricsPanel from './components/MetricsPanel';
import SettingsPanel from './components/SettingsPanel';
import MediaCapture from './components/MediaCapture';
import ScreenCapture from './components/ScreenCapture';
import VideoAnalyzer from './components/VideoAnalyzer';
import TextAnalyzer from './components/TextAnalyzer';
import SessionSummary from './components/SessionSummary';
import PerformanceMonitor from './components/PerformanceMonitor';
import TestResponseDetector from './components/TestResponseDetector';
import PlatformIntegration from './components/PlatformIntegration';
import ReportDashboard from './components/ReportDashboard';
import { API_ENDPOINTS } from './config/api';

interface DetectionData {
  timestamp: number;
  videoScore: number;
  audioScore: number;
  overallScore: number;
  alert: boolean;
  confidence?: number;
  processingTime?: number;
}

function App() {
  const [isActive, setIsActive] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string>('');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [currentData, setCurrentData] = useState<DetectionData>({
    timestamp: Date.now(),
    videoScore: 0,
    audioScore: 0,
    overallScore: 0,
    alert: false
  });
  const [activeTab, setActiveTab] = useState<'monitor' | 'evidence' | 'metrics' | 'settings' | 'analyzer' | 'text' | 'summary' | 'test-detector' | 'platform-integration' | 'reports'>('monitor');
  const [connectionRetries, setConnectionRetries] = useState(0);
  const maxRetries = 3;
  const [detectionHistory, setDetectionHistory] = useState<DetectionData[]>([]);
  const [suspiciousSegments, setSuspiciousSegments] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [currentSession, setCurrentSession] = useState<{
    startTime: number;
    detectionCount: number;
    suspiciousCount: number;
    avgTrustScore: number;
  } | null>(null);

  // Check backend status with retry logic
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(API_ENDPOINTS.HEALTH, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          setBackendStatus('online');
          setConnectionRetries(0);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('Backend health check failed:', error);
        setConnectionRetries(prev => prev + 1);
        
        if (connectionRetries < maxRetries) {
          setBackendStatus('checking');
          // Retry after a delay
          setTimeout(checkBackend, 2000 * (connectionRetries + 1));
        } else {
          setBackendStatus('offline');
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [connectionRetries]);

  // Request permissions with proper error handling
  const requestPermissions = async () => {
    if (isRequestingPermissions) return;
    
    setIsRequestingPermissions(true);
    setPermissionError('');
    
    try {
      // Request microphone permission first
      console.log('Requesting microphone permission...');
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100 
        }
      });
      
      // Stop the test stream
      audioStream.getTracks().forEach(track => track.stop());
      console.log('Microphone permission granted');
      
      // Request screen capture permission
      console.log('Requesting screen capture permission...');
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { 
            cursor: "always",
            frameRate: 15
          },
          audio: true
        });
        
        // Stop the test stream
        screenStream.getTracks().forEach(track => track.stop());
        console.log('Screen capture permission granted');
      } catch (screenError) {
        console.warn('Screen capture permission denied, will use audio only:', screenError);
        // Continue with audio-only detection
      }
      
      setHasPermissions(true);
      setPermissionError('');
      console.log('All permissions granted successfully');
      
    } catch (error) {
      console.error('Permission error:', error);
      let errorMessage = 'Permission denied';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera or microphone found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera/microphone not supported in this browser.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setPermissionError(errorMessage);
      setHasPermissions(false);
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  // Handle detection results from MediaCapture component
  const handleDetectionResult = (result: any) => {
    const now = Date.now();
    
    let videoScore = currentData.videoScore;
    let audioScore = currentData.audioScore;
    
    if (result.mediaType === 'video') {
      videoScore = Math.round(result.trustScore * 100);
    } else if (result.mediaType === 'audio') {
      audioScore = Math.round(result.trustScore * 100);
    }
    
    const overallScore = Math.round((videoScore + audioScore) / 2);
    const alert = result.suspicious || overallScore < 50;
    
    const newData: DetectionData = {
      timestamp: now,
      videoScore,
      audioScore,
      overallScore,
      alert,
      confidence: result.confidence,
      processingTime: result.processingTime
    };
    
    setCurrentData(newData);
    setDetectionHistory(prev => [...prev.slice(-49), newData]);
    
    // Add to suspicious segments if flagged
    if (result.suspicious) {
      setSuspiciousSegments(prev => [...prev, {
        id: now,
        timestamp: now,
        type: result.mediaType,
        score: Math.round(result.trustScore * 100),
        duration: 2.0
      }]);
    }
    
    // Update current session data
    if (currentSession) {
      const trustScore = Math.round(result.trustScore * 100);
      const newDetectionCount = currentSession.detectionCount + 1;
      const newSuspiciousCount = currentSession.suspiciousCount + (result.suspicious ? 1 : 0);
      
      const currentTotalScore = currentSession.avgTrustScore * currentSession.detectionCount;
      const newAvgTrustScore = (currentTotalScore + trustScore) / newDetectionCount;
      
      setCurrentSession({
        ...currentSession,
        detectionCount: newDetectionCount,
        suspiciousCount: newSuspiciousCount,
        avgTrustScore: newAvgTrustScore
      });
    }
  };

  const handleToggleDetection = async () => {
    if (!hasPermissions && !isActive) {
      await requestPermissions();
      return;
    }
    
    const newActiveState = !isActive;
    
    if (!newActiveState) {
      // Stopping detection
      setIsActive(false);
      
      setCurrentData({
        ...currentData,
        videoScore: 0,
        audioScore: 0,
      });
      
      try {
        await fetch(API_ENDPOINTS.TOGGLE_RECORDING, {
          method: 'POST'
        });
        
        // Force stop all media tracks
        try {
          document.querySelectorAll('audio, video').forEach(element => {
            const mediaElement = element as HTMLMediaElement;
            if (mediaElement.srcObject instanceof MediaStream) {
              const stream = mediaElement.srcObject;
              stream.getTracks().forEach(track => track.stop());
              mediaElement.srcObject = null;
            }
          });
          
          console.log('All media tracks stopped');
          
          if (window.gc) window.gc();
        } catch (e) {
          console.warn('Error stopping media tracks:', e);
        }
        
      } catch (error) {
        console.error('Failed to toggle recording state:', error);
      }
    } else {
      // Starting detection
      setDetectionHistory([]);
      setCurrentData({
        timestamp: Date.now(),
        videoScore: 0,
        audioScore: 0,
        overallScore: 0,
        alert: false
      });
      
      setCurrentSession({
        startTime: Date.now(),
        detectionCount: 0,
        suspiciousCount: 0,
        avgTrustScore: 0
      });
      
      setIsActive(true);
    }
  };

  const clearSuspiciousSegments = async () => {
    try {
      await fetch(API_ENDPOINTS.SUSPICIOUS, { method: 'DELETE' });
      setSuspiciousSegments([]);
    } catch (error) {
      console.error('Failed to clear suspicious segments:', error);
      setSuspiciousSegments([]);
    }
  };

  // Check permissions on mount
  useEffect(() => {
    const checkExistingPermissions = async () => {
      try {
        const permissions = await Promise.all([
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
          navigator.permissions.query({ name: 'camera' as PermissionName })
        ]);
        
        const hasAudioPermission = permissions[0].state === 'granted';
        const hasCameraPermission = permissions[1].state === 'granted';
        
        if (hasAudioPermission || hasCameraPermission) {
          setHasPermissions(true);
        }
      } catch (error) {
        console.log('Could not check existing permissions:', error);
      }
    };
    
    checkExistingPermissions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">TRUVOICE</h1>
              <p className="text-sm text-slate-400">Real-Time Deepfake Detection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Backend Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-400' : 
                backendStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
              }`}></div>
              <span className="text-slate-300">
                Backend: {backendStatus === 'checking' ? 'Checking...' : backendStatus}
              </span>
            </div>
            
            {/* Detection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-400 animate-pulse' : 
                hasPermissions ? 'bg-slate-600' : 'bg-red-400'
              }`}></div>
              <span className="text-slate-300">
                {!hasPermissions ? 'NO PERMISSIONS' : isActive ? 'MONITORING' : 'INACTIVE'}
              </span>
            </div>
            
            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-sm text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}
            
            <button
              onClick={handleToggleDetection}
              disabled={backendStatus === 'offline' || isRequestingPermissions}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                !hasPermissions 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
              } ${(backendStatus === 'offline' || isRequestingPermissions) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRequestingPermissions ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Requesting...</span>
                </>
              ) : !hasPermissions ? (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Grant Permissions</span>
                </>
              ) : isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Detection</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Detection</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Permission Error */}
        {permissionError && (
          <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">{permissionError}</span>
            </div>
          </div>
        )}
        
        {/* Backend Offline Warning */}
        {backendStatus === 'offline' && (
          <div className="mt-3 p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">
                Backend server offline. Please start the Node.js server: <code className="bg-slate-800 px-2 py-1 rounded">npm run dev:server</code>
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="flex h-[calc(100vh-80px)] bg-slate-900">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-2">
            {[
              { id: 'monitor', label: 'Live Monitor', icon: Video },
              { id: 'analyzer', label: 'Video Analyzer', icon: Upload },
              { id: 'text', label: 'Text Analyzer', icon: FileText },
              { id: 'test-detector', label: 'Test Detector', icon: Shield },
              { id: 'platform-integration', label: 'Platform Integration', icon: MonitorSmartphone },
              { id: 'reports', label: 'Reports', icon: BarChart },
              { id: 'summary', label: 'AI Verdict', icon: History },
              { id: 'evidence', label: 'Evidence', icon: AlertTriangle },
              { id: 'metrics', label: 'Metrics', icon: Mic },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Trust Score Display */}
          <div className="mt-8">
            <TrustMeter 
              score={isActive ? currentData.overallScore : 0}
              isActive={isActive}
              alert={currentData.alert}
            />
          </div>

          {/* Quick Stats */}
          {isActive && (
            <div className="mt-6 space-y-3">
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Video Trust</span>
                  <span className={`text-sm font-medium ${
                    currentData.videoScore > 70 ? 'text-green-400' : 
                    currentData.videoScore > 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {currentData.videoScore}%
                  </span>
                </div>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Audio Trust</span>
                  <span className={`text-sm font-medium ${
                    currentData.audioScore > 70 ? 'text-green-400' : 
                    currentData.audioScore > 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {currentData.audioScore}%
                  </span>
                </div>
              </div>
              <div className="bg-slate-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Alerts</span>
                  <span className="text-sm font-medium text-red-400">
                    {suspiciousSegments.length}
                  </span>
                </div>
              </div>
              {currentData.processingTime && (
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Latency</span>
                    <span className="text-sm font-medium text-blue-400">
                      {Math.round(currentData.processingTime)}ms
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Monitor */}
          <div className="mt-6">
            <PerformanceMonitor 
              isActive={isActive && hasPermissions}
              lastProcessingTime={currentData.processingTime}
            />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-900">
          {/* Media Capture Components */}
          {isActive && hasPermissions && backendStatus === 'online' ? (
            <>
              <ScreenCapture 
                onDataAvailable={(blob, type) => {
                  if (!isActive) return;
                  
                  const formData = new FormData();
                  formData.append('media', blob, `screen_${Date.now()}.webm`);
                  
                  fetch(API_ENDPOINTS.DETECT, {
                    method: 'POST',
                    body: formData
                  })
                  .then(res => res.json())
                  .then(result => {
                    if (isActive) {
                      handleDetectionResult(result);
                    }
                  })
                  .catch(err => console.error('Screen detection error:', err));
                }}
                isActive={isActive}
              />
              <MediaCapture
                onDetectionResult={handleDetectionResult}
                onProcessingChange={setIsProcessing}
              />
            </>
          ) : null}
          
          {activeTab === 'monitor' && (
            <LiveMonitor 
              isActive={isActive && hasPermissions}
              currentData={currentData}
              history={detectionHistory}
            />
          )}
          {activeTab === 'analyzer' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">Video Analysis</h1>
              <p className="text-slate-300 mb-6">
                Upload a video file to analyze it for AI-generated content. 
                The system will process the video and provide a trust score.
              </p>
              <VideoAnalyzer 
                onAnalysisComplete={(result) => {
                  if (result.suspicious) {
                    setSuspiciousSegments(prev => [...prev, {
                      id: Date.now(),
                      timestamp: Date.now(),
                      type: 'video',
                      score: Math.round(result.trustScore * 100),
                      duration: 0
                    }]);
                  }
                }}
              />
            </div>
          )}
          {activeTab === 'text' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">Text Analysis</h1>
              <p className="text-slate-300 mb-6">
                Enter text to analyze it for AI-generated content.
                The system will evaluate the text and provide a trust score.
              </p>
              <TextAnalyzer 
                onAnalysisComplete={(result) => {
                  if (result.suspicious) {
                    setSuspiciousSegments(prev => [...prev, {
                      id: Date.now(),
                      timestamp: Date.now(),
                      type: 'text',
                      score: Math.round(result.trustScore * 100),
                      duration: 0
                    }]);
                  }
                }}
              />
            </div>
          )}
          {activeTab === 'test-detector' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">Academic Test Response Detector</h1>
              <p className="text-slate-300 mb-6">
                Analyze student responses for AI-generated content in academic assessments.
                Designed specifically for educational integrity monitoring.
              </p>
              <TestResponseDetector />
            </div>
          )}
          {activeTab === 'platform-integration' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">Platform Integration</h1>
              <p className="text-slate-300 mb-6">
                Integrate AI detection with Google Forms, Moodle, Canvas, or any testing platform.
                Platform-agnostic solution with real-time alerts and comprehensive reporting.
              </p>
              <PlatformIntegration />
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">Detection Reports</h1>
              <p className="text-slate-300 mb-6">
                Monitor AI detection results across all tests with detailed analytics.
                Export comprehensive reports for academic integrity documentation.
              </p>
              <ReportDashboard />
            </div>
          )}
          {activeTab === 'evidence' && (
            <EvidencePanel 
              segments={suspiciousSegments}
              onClearAll={clearSuspiciousSegments}
            />
          )}
          {activeTab === 'metrics' && (
            <MetricsPanel 
              history={detectionHistory}
              isActive={isActive && hasPermissions}
            />
          )}
          {activeTab === 'summary' && (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6">AI Detection Verdict</h1>
              <p className="text-slate-300 mb-6">
                View your detection session history and overall AI detection verdict.
                The system analyzes patterns across all your detection sessions.
              </p>
              <SessionSummary 
                isActive={isActive}
                currentSession={currentSession || undefined}
              />
            </div>
          )}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

// Add the following after the main App component, before export
export default App;