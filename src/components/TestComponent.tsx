import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-white mb-4">Frontend Test</h1>
      <p className="text-slate-300">If you can see this, the frontend is working!</p>
      <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
        <p className="text-green-300">✅ Frontend is loading correctly</p>
      </div>
    </div>
  );
};

export default TestComponent; 