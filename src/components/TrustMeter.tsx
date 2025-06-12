import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface TrustMeterProps {
  score: number;
  isActive: boolean;
  alert: boolean;
}

const TrustMeter: React.FC<TrustMeterProps> = ({ score, isActive, alert }) => {
  const getColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' };
    return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">Trust Score</h3>
        {alert && (
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
        )}
      </div>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-slate-600"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.text} transition-all duration-500 ease-out`}
            style={{
              filter: isActive && alert ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Shield className={`w-6 h-6 ${colors.text} mb-1`} />
          <span className={`text-lg font-bold ${colors.text}`}>
            {isActive ? score : '--'}
          </span>
          <span className="text-xs text-slate-400">
            {isActive ? '%' : 'OFF'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <div className={`text-xs font-medium ${
          !isActive ? 'text-slate-500' :
          score >= 70 ? 'text-green-400' : 
          score >= 40 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {!isActive ? 'Detection Inactive' :
           score >= 70 ? 'HIGH TRUST' : 
           score >= 40 ? 'MEDIUM TRUST' : 'LOW TRUST'}
        </div>
        {alert && isActive && (
          <div className="text-xs text-red-400 mt-1 animate-pulse">
            ⚠️ Possible deepfake detected
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustMeter;