import React, { useState, useRef } from 'react';
import { Upload, Video, AlertTriangle, CheckCircle, Clock, Zap, FileVideo, X } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface VideoAnalyzerProps {
  onAnalysisComplete?: (result: any) => void;
}

const VideoAnalyzer = ({ onAnalysisComplete }: VideoAnalyzerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setError('');
    setUploadProgress(0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('media', file);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
          reject(new Error('Request timeout - file may be too large'));
        });

        xhr.open('POST', API_ENDPOINTS.DETECT);
        xhr.timeout = 120000; // 2 minute timeout
        xhr.send(formData);
      });

      const data = await uploadPromise;
      setResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      let errorMessage = 'Analysis failed';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
    setError('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score: number) => {
    if (score > 0.7) return 'text-green-400';
    if (score > 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score > 0.7) return 'bg-green-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Advanced Video Analysis</h2>
            <p className="text-sm text-slate-400">AI-powered deepfake detection for video files</p>
          </div>
        </div>
        
        {/* File Upload Area */}
        <div className="mb-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isAnalyzing}
            />
            
            {!file ? (
              <div>
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-300 mb-2">Drop video file here or click to browse</p>
                <p className="text-sm text-slate-400">Supports MP4, WebM, AVI, MOV (max 100MB)</p>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <FileVideo className="w-8 h-8 text-blue-400" />
                <div className="text-left">
                  <p className="text-lg font-medium text-slate-300">{file.name}</p>
                  <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                  disabled={isAnalyzing}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Upload Progress */}
        {isAnalyzing && uploadProgress > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !file || isAnalyzing
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Analyze Video</span>
              </>
            )}
          </button>
          
          <button
            onClick={resetForm}
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            Reset
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}
        
        {/* Results Display */}
        {result && (
          <div className="space-y-6">
            {/* Main Results */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <div className="flex items-center space-x-2">
                  {result.suspicious ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  <span className={`font-medium ${result.suspicious ? 'text-red-400' : 'text-green-400'}`}>
                    {result.suspicious ? 'AI Generated' : 'Likely Authentic'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Trust Score</span>
                    <span className={`text-xl font-bold ${getScoreColor(result.trustScore)}`}>
                      {Math.round(result.trustScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getScoreBg(result.trustScore)}`}
                      style={{ width: `${result.trustScore * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Confidence</span>
                    <span className="text-xl font-bold text-blue-400">
                      {Math.round((result.confidence || 0.85) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(result.confidence || 0.85) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-xl font-bold text-green-400">
                      {Math.round(result.processingTime || 0)}ms
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">Processing Time</span>
                </div>
                
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xl font-bold text-purple-400">
                      {result.model?.split(' ')[0] || 'MesoNet'}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">AI Model</span>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            {result.features && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Technical Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {Object.entries(result.features).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-slate-200">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
              <div className="space-y-3">
                {result.suspicious ? (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Video shows signs of AI manipulation - facial inconsistencies or artifacts detected</span>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Video appears authentic with natural human characteristics</span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-slate-300">Analysis based on facial landmarks, texture consistency, and temporal coherence</span>
                </div>
                {result.confidence && result.confidence < 0.7 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Lower confidence may indicate video quality issues or edge cases</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalyzer;