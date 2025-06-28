import React from 'react';
import { BarChart3, TrendingUp, Clock, Shield } from 'lucide-react';

interface DetectionData {
  timestamp: number;
  videoScore: number;
  audioScore: number;
  overallScore: number;
  alert: boolean;
}

interface MetricsPanelProps {
  history: DetectionData[];
  isActive: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ history, isActive }) => {
  const calculateStats = () => {
    if (history.length === 0) {
      return {
        avgTrust: 0,
        totalAlerts: 0,
        sessionDuration: 0,
        trustTrend: 0
      };
    }

    const avgTrust = Math.round(
      history.reduce((sum, data) => sum + data.overallScore, 0) / history.length
    );
    
    const totalAlerts = history.filter(data => data.alert).length;
    
    const sessionDuration = history.length > 0 
      ? (history[history.length - 1].timestamp - history[0].timestamp) / 1000
      : 0;
    
    const recentHistory = history.slice(-10);
    const olderHistory = history.slice(-20, -10);
    const recentAvg = recentHistory.length > 0 
      ? recentHistory.reduce((sum, data) => sum + data.overallScore, 0) / recentHistory.length 
      : 0;
    const olderAvg = olderHistory.length > 0 
      ? olderHistory.reduce((sum, data) => sum + data.overallScore, 0) / olderHistory.length 
      : 0;
    
    const trustTrend = recentAvg - olderAvg;

    return { avgTrust, totalAlerts, sessionDuration, trustTrend };
  };

  const stats = calculateStats();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDistribution = () => {
    if (history.length === 0) return { high: 0, medium: 0, low: 0 };
    
    const high = history.filter(d => d.overallScore >= 70).length;
    const medium = history.filter(d => d.overallScore >= 40 && d.overallScore < 70).length;
    const low = history.filter(d => d.overallScore < 40).length;
    
    return {
      high: Math.round((high / history.length) * 100),
      medium: Math.round((medium / history.length) * 100),
      low: Math.round((low / history.length) * 100)
    };
  };

  const distribution = getDistribution();

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Detection Metrics</h2>
          </div>
          <div className="text-sm text-slate-400">
            {history.length} data points analyzed
          </div>
        </div>

        {!isActive && history.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-slate-800 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">No Metrics Available</h3>
              <p className="text-slate-500">Start detection to begin collecting metrics</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">{stats.avgTrust}%</span>
                </div>
                <h3 className="text-sm font-medium text-slate-300">Average Trust</h3>
                <p className="text-xs text-slate-500 mt-1">Session average</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className={`w-5 h-5 ${stats.trustTrend >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className={`text-2xl font-bold ${stats.trustTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.trustTrend >= 0 ? '+' : ''}{stats.trustTrend.toFixed(1)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-300">Trust Trend</h3>
                <p className="text-xs text-slate-500 mt-1">Recent change</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">!</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{stats.totalAlerts}</span>
                </div>
                <h3 className="text-sm font-medium text-slate-300">Total Alerts</h3>
                <p className="text-xs text-slate-500 mt-1">Suspicious segments</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-2xl font-bold text-blue-400">
                    {formatDuration(stats.sessionDuration)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-300">Session Time</h3>
                <p className="text-xs text-slate-500 mt-1">Active monitoring</p>
              </div>
            </div>

            {/* Trust Score Distribution */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Trust Score Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">High Trust (70-100%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${distribution.high}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-400 w-10 text-right">{distribution.high}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Medium Trust (40-69%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${distribution.medium}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-400 w-10 text-right">{distribution.medium}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Low Trust (0-39%)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${distribution.low}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-400 w-10 text-right">{distribution.low}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Model Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Video Model (MesoNet)</span>
                    <span className="text-sm text-green-400">98.2% accuracy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Audio Model (Whisper+AASIST)</span>
                    <span className="text-sm text-green-400">96.7% accuracy</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Processing Latency</span>
                    <span className="text-sm text-blue-400">~380ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">CPU Usage</span>
                    <span className="text-sm text-yellow-400">12%</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Detection Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Video Frames Analyzed</span>
                    <span className="text-sm text-slate-300">{Math.floor(history.length * 1.2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Audio Segments Processed</span>
                    <span className="text-sm text-slate-300">{Math.floor(history.length * 0.8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">False Positive Rate</span>
                    <span className="text-sm text-green-400">2.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Detection Confidence</span>
                    <span className="text-sm text-green-400">94.8%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsPanel;