import React from 'react';
import { AlertTriangle, Download, Play, Trash2, Video, Mic } from 'lucide-react';

interface EvidenceSegment {
  id: number;
  timestamp: number;
  type: 'video' | 'audio';
  score: number;
  duration: number;
}

interface EvidencePanelProps {
  segments: EvidenceSegment[];
  onClearAll: () => void;
}

const EvidencePanel: React.FC<EvidencePanelProps> = ({ segments, onClearAll }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  const getTypeIcon = (type: string) => {
    return type === 'video' ? Video : Mic;
  };

  const getTypeColor = (type: string) => {
    return type === 'video' ? 'text-blue-400' : 'text-purple-400';
  };

  const groupedSegments = segments.reduce((acc, segment) => {
    const date = formatDate(segment.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(segment);
    return acc;
  }, {} as Record<string, EvidenceSegment[]>);

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold">Evidence Repository</h2>
          </div>
          {segments.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {segments.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-slate-800 rounded-lg">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-400 mb-2">No Evidence Recorded</h3>
              <p className="text-slate-500">Suspicious segments will appear here when detected</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Segments</span>
                  <span className="text-xl font-bold text-red-400">{segments.length}</span>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Video Alerts</span>
                  <span className="text-xl font-bold text-blue-400">
                    {segments.filter(s => s.type === 'video').length}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Audio Alerts</span>
                  <span className="text-xl font-bold text-purple-400">
                    {segments.filter(s => s.type === 'audio').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Timeline */}
            <div className="space-y-6">
              {Object.entries(groupedSegments).reverse().map(([date, dateSegments]) => (
                <div key={date} className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4 text-slate-300">{date}</h3>
                  <div className="space-y-3">
                    {dateSegments.reverse().map((segment) => {
                      const TypeIcon = getTypeIcon(segment.type);
                      return (
                        <div
                          key={segment.id}
                          className="flex items-center justify-between bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${segment.type === 'video' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-3">
                                <span className="font-medium capitalize">{segment.type} Alert</span>
                                <span className={`text-sm px-2 py-1 rounded ${
                                  segment.score < 30 ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                                }`}>
                                  {segment.score}% trust
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {formatTime(segment.timestamp)} • {formatDuration(segment.duration)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors">
                              <Play className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidencePanel;