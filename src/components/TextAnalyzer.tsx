import { useState } from 'react';

interface TextAnalyzerProps {
  onAnalysisComplete?: (result: any) => void;
}

const TextAnalyzer = ({ onAnalysisComplete }: TextAnalyzerProps) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setResult(null);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text first');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Send text to backend for analysis
      const response = await fetch('http://localhost:3001/api/detect-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setText('');
    setResult(null);
    setError('');
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Text Analysis</h2>
      <p className="text-slate-300 mb-4">Enter text to analyze for AI-generated content</p>
      
      <div className="mb-4">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste text here to analyze..."
          className="w-full h-40 p-3 bg-slate-700 text-white rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
          disabled={isAnalyzing}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isAnalyzing}
          className={`px-4 py-2 rounded-md ${
            !text.trim() || isAnalyzing
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Text'}
        </button>
        
        <button
          onClick={resetForm}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white"
        >
          Reset
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-800 rounded-md">
              <p className="text-sm text-slate-400">Trust Score</p>
              <p className={`text-xl font-bold ${
                result.trustScore > 0.7 ? 'text-green-400' : 
                result.trustScore > 0.4 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(result.trustScore * 100)}%
              </p>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-md">
              <p className="text-sm text-slate-400">AI Generated</p>
              <p className={`text-xl font-bold ${result.suspicious ? 'text-red-400' : 'text-green-400'}`}>
                {result.suspicious ? 'Likely' : 'Unlikely'}
              </p>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-md">
              <p className="text-sm text-slate-400">Confidence</p>
              <p className="text-xl font-bold text-blue-400">
                {Math.round(result.confidence * 100)}%
              </p>
            </div>
            
            <div className="p-3 bg-slate-800 rounded-md">
              <p className="text-sm text-slate-400">Processing Time</p>
              <p className="text-xl font-bold text-blue-400">
                {Math.round(result.processingTime)}ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextAnalyzer;