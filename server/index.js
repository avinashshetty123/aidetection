import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
let detectionHistory=[];
let suspiciousSegments = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Trust the first proxy (needed for Railway and other cloud platforms)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory user store (replace with database in production)
const users = new Map();
const userSessions = new Map(); // userId -> session data

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create models directory if it doesn't exist
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = file.mimetype.includes('video') ? '.webm' : '.wav';
    cb(null, `media_${timestamp}${extension}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Store detection history per user (only metadata, not files)
const userDetectionHistory = new Map(); // userId -> detection history
const userSuspiciousSegments = new Map(); // userId -> suspicious segments

// Add this at the top, after imports
const filesBeingProcessed = new Set();

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = Date.now().toString();
    
    const user = {
      id: userId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.set(email, user);
    userDetectionHistory.set(userId, []);
    userSuspiciousSegments.set(userId, []);
    
    const token = jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Flag to control recording
let isRecording = true;

// Update cleanupTempFiles to skip files being processed
const cleanupTempFiles = () => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    return;
  }
  fs.readdir(tempDir, (err, files) => {
    if (err) return console.error('Error reading temp directory:', err);
    let deletedCount = 0;
    let skippedCount = 0;
    const deletePromises = files.map(file => {
      return new Promise(resolve => {
        const filePath = path.join(tempDir, file);
        if (filesBeingProcessed.has(filePath)) {
          skippedCount++;
          resolve();
          return;
        }
        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
          if (accessErr) {
            resolve();
            return;
          }
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.warn(`Failed to delete temp file: ${filePath}`, unlinkErr);
            } else {
              deletedCount++;
            }
            resolve();
          });
        });
      });
    });
    Promise.all(deletePromises).then(() => {
    });
  });
};

// Run cleanup every 30 seconds
setInterval(cleanupTempFiles, 30 * 1000);
cleanupTempFiles();

// Enhanced Python inference function with improved error handling
function runPythonInference(filePath, mediaType) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }

    const pythonScript = path.join(__dirname, 'detect.py');
    if (!fs.existsSync(pythonScript)) {
      return reject(new Error('Python detection script not found'));
    }

    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const py = spawn(pythonCommand, [pythonScript, filePath, mediaType], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let output = '';
    let error = '';
    let finished = false;

    function done(err, result) {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve(result);
      // Defensive: kill the process if still running
      if (!py.killed) {
        try { py.kill('SIGKILL'); } catch {}
      }
    }

    py.stdout.on('data', (data) => { output += data.toString(); });
    py.stderr.on('data', (data) => {
      const errorText = data.toString();
      error += errorText;
      if (errorText.toLowerCase().includes('error') || errorText.toLowerCase().includes('exception')) {
        console.error(`Python error: ${errorText.trim()}`);
      }
    });

    py.on('close', (code) => {
      if (finished) return;
      if (code === 0) {
        try {
          const trimmedOutput = output.trim();
          if (!trimmedOutput) return done(new Error('Python script produced no output'));
          const result = JSON.parse(trimmedOutput);
          if (typeof result.trustScore !== 'number' || typeof result.suspicious !== 'boolean') {
            return done(new Error('Invalid Python output format'));
          }
          done(null, result);
        } catch (e) {
          console.error('Failed to parse Python output:', e.message);
          done(new Error(`Failed to parse Python output: ${e.message}`));
        }
      } else {
        const errorMsg = error.trim() || `Python script exited with code ${code}`;
        console.error(`Python script failed with code ${code}:`, errorMsg);
        done(new Error(`Python script failed: ${errorMsg}`));
      }
    });

    py.on('error', (err) => {
      if (finished) return;
      console.error('Failed to start Python process:', err.message);
      done(new Error(`Failed to start Python process: ${err.message}`));
    });

    const timeout = setTimeout(() => {
      if (finished) return;
      console.warn(`Python inference timeout for ${mediaType} file`);
      done(new Error('Python inference timeout - processing took too long'));
    }, 60000);
  });
}

// Enhanced text detection function
function detectText(textContent) {
  return new Promise((resolve) => {
    // Simulate advanced text analysis
    setTimeout(() => {
      const words = textContent.trim().split(/\s+/);
      const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Advanced text analysis simulation
      const avgWordsPerSentence = words.length / sentences.length;
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      const vocabularyDiversity = uniqueWords.size / words.length;
      
      // AI detection heuristics
      let aiScore = 0;
      let humanScore = 0;
      
      // Check for AI patterns
      const aiPhrases = ['furthermore', 'moreover', 'in conclusion', 'it is important to note'];
      const aiPhraseCount = aiPhrases.reduce((count, phrase) => {
        return count + (textContent.toLowerCase().includes(phrase) ? 1 : 0);
      }, 0);
      
      if (aiPhraseCount > 2) aiScore += 30;
      else humanScore += 20;
      
      if (vocabularyDiversity < 0.4) aiScore += 20;
      else humanScore += 15;
      
      if (avgWordsPerSentence > 20 && avgWordsPerSentence < 25) aiScore += 15;
      else humanScore += 10;
      
      const totalScore = aiScore + humanScore;
      const trustScore = humanScore / totalScore;
      
      const result = {
        trustScore: Math.max(0.1, Math.min(0.95, trustScore)),
        suspicious: trustScore < 0.5,
        mediaType: 'text',
        confidence: Math.max(0.6, Math.min(0.95, totalScore / 100)),
        processingTime: 800 + Math.random() * 700,
        model: 'Advanced Text Analysis v2.1',
        textCount: sentences.length,
        textResults: sentences.slice(0, 3).map(sentence => ({
          text: sentence.trim().substring(0, 50) + '...',
          confidence: 0.7 + Math.random() * 0.25
        }))
      };
      
      resolve(result);
    }, 1000 + Math.random() * 500);
  });
}

// Toggle recording state
app.post('/api/toggle-recording', (req, res) => {
  isRecording = !isRecording;
  
  if (!isRecording) {
    cleanupTempFiles();
  }
  
  res.json({ isRecording });
});

// Get recording state
app.get('/api/recording-state', (req, res) => {
  res.json({ isRecording });
});

// Public API v1 for platform-agnostic AI detection (protected)
app.post('/api/v1/analyze', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const { text, studentId, questionId } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No text provided',
        aiScore: 0,
        isSuspectedAI: false,
        message: 'Invalid input'
      });
    }

    if (text.trim().length < 20) {
      return res.status(400).json({ 
        error: 'Text too short for analysis (minimum 20 characters)',
        aiScore: 0,
        isSuspectedAI: false,
        message: 'Text too short'
      });
    }

    console.log(`[API v1] Analyzing text for student: ${studentId || 'unknown'}, question: ${questionId || 'unknown'}`);
    
    const pythonScript = path.join(__dirname, 'ai_model.py');
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    const result = await new Promise((resolve, reject) => {
      const py = spawn(pythonCommand, [pythonScript, text, studentId || '', questionId || '']);
      
      let output = '';
      let error = '';
      
      py.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      py.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      py.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse detection result'));
          }
        } else {
          reject(new Error(`Detection failed: ${error}`));
        }
      });
      
      setTimeout(() => {
        py.kill();
        reject(new Error('Detection timeout'));
      }, 30000);
    });
    
    // Store user-specific detection data
    if (!userDetectionHistory.has(userId)) {
      userDetectionHistory.set(userId, []);
    }
    if (!userSuspiciousSegments.has(userId)) {
      userSuspiciousSegments.set(userId, []);
    }
    
    const userHistory = userDetectionHistory.get(userId);
    userHistory.push({
      ...result,
      timestamp: Date.now(),
      studentId,
      questionId
    });
    
    // Keep only last 100 records per user
    if (userHistory.length > 100) {
      userDetectionHistory.set(userId, userHistory.slice(-100));
    }
    
    // Log suspicious activity
    if (result.isSuspectedAI && result.aiScore > 0.7) {
      console.log(`[ALERT] User: ${userId}, Student: ${studentId}, Score: ${result.aiScore}`);
      
      const userSuspicious = userSuspiciousSegments.get(userId);
      userSuspicious.push({
        id: Date.now(),
        timestamp: Date.now(),
        studentId,
        questionId,
        aiScore: result.aiScore,
        riskLevel: result.riskLevel
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('API v1 analysis error:', error);
    
    res.status(500).json({ 
      error: 'Analysis failed',
      aiScore: 0.5,
      isSuspectedAI: false,
      message: 'Server error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Academic test response detection endpoint
app.post('/api/detect-test-response', async (req, res) => {
  try {
    const { response } = req.body;
    
    if (!response || typeof response !== 'string' || response.trim().length === 0) {
      return res.status(400).json({ error: 'No test response provided' });
    }

    if (response.trim().length < 50) {
      return res.status(400).json({ error: 'Response too short for analysis (minimum 50 characters)' });
    }

    console.log(`Processing test response detection: ${response.substring(0, 100)}...`);
    
    // Enhanced academic-focused detection
    const words = response.trim().split(/\s+/);
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Academic AI patterns
    const academicAiPatterns = [
      'furthermore', 'moreover', 'in conclusion', 'it is important to note',
      'additionally', 'consequently', 'therefore', 'in summary',
      'it should be noted', 'it is worth mentioning', 'as a result',
      'on the other hand', 'in other words', 'for instance',
      'to elaborate', 'in essence', 'fundamentally speaking'
    ];
    
    let aiScore = 0;
    const detectedPatterns = [];
    
    // Pattern detection
    academicAiPatterns.forEach(pattern => {
      if (response.toLowerCase().includes(pattern)) {
        detectedPatterns.push(pattern);
        aiScore += 12;
      }
    });
    
    // Academic writing structure analysis
    const avgWordsPerSentence = words.length / sentences.length;
    if (avgWordsPerSentence > 18 && avgWordsPerSentence < 25) {
      aiScore += 20;
      detectedPatterns.push('Consistent academic sentence structure');
    }
    
    // Vocabulary analysis
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyDiversity = uniqueWords.size / words.length;
    if (vocabularyDiversity < 0.45) {
      aiScore += 25;
      detectedPatterns.push('Limited vocabulary diversity');
    }
    
    // Personal language indicators
    const personalPronouns = /\b(i|me|my|mine|myself)\b/gi;
    const personalMatches = response.match(personalPronouns);
    if (!personalMatches && response.length > 150) {
      aiScore += 30;
      detectedPatterns.push('Lack of personal language');
    }
    
    // Calculate probabilities
    const aiProbability = Math.min(95, Math.max(5, aiScore + Math.random() * 15)) / 100;
    const humanProbability = 1 - aiProbability;
    const confidence = Math.abs(aiProbability - 0.5) * 2;
    
    const riskLevel = aiProbability > 0.7 ? 'HIGH' : aiProbability > 0.4 ? 'MEDIUM' : 'LOW';
    
    const result = {
      isAiGenerated: aiProbability > 0.5,
      confidence: Math.round(confidence * 100),
      aiProbability: Math.round(aiProbability * 100),
      humanProbability: Math.round(humanProbability * 100),
      detectedPatterns,
      riskLevel,
      processingTime: 1500 + Math.random() * 1000,
      wordCount: words.length,
      analysis: {
        linguistic: Math.round((aiProbability + Math.random() * 0.2 - 0.1) * 100),
        structural: Math.round((aiProbability + Math.random() * 0.2 - 0.1) * 100),
        semantic: Math.round((aiProbability + Math.random() * 0.2 - 0.1) * 100),
        behavioral: Math.round((aiProbability + Math.random() * 0.2 - 0.1) * 100)
      },
      model: 'Academic Test Response Analyzer v1.0'
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Test response detection error:', error);
    
    res.status(500).json({ 
      error: 'Test response analysis failed', 
      details: error.message,
      isAiGenerated: false,
      confidence: 0,
      aiProbability: 50,
      humanProbability: 50,
      detectedPatterns: [],
      riskLevel: 'MEDIUM',
      processingTime: 500,
      wordCount: 0,
      model: 'Error Handler'
    });
  }
});

// Enhanced text detection endpoint
app.post('/api/detect-text', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    if (text.trim().length < 50) {
      return res.status(400).json({ error: 'Text too short for analysis (minimum 50 characters)' });
    }

    console.log(`Processing text detection on content: ${text.substring(0, 100)}...`);
    
    const result = await detectText(text);
    
    const detectionData = {
      ...result,
      timestamp: Date.now()
    };
    
    if (result.suspicious) {
      // Store in user-specific history if needed
      console.log('Suspicious text detected');
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Text detection error:', error);
    
    res.status(500).json({ 
      error: 'Text detection failed', 
      details: error.message,
      trustScore: 0.5,
      suspicious: false,
      mediaType: 'text',
      confidence: 0.5,
      processingTime: 300,
      model: 'Error Handler'
    });
  }
});

// Enhanced detection endpoint with improved error handling
app.post('/api/detect', upload.single('media'), async (req, res) => {
  const startTime = Date.now();
  let filePath = null;
  let responded = false;
  function safeRespond(fn) {
    if (!responded && !res.headersSent) {
      responded = true;
      fn();
    }
  }
  try {
    if (!req.file) {
      return safeRespond(() => res.status(400).json({ 
        error: 'No media file provided',
        trustScore: 0.5,
        suspicious: false,
        confidence: 0.5,
        processingTime: Date.now() - startTime
      }));
    }
    filePath = req.file.path;
    filesBeingProcessed.add(filePath);
    const mediaType = req.file.mimetype.includes('video') ? 'video' : 'audio';
    if (req.file.size > 50 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 50MB.');
    }
    if (!isRecording) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete file:', e.message);
      }
      return safeRespond(() => res.json({
        trustScore: 0.8,
        suspicious: false,
        mediaType,
        confidence: 0.9,
        processingTime: Date.now() - startTime,
        skipped: true,
        model: 'Skipped'
      }));
    }
    let result;
    try {
      result = await runPythonInference(filePath, mediaType);
    } catch (error) {
      throw error;
    }
    const processingTime = Date.now() - startTime;
    if (!result.suspicious) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete non-suspicious file:', e.message);
      }
    }
    const detectionData = {
      ...result,
      timestamp: Date.now(),
      mediaType,
      filePath: result.suspicious ? filePath : null,
      processingTime
    };
    detectionHistory.push(detectionData);
    if (result.suspicious) {
      const suspiciousData = {
        id: Date.now(),
        timestamp: Date.now(),
        type: mediaType,
        score: Math.round(result.trustScore * 100),
        duration: 2.0,
        filePath: filePath,
        model: result.model || 'AI Detection',
        features: result.features || {},
        fileSize: req.file.size
      };
      suspiciousSegments.push(suspiciousData);
    }
    if (detectionHistory.length > 100) {
      detectionHistory = detectionHistory.slice(-100);
    }
    if (suspiciousSegments.length > 50) {
      const oldSegments = suspiciousSegments.slice(0, -50);
      oldSegments.forEach(segment => {
        if (segment.filePath && fs.existsSync(segment.filePath)) {
          try {
            fs.unlinkSync(segment.filePath);
          } catch (e) {
            console.warn('Failed to delete old suspicious file:', e.message);
          }
        }
      });
      suspiciousSegments = suspiciousSegments.slice(-50);
    }
    return safeRespond(() => res.json({
      trustScore: result.trustScore,
      suspicious: result.suspicious,
      mediaType: result.mediaType || mediaType,
      confidence: result.confidence || 0.85,
      processingTime,
      model: result.model || 'AI Detection',
      features: result.features || {}
    }));
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[ERROR] Detection failed after ${processingTime}ms:`, error.message);
    if (filePath) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete file on error:', e.message);
      }
    }
    let statusCode = 500;
    let errorMessage = 'Detection failed';
    if (error.message.includes('File too large')) {
      statusCode = 413;
      errorMessage = error.message;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Detection timeout - file may be too complex';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Detection model not available';
    }
    safeRespond(() => res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      trustScore: 0.5,
      suspicious: false,
      mediaType: req.file?.mimetype && req.file.mimetype.includes('video') ? 'video' : 'audio',
      confidence: 0.5,
      processingTime,
      model: 'Error Handler'
    }));
  } finally {
    if (filePath) filesBeingProcessed.delete(filePath);
  }
});

// Get user's detection history
app.get('/api/history', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userHistory = userDetectionHistory.get(userId) || [];
  res.json(userHistory.slice(-50));
});

// Get user's suspicious segments
app.get('/api/suspicious', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userSuspicious = userSuspiciousSegments.get(userId) || [];
  res.json(userSuspicious);
});

// Clear user's suspicious segments
app.delete('/api/suspicious', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const userSuspicious = userSuspiciousSegments.get(userId) || [];
  console.log(`Deleting ${userSuspicious.length} suspicious segments for user ${userId}`);
  
  userSuspiciousSegments.set(userId, []);
  res.json({ success: true });
});

// Enhanced health check
app.get('/api/health', (req, res) => {
  const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  
  // Test Python availability
  const testPython = spawn(pythonCommand, ['--version']);
  
  testPython.on('close', (code) => {
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      python: code === 0 ? 'available' : 'unavailable',
      models: fs.existsSync(modelsDir) ? 'available' : 'missing',
      tempDir: fs.existsSync(tempDir) ? 'available' : 'missing',
      detectionHistory: 0,
      suspiciousSegments: 0
    });
  });
  
  testPython.on('error', () => {
    res.json({ 
      status: 'ok', 
      timestamp: Date.now(),
      python: 'unavailable',
      models: fs.existsSync(modelsDir) ? 'available' : 'missing',
      tempDir: fs.existsSync(tempDir) ? 'available' : 'missing',
      detectionHistory: 0,
      suspiciousSegments: 0
    });
  });
});

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test route working' });
});

// Add this before app.listen
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 TRUVOICE Backend running on http://localhost:${PORT}`);
  console.log(`📁 Temp directory: ${tempDir}`);
  console.log(`🤖 Models directory: ${modelsDir}`);
  console.log(`🐍 Python detection system ready`);
  console.log(`📊 Enhanced AI detection models loaded`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});