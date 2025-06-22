import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

interface PerformanceData {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  detectionLatency: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  isActive: boolean;
  lastProcessingTime?: number;
}

const PerformanceMonitor = ({ isActive, lastProcessingTime }: PerformanceMonitorProps) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [currentStats, setCurrentStats] = useState<PerformanceData>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkLatency: 0,
    detectionLatency: 0,
    timestamp: Date.now()
  });

  // Simulate performance monitoring (in a real app, this would use actual system APIs)
  useEffect(() => {
    if (!isActive) return;

    const monitorPerformance = async () => {
      try {
        // Simulate network latency check
        const startTime = Date.now();
        const response = await fetch('http://localhost:3001/api/health');
        const networkLatency = Date.now() - startTime;

        // Simulate CPU and memory usage (in a real app, use performance APIs)
        const cpuUsage = Math.random() * 30 + 10; // 10-40%
        const memoryUsage = Math.random() * 20 + 30; // 30-50%

        const newStats: PerformanceData = {
          cpuUsage,
          memoryUsage,
          networkLatency,
          detectionLatency: lastProcessingTime || 0,
          timestamp: Date.now()
        };

        setCurrentStats(newStats);
        setPerformanceData(prev => [...prev.slice(-19), newStats]); // Keep last 20 data points
      } catch (error) {
        console.warn('Performance monitoring error:', error);
      }
    };

    monitorPerformance();
    const interval = setInterval(monitorPerformance, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isActive, lastProcessingTime]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isActive) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Performance Monitor</span>
        </div>
        <p className="text-xs text-slate-500">Inactive</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-slate-300">Performance Monitor</span>
      </div>

      <div className="space-y-3">
        {/* CPU Usage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">CPU</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(currentStats.cpuUsage, { good: 20, warning: 40 })}`}>
              {Math.round(currentStats.cpuUsage)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(currentStats.cpuUsage, { good: 20, warning: 40 })}`}
              style={{ width: `${Math.min(currentStats.cpuUsage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Memory Usage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Memory</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(currentStats.memoryUsage, { good: 40, warning: 70 })}`}>
              {Math.round(currentStats.memoryUsage)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(currentStats.memoryUsage, { good: 40, warning: 70 })}`}
              style={{ width: `${Math.min(currentStats.memoryUsage, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Network Latency */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <Wifi className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">Network</span>
            </div>
            <span className={`text-xs font-medium ${getStatusColor(currentStats.networkLatency, { good: 100, warning: 500 })}`}>
              {Math.round(currentStats.networkLatency)}ms
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(currentStats.networkLatency, { good: 100, warning: 500 })}`}
              style={{ width: `${Math.min(currentStats.networkLatency / 10, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Detection Latency */}
        {currentStats.detectionLatency > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <Activity className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-400">Detection</span>
              </div>
              <span className={`text-xs font-medium ${getStatusColor(currentStats.detectionLatency, { good: 1000, warning: 3000 })}`}>
                {Math.round(currentStats.detectionLatency)}ms
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(currentStats.detectionLatency, { good: 1000, warning: 3000 })}`}
                style={{ width: `${Math.min(currentStats.detectionLatency / 50, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Status */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Status</span>
          <span className={`text-xs font-medium ${
            currentStats.cpuUsage < 30 && currentStats.memoryUsage < 50 && currentStats.networkLatency < 200
              ? 'text-green-400'
              : currentStats.cpuUsage < 50 && currentStats.memoryUsage < 70 && currentStats.networkLatency < 500
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            {currentStats.cpuUsage < 30 && currentStats.memoryUsage < 50 && currentStats.networkLatency < 200
              ? 'Optimal'
              : currentStats.cpuUsage < 50 && currentStats.memoryUsage < 70 && currentStats.networkLatency < 500
              ? 'Good'
              : 'Degraded'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;