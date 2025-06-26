import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Brain, Users, BookOpen, Shield, GraduationCap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface DetectionResult {
  isAiGenerated: boolean;
  confidence: number;
  aiProbability: number;
  humanProbability: number;
  detectedPatterns: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  processingTime: number;
  wordCount: number;
  analysis: {
    linguistic: number;
    structural: number;
    semantic: number;
    behavioral: number;
  };
}

const TestResponseDetector = () => {
  const [response, setResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string>('');

  const analyzeResponse = async () => {
    if (!response.trim()) {
      setError('Please enter a test response to analyze');
      return;
    }

    if (response.trim().length < 50) {
      setError('Response too short for accurate analysis (minimum 50 characters)');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const apiResponse = await fetch(API_ENDPOINTS.DETECT_TEST_RESPONSE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API request failed: ${apiResponse.status}`);
      }
      
      const apiResult = await apiResponse.json();
      setResult(apiResult);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'LOW': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Test Response Detector</h2>
            <p className="text-sm text-slate-400">Detect AI-generated responses in academic assessments</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Student Response to Analyze
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Paste the student's test response here for AI detection analysis..."
            className="w-full h-48 p-4 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none resize-none"
            disabled={isAnalyzing}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">
              {response.length} characters • {response.trim().split(/\s+/).filter(w => w.length > 0).length} words
            </span>
            {response.length > 0 && response.length < 50 && (
              <span className="text-xs text-yellow-400">
                Need {50 - response.length} more characters for analysis
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={analyzeResponse}
            disabled={!response.trim() || response.length < 50 || isAnalyzing}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !response.trim() || response.length < 50 || isAnalyzing
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Response...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Analyze for AI Content</span>
              </>
            )}
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
            {/* Main Result */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detection Results</h3>
                <div className="flex items-center space-x-2">
                  {result.isAiGenerated ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(result.riskLevel)}`}>
                    {result.riskLevel} RISK
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">AI Probability</span>
                    <span className={`text-xl font-bold ${result.aiProbability > 50 ? 'text-red-400' : 'text-green-400'}`}>
                      {result.aiProbability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${result.aiProbability > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${result.aiProbability}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Confidence</span>
                    <span className="text-xl font-bold text-blue-400">
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-xl font-bold text-green-400">
                      {result.processingTime}ms
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">Processing Time</span>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-xl font-bold text-purple-400">
                      {result.wordCount}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">Word Count</span>
                </div>
              </div>
            </div>

            {/* Analysis Breakdown */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Analysis Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Detection Metrics</h4>
                  <div className="space-y-3">
                    {Object.entries(result.analysis).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 capitalize">{key} Analysis</span>
                          <span className={`font-medium ${value > 70 ? 'text-red-400' : value > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                            {value}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              value > 70 ? 'bg-red-500' : value > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Detected Patterns</h4>
                  {result.detectedPatterns.length > 0 ? (
                    <div className="space-y-2">
                      {result.detectedPatterns.map((pattern, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></div>
                          <span className="text-sm text-slate-300">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-400">No suspicious AI patterns detected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <div className="space-y-3">
                {result.riskLevel === 'HIGH' && (
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      High probability of AI-generated content. Consider manual review and follow-up questioning.
                    </span>
                  </div>
                )}
                {result.riskLevel === 'MEDIUM' && (
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full mt-1 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">
                      Moderate risk detected. Additional verification may be warranted.
                    </span>
                  </div>
                )}
                {result.riskLevel === 'LOW' && (
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">
                      Response appears to be human-generated with natural writing patterns.
                    </span>
                  </div>
                )}
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">
                    For best results, combine automated detection with human judgment and academic integrity policies.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResponseDetector;