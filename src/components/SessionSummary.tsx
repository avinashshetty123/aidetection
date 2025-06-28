import { useState, useEffect } from 'react';

interface SessionData {
  startTime: number;
  endTime: number;
  avgTrustScore: number;
  detectionCount: number;
  suspiciousCount: number;
  overallVerdict: 'AI Generated' | 'Likely Human' | 'Inconclusive';
}

interface SessionSummaryProps {
  isActive: boolean;
  currentSession?: {
    startTime: number;
    detectionCount: number;
    suspiciousCount: number;
    avgTrustScore: number;
  };
}

const SessionSummary = ({ isActive, currentSession }: SessionSummaryProps) => {
  const [pastSessions, setPastSessions] = useState<SessionData[]>([]);
  
  // Load past sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('aiDetectionSessions');
    if (savedSessions) {
      try {
        setPastSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error('Failed to parse saved sessions:', e);
      }
    }
  }, []);
  
  // Save current session when detection stops
  useEffect(() => {
    if (!isActive && currentSession && currentSession.detectionCount > 0) {
      const newSession: SessionData = {
        startTime: currentSession.startTime,
        endTime: Date.now(),
        avgTrustScore: currentSession.avgTrustScore,
        detectionCount: currentSession.detectionCount,
        suspiciousCount: currentSession.suspiciousCount,
        overallVerdict: getVerdict(currentSession.avgTrustScore, currentSession.suspiciousCount / currentSession.detectionCount)
      };
      
      const updatedSessions = [...pastSessions, newSession].slice(-10); // Keep last 10 sessions
      setPastSessions(updatedSessions);
      localStorage.setItem('aiDetectionSessions', JSON.stringify(updatedSessions));
    }
  }, [isActive, currentSession]);
  
  // Determine overall verdict based on trust score and suspicious ratio
  const getVerdict = (trustScore: number, suspiciousRatio: number): 'AI Generated' | 'Likely Human' | 'Inconclusive' => {
    if (trustScore < 50 || suspiciousRatio > 0.3) {
      return 'AI Generated';
    } else if (trustScore > 75 && suspiciousRatio < 0.1) {
      return 'Likely Human';
    } else {
      return 'Inconclusive';
    }
  };
  
  // Calculate overall stats across all sessions
  const calculateOverallStats = () => {
    if (pastSessions.length === 0) return null;
    
    const totalDetections = pastSessions.reduce((sum, session) => sum + session.detectionCount, 0);
    const totalSuspicious = pastSessions.reduce((sum, session) => sum + session.suspiciousCount, 0);
    const avgTrustScore = pastSessions.reduce((sum, session) => sum + session.avgTrustScore * session.detectionCount, 0) / totalDetections;
    
    return {
      totalSessions: pastSessions.length,
      totalDetections,
      totalSuspicious,
      avgTrustScore,
      suspiciousRatio: totalSuspicious / totalDetections,
      overallVerdict: getVerdict(avgTrustScore, totalSuspicious / totalDetections)
    };
  };
  
  const overallStats = calculateOverallStats();
  
  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Detection History</h2>
      
      {overallStats ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Overall Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-slate-700 rounded-md">
              <p className="text-sm text-slate-400">Sessions</p>
              <p className="text-xl font-bold text-white">{overallStats.totalSessions}</p>
            </div>
            <div className="p-3 bg-slate-700 rounded-md">
              <p className="text-sm text-slate-400">Avg Trust Score</p>
              <p className={`text-xl font-bold ${
                overallStats.avgTrustScore > 70 ? 'text-green-400' : 
                overallStats.avgTrustScore > 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(overallStats.avgTrustScore)}%
              </p>
            </div>
            <div className="p-3 bg-slate-700 rounded-md">
              <p className="text-sm text-slate-400">Suspicious Ratio</p>
              <p className={`text-xl font-bold ${
                overallStats.suspiciousRatio < 0.1 ? 'text-green-400' : 
                overallStats.suspiciousRatio < 0.3 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(overallStats.suspiciousRatio * 100)}%
              </p>
            </div>
            <div className="p-3 bg-slate-700 rounded-md">
              <p className="text-sm text-slate-400">Overall Verdict</p>
              <p className={`text-xl font-bold ${
                overallStats.overallVerdict === 'Likely Human' ? 'text-green-400' : 
                overallStats.overallVerdict === 'Inconclusive' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {overallStats.overallVerdict}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400 mb-4">No past sessions recorded yet.</p>
      )}
      
      <h3 className="text-lg font-semibold mb-3">Past Sessions</h3>
      {pastSessions.length > 0 ? (
        <div className="space-y-3">
          {pastSessions.slice().reverse().map((session, index) => (
            <div key={index} className="p-3 bg-slate-700 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">
                  {new Date(session.startTime).toLocaleString()}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${
                  session.overallVerdict === 'Likely Human' ? 'bg-green-900/50 text-green-400' : 
                  session.overallVerdict === 'Inconclusive' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {session.overallVerdict}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Trust Score:</span>
                  <span className={`ml-1 font-medium ${
                    session.avgTrustScore > 70 ? 'text-green-400' : 
                    session.avgTrustScore > 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{Math.round(session.avgTrustScore)}%</span>
                </div>
                <div>
                  <span className="text-slate-400">Detections:</span>
                  <span className="ml-1 font-medium text-blue-400">{session.detectionCount}</span>
                </div>
                <div>
                  <span className="text-slate-400">Suspicious:</span>
                  <span className="ml-1 font-medium text-red-400">{session.suspiciousCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400">No past sessions available.</p>
      )}
      
      {currentSession && isActive && (
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Current Session</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-400">Trust Score</p>
              <p className={`text-xl font-bold ${
                currentSession.avgTrustScore > 70 ? 'text-green-400' : 
                currentSession.avgTrustScore > 40 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(currentSession.avgTrustScore)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Detections</p>
              <p className="text-xl font-bold text-blue-400">{currentSession.detectionCount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Suspicious</p>
              <p className="text-xl font-bold text-red-400">{currentSession.suspiciousCount}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-slate-400">Preliminary Verdict</p>
            <p className={`text-lg font-bold ${
              currentSession.avgTrustScore > 70 && (currentSession.suspiciousCount / currentSession.detectionCount) < 0.1 ? 'text-green-400' : 
              currentSession.avgTrustScore < 50 || (currentSession.suspiciousCount / currentSession.detectionCount) > 0.3 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {currentSession.avgTrustScore > 70 && (currentSession.suspiciousCount / currentSession.detectionCount) < 0.1 ? 'Likely Human' : 
               currentSession.avgTrustScore < 50 || (currentSession.suspiciousCount / currentSession.detectionCount) > 0.3 ? 'AI Generated' : 'Inconclusive'}
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-xs text-slate-500">
        <p>* Sessions are automatically saved when detection is stopped</p>
        <p>* Only the last 10 sessions are stored</p>
      </div>
    </div>
  );
};

export default SessionSummary;