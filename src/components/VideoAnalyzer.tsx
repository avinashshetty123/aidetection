import { useState, useRef } from 'react';

interface VideoAnalyzerProps {
  onAnalysisComplete?: (result: any) => void;
}

const VideoAnalyzer = ({ onAnalysisComplete }: VideoAnalyzerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await fetch('http://localhost:3001/api/detect', {
        method: 'POST',
        body: formData
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
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Video Analysis</h2>
      <p className="text-slate-300 mb-4">Upload a video file to analyze for AI-generated content</p>
      
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="block w-full text-sm text-slate-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700
            cursor-pointer"
          disabled={isAnalyzing}
        />
      </div>
      
      {file && (
        <div className="mb-4 p-3 bg-slate-700 rounded-md">
          <p className="text-sm text-slate-300">Selected file: {file.name}</p>
          <p className="text-xs text-slate-400">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
      )}
      
      <div className="flex space-x-3">
        <button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className={`px-4 py-2 rounded-md ${
            !file || isAnalyzing
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Video'}
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

export default VideoAnalyzer;