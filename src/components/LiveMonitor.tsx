import React from 'react';
import { Video, Mic, Activity, Eye, Zap, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DetectionData {
  timestamp: number;
  videoScore: number;
  audioScore: number;
  overallScore: number;
  alert: boolean;
  confidence?: number;
  processingTime?: number;
}

interface LiveMonitorProps {
  isActive: boolean;
  currentData: DetectionData;
  history: DetectionData[];
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ isActive, currentData, history }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGradientColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-green-600';
    if (score >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Prepare chart data
  const chartData = history.slice(-20).map((data, index) => ({
    index,
    overall: data.overallScore,
    video: data.videoScore,
    audio: data.audioScore,
    timestamp: data.timestamp
  }));

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Live Detection Monitor</h2>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Last updated: {formatTime(currentData.timestamp)}</span>
            </div>
            {currentData.confidence && (
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Confidence: {Math.round(currentData.confidence * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {!isActive ? (
          <div className="flex items-center justify-center h-96 bg-slate-800 rounded-lg">
            <div className="text-center">
              <Eye className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">Detection Inactive</h3>
              <p className="text-slate-500">Grant permissions and click "Start Detection" to begin monitoring</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColor(currentData.videoScore)} opacity-5`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Video Analysis</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(currentData.videoScore)}`}>
                      {currentData.videoScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getBarColor(currentData.videoScore)}`}
                      style={{ width: `${currentData.videoScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">
                    MesoNet CNN Detection • Frame Analysis
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColor(currentData.audioScore)} opacity-5`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Mic className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Audio Analysis</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(currentData.audioScore)}`}>
                      {currentData.audioScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getBarColor(currentData.audioScore)}`}
                      style={{ width: `${currentData.audioScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Whisper + Spectral Analysis
                  </p>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${getGradientColor(currentData.overallScore)} opacity-5`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Overall Trust</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(currentData.overallScore)}`}>
                      {currentData.overallScore}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getBarColor(currentData.overallScore)}`}
                      style={{ width: `${currentData.overallScore}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Combined AI Score
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            {(currentData.confidence || currentData.processingTime) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentData.confidence && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">AI Confidence</span>
                      </div>
                      <span className="text-lg font-bold text-blue-400">
                        {Math.round(currentData.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentData.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {currentData.processingTime && (
                  <div className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Processing Time</span>
                      </div>
                      <span className="text-lg font-bold text-green-400">
                        {Math.round(currentData.processingTime)}ms
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(currentData.processingTime / 1000 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Live Chart */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Real-Time Trust Score Timeline</h3>
              <div className="h-64">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis 
                        dataKey="index" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <ReferenceLine y={70} stroke="#10b981" strokeDasharray="2 2" opacity={0.5} />
                      <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="2 2" opacity={0.5} />
                      <Line 
                        type="monotone" 
                        dataKey="overall" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="video" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="audio" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                      <p>Collecting data...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-400">Overall Trust</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className="text-slate-400">Video</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-purple-500"></div>
                  <span className="text-slate-400">Audio</span>
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            {history.filter(d => d.alert).length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-red-400">Recent Alerts</h3>
                <div className="space-y-2">
                  {history.filter(d => d.alert).slice(-5).reverse().map((data, index) => (
                    <div key={index} className="flex items-center justify-between bg-red-900/20 border border-red-800 rounded p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">Suspicious content detected</span>
                        {data.confidence && (
                          <span className="text-xs bg-red-800 text-red-200 px-2 py-1 rounded">
                            {Math.round(data.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span>Trust: {data.overallScore}%</span>
                        <span>{formatTime(data.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {currentData.overallScore < 60 && (
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4 text-blue-400">AI Suggestions</h3>
                <div className="space-y-2 text-sm">
                  {currentData.videoScore < 50 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-300">Video quality appears synthetic. Check for unusual facial movements or artifacts.</span>
                    </div>
                  )}
                  {currentData.audioScore < 50 && (
                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-300">Audio patterns suggest possible voice synthesis. Listen for unnatural intonation.</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">Consider requesting additional verification from the speaker.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMonitor;