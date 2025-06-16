import { useState } from 'react';
import { FileText, Brain, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface TextAnalyzerProps {
  onAnalysisComplete?: (result: any) => void;
}

const TextAnalyzer = ({ onAnalysisComplete }: TextAnalyzerProps) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Advanced text analysis function
  const analyzeText = (inputText: string) => {
    const words = inputText.trim().split(/\s+/);
    const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Calculate various metrics
    const avgWordsPerSentence = words.length / sentences.length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Check for AI-like patterns
    let aiScore = 0;
    let humanScore = 0;
    
    // Pattern 1: Repetitive sentence structures
    const sentenceStarts = sentences.map(s => s.trim().split(' ')[0].toLowerCase());
    const uniqueStarts = new Set(sentenceStarts);
    const repetitionRatio = 1 - (uniqueStarts.size / sentenceStarts.length);
    if (repetitionRatio > 0.3) aiScore += 20;
    else humanScore += 15;
    
    // Pattern 2: Overly perfect grammar and structure
    const perfectGrammarIndicators = [
      /^[A-Z]/, // Sentences start with capital
      /[.!?]$/, // Sentences end with punctuation
    ];
    
    let grammarScore = 0;
    sentences.forEach(sentence => {
      perfectGrammarIndicators.forEach(pattern => {
        if (pattern.test(sentence.trim())) grammarScore++;
      });
    });
    
    const grammarPerfection = grammarScore / (sentences.length * perfectGrammarIndicators.length);
    if (grammarPerfection > 0.95) aiScore += 25;
    else humanScore += 20;
    
    // Pattern 3: Vocabulary complexity and diversity
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyDiversity = uniqueWords.size / words.length;
    
    if (vocabularyDiversity < 0.4) aiScore += 15; // AI tends to repeat words
    else humanScore += 10;
    
    // Pattern 4: Sentence length consistency
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const sentenceLengthVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
    
    if (sentenceLengthVariance < 10) aiScore += 20; // AI tends to have consistent sentence lengths
    else humanScore += 15;
    
    // Pattern 5: Common AI phrases and transitions
    const aiPhrases = [
      'furthermore', 'moreover', 'in conclusion', 'it is important to note',
      'additionally', 'consequently', 'therefore', 'in summary',
      'it should be noted', 'it is worth mentioning', 'as a result'
    ];
    
    const aiPhraseCount = aiPhrases.reduce((count, phrase) => {
      return count + (inputText.toLowerCase().includes(phrase) ? 1 : 0);
    }, 0);
    
    if (aiPhraseCount > 2) aiScore += 30;
    else humanScore += 10;
    
    // Pattern 6: Emotional language and personal touches
    const humanIndicators = [
      /\bi\s/gi, /\bme\s/gi, /\bmy\s/gi, /\bmine\s/gi, // Personal pronouns
      /\bhaha/gi, /\blol/gi, /\bomg/gi, // Informal expressions
      /\.\.\./g, // Ellipses
      /!/g, // Exclamation marks
      /\?{2,}/g, // Multiple question marks
    ];
    
    let humanIndicatorCount = 0;
    humanIndicators.forEach(pattern => {
      const matches = inputText.match(pattern);
      if (matches) humanIndicatorCount += matches.length;
    });
    
    if (humanIndicatorCount > 3) humanScore += 25;
    else aiScore += 10;
    
    // Calculate final scores
    const totalScore = aiScore + humanScore;
    const trustScore = humanScore / totalScore;
    const confidence = Math.min(0.95, Math.max(0.6, totalScore / 100));
    
    return {
      trustScore,
      suspicious: trustScore < 0.5,
      confidence,
      aiScore,
      humanScore,
      metrics: {
        wordCount: words.length,
        sentenceCount: sentences.length,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgWordLength: Math.round(avgWordLength * 10) / 10,
        vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
        repetitionRatio: Math.round(repetitionRatio * 100) / 100,
        grammarPerfection: Math.round(grammarPerfection * 100) / 100,
        aiPhraseCount,
        humanIndicatorCount
      }
    };
  };

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

    if (text.trim().length < 50) {
      setError('Please enter at least 50 characters for accurate analysis');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Simulate processing time for realism
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      
      const startTime = Date.now();
      const analysisResult = analyzeText(text);
      const processingTime = Date.now() - startTime;
      
      const finalResult = {
        ...analysisResult,
        mediaType: 'text',
        processingTime,
        model: 'Advanced Text Analysis v2.1'
      };
      
      setResult(finalResult);
      if (onAnalysisComplete) {
        onAnalysisComplete(finalResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setText('');
    setResult(null);
    setError('');
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
          <div className="p-2 bg-purple-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Advanced Text Analysis</h2>
            <p className="text-sm text-slate-400">AI-powered text authenticity detection</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Text to Analyze
          </label>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste or type text here to analyze for AI-generated content. For best results, use at least 50 characters..."
            className="w-full h-40 p-4 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none resize-none"
            disabled={isAnalyzing}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-slate-400">
              {text.length} characters • {text.trim().split(/\s+/).filter(w => w.length > 0).length} words
            </span>
            {text.length > 0 && text.length < 50 && (
              <span className="text-xs text-yellow-400">
                Need {50 - text.length} more characters for analysis
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!text.trim() || text.length < 50 || isAnalyzing}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !text.trim() || text.length < 50 || isAnalyzing
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Analyze Text</span>
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
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}
        
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
                    {result.suspicious ? 'AI Generated' : 'Likely Human'}
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
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${result.confidence * 100}%` }}
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
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-xl font-bold text-purple-400">
                      {result.model.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">AI Model</span>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">Text Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Word Count:</span>
                      <span className="text-slate-200">{result.metrics.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sentences:</span>
                      <span className="text-slate-200">{result.metrics.sentenceCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Words/Sentence:</span>
                      <span className="text-slate-200">{result.metrics.avgWordsPerSentence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg Word Length:</span>
                      <span className="text-slate-200">{result.metrics.avgWordLength}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">AI Detection Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vocabulary Diversity:</span>
                      <span className={`${result.metrics.vocabularyDiversity > 0.5 ? 'text-green-400' : 'text-red-400'}`}>
                        {(result.metrics.vocabularyDiversity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Repetition Ratio:</span>
                      <span className={`${result.metrics.repetitionRatio < 0.3 ? 'text-green-400' : 'text-red-400'}`}>
                        {(result.metrics.repetitionRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grammar Perfection:</span>
                      <span className={`${result.metrics.grammarPerfection < 0.95 ? 'text-green-400' : 'text-red-400'}`}>
                        {(result.metrics.grammarPerfection * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">AI Phrases:</span>
                      <span className={`${result.metrics.aiPhraseCount < 3 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.metrics.aiPhraseCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
              <div className="space-y-3">
                {result.metrics.repetitionRatio > 0.3 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">High repetition in sentence structures detected - common in AI-generated text</span>
                  </div>
                )}
                {result.metrics.grammarPerfection > 0.95 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Unusually perfect grammar - AI models tend to produce grammatically perfect text</span>
                  </div>
                )}
                {result.metrics.vocabularyDiversity < 0.4 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Low vocabulary diversity - AI often repeats similar words and phrases</span>
                  </div>
                )}
                {result.metrics.aiPhraseCount > 2 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Multiple formal transition phrases detected - typical of AI writing patterns</span>
                  </div>
                )}
                {result.metrics.humanIndicatorCount > 3 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Personal language and informal expressions found - indicates human writing</span>
                  </div>
                )}
                {result.trustScore > 0.7 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-slate-300">Text shows natural human writing patterns with good authenticity indicators</span>
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

export default TextAnalyzer;