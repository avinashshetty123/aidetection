import React from 'react';
import BoltLogo from '../assets/BoltLogo.svg';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading TRUVOICE..." }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-600 rounded-lg">
            <img src={BoltLogo} alt="Bolt Logo" className="w-12 h-12 animate-pulse" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">TRUVOICE</h1>
        <p className="text-slate-400 mb-6">Real-Time Deepfake Detection</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-slate-500 mt-4">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 