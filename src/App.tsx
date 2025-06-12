import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Video, Mic, Settings, History, Play, Pause, Camera, CameraOff } from 'lucide-react';
import TrustMeter from './components/TrustMeter';
import LiveMonitor from './components/LiveMonitor';
import EvidencePanel from './components/EvidencePanel';
import MetricsPanel from './components/MetricsPanel';
import SettingsPanel from './components/SettingsPanel';
import MediaCapture from './components/MediaCapture';

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
  const [currentData, setCurrentData] = useState<DetectionData>({
    timestamp: Date.now(),
    videoScore: 0,
    audioScore: 0,
    overallScore: 0,
    alert: false
  });
  const [activeTab, setActiveTab] = useState<'monitor' | 'evidence' | 'metrics' | 'settings'>('monitor');
  const [detectionHistory, setDetectionHistory] = useState<DetectionData[]>([]);
  const [suspiciousSegments, setSuspiciousSegments] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check backend status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Request camera and microphone permissions
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: { sampleRate: 44100 }
      });
      
      setHasPermissions(true);
      setPermissionError('');
      
      // Stop the stream immediately - we'll create new ones when needed
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionError(error instanceof Error ? error.message : 'Permission denied');
      setHasPermissions(false);
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
  };

  const handleToggleDetection = () => {
    if (!hasPermissions) {
      requestPermissions();
      return;
    }
    
    setIsActive(!isActive);
    if (!isActive) {
      setDetectionHistory([]);
      setCurrentData({
        timestamp: Date.now(),
        videoScore: 0,
        audioScore: 0,
        overallScore: 0,
        alert: false
      });
    }
  };

  const clearSuspiciousSegments = async () => {
    try {
      await fetch('http://localhost:3001/api/suspicious', { method: 'DELETE' });
      setSuspiciousSegments([]);
    } catch (error) {
      console.error('Failed to clear suspicious segments:', error);
      setSuspiciousSegments([]);
    }
  };

  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
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
              disabled={backendStatus === 'offline'}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                !hasPermissions 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : isActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
              } ${backendStatus === 'offline' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {!hasPermissions ? (
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
              <span className="text-sm text-red-300">
                Camera/Microphone access required: {permissionError}
              </span>
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

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-slate-800 border-r border-slate-700 p-4">
          <div className="space-y-2">
            {[
              { id: 'monitor', label: 'Live Monitor', icon: Video },
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
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Media Capture Component */}
          {isActive && hasPermissions && backendStatus === 'online' && (
            <MediaCapture
              onDetectionResult={handleDetectionResult}
              onProcessingChange={setIsProcessing}
            />
          )}
          
          {activeTab === 'monitor' && (
            <LiveMonitor 
              isActive={isActive && hasPermissions}
              currentData={currentData}
              history={detectionHistory}
            />
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
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;