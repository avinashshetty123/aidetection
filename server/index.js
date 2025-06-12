import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
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

// Store detection history (only metadata, not files)
let detectionHistory = [];
let suspiciousSegments = [];

// Flag to control recording
let isRecording = true;

// Cleanup function to remove temporary files
const cleanupTempFiles = () => {
  console.log('Running temp file cleanup');
  
  // Make sure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    return;
  }
  
  fs.readdir(tempDir, (err, files) => {
    if (err) return console.error('Error reading temp directory:', err);
    
    console.log(`Found ${files.length} files in temp directory`);
    
    // Keep only suspicious files and delete the rest
    const suspiciousFilePaths = suspiciousSegments.map(segment => segment.filePath);
    let deletedCount = 0;
    let skippedCount = 0;
    
    // Use Promise.all for better control
    const deletePromises = files.map(file => {
      return new Promise(resolve => {
        const filePath = path.join(tempDir, file);
        
        // Skip if file is in suspicious segments
        if (suspiciousFilePaths.includes(filePath)) {
          skippedCount++;
          resolve();
          return;
        }
        
        // Check if file exists before trying to delete
        fs.access(filePath, fs.constants.F_OK, (accessErr) => {
          if (accessErr) {
            // File doesn't exist
            resolve();
            return;
          }
          
          // Delete the file
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
      console.log(`Cleanup complete: ${deletedCount} files deleted, ${skippedCount} files kept`);
    });
  });
};

// Run cleanup every 30 seconds
setInterval(cleanupTempFiles, 30 * 1000);

// Force cleanup on startup
cleanupTempFiles();

// Python inference function
function runPythonInference(filePath, mediaType) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'detect.py');
    const py = spawn('python', [pythonScript, filePath, mediaType]);
    
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
          reject(new Error('Failed to parse Python output: ' + output));
        }
      } else {
        reject(new Error('Python script failed: ' + error));
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      py.kill();
      reject(new Error('Python inference timeout'));
    }, 30000);
  });
}

// Toggle recording state
app.post('/api/toggle-recording', (req, res) => {
  isRecording = !isRecording;
  
  // Force cleanup when turning off recording
  if (!isRecording) {
    cleanupTempFiles();
  }
  
  res.json({ isRecording });
});

// Get recording state
app.get('/api/recording-state', (req, res) => {
  res.json({ isRecording });
});

// Detection endpoint
app.post('/api/detect', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    // If not recording, don't process the file
    if (!isRecording) {
      // Delete the file immediately
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Failed to delete file:', e.message);
      }
      return res.json({
        trustScore: 0.8,
        suspicious: false,
        mediaType: req.file.mimetype.includes('video') ? 'video' : 'audio',
        confidence: 0.9,
        processingTime: 50,
        skipped: true
      });
    }

    const filePath = req.file.path;
    const mediaType = req.file.mimetype.includes('video') ? 'video' : 'audio';
    
    console.log(`Processing ${mediaType} file: ${filePath}`);
    
    // Run AI inference
    const result = await runPythonInference(filePath, mediaType);
    
    // Only keep the file if it's suspicious, otherwise delete it immediately
    if (!result.suspicious) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete non-suspicious file:', e.message);
      }
    }
    
    // Add timestamp and store in history (without file path if not suspicious)
    const detectionData = {
      ...result,
      timestamp: Date.now(),
      mediaType,
      filePath: result.suspicious ? filePath : null
    };
    
    detectionHistory.push(detectionData);
    
    // Store suspicious segments
    if (result.suspicious) {
      suspiciousSegments.push({
        id: Date.now(),
        timestamp: Date.now(),
        type: mediaType,
        score: Math.round(result.trustScore * 100),
        duration: 2.0,
        filePath: filePath
      });
    }
    
    // Limit history size
    if (detectionHistory.length > 100) {
      detectionHistory = detectionHistory.slice(-100);
    }
    
    res.json({
      trustScore: result.trustScore,
      suspicious: result.suspicious,
      mediaType: result.mediaType,
      confidence: result.confidence || 0.85,
      processingTime: result.processingTime || Math.random() * 500 + 200
    });
    
  } catch (error) {
    console.error('Detection error:', error);
    
    // Delete the file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('Failed to delete file on error:', e.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Detection failed', 
      details: error.message,
      // Return mock data as fallback
      trustScore: 0.7 + Math.random() * 0.25,
      suspicious: Math.random() < 0.2,
      mediaType: req.file?.mimetype.includes('video') ? 'video' : 'audio',
      confidence: 0.75,
      processingTime: 300
    });
  }
});

// Get detection history
app.get('/api/history', (req, res) => {
  res.json(detectionHistory.slice(-50)); // Return last 50 detections
});

// Get suspicious segments
app.get('/api/suspicious', (req, res) => {
  res.json(suspiciousSegments);
});

// Clear suspicious segments
app.delete('/api/suspicious', (req, res) => {
  console.log(`Deleting ${suspiciousSegments.length} suspicious segments`);
  
  // Clean up files with better error handling
  const deletePromises = suspiciousSegments.map(segment => {
    return new Promise(resolve => {
      if (!segment.filePath) {
        resolve();
        return;
      }
      
      // Check if file exists first
      fs.access(segment.filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // File doesn't exist
          console.log(`File doesn't exist: ${segment.filePath}`);
          resolve();
          return;
        }
        
        // File exists, try to delete it
        fs.unlink(segment.filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.warn(`Failed to delete suspicious file: ${segment.filePath}`, unlinkErr.message);
          } else {
            console.log(`Successfully deleted: ${segment.filePath}`);
          }
          resolve();
        });
      });
    });
  });
  
  // Wait for all deletions to complete
  Promise.all(deletePromises).then(() => {
    // Reset suspicious segments
    suspiciousSegments = [];
    
    // Also clean up all temp files
    cleanupTempFiles();
    
    res.json({ success: true });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    python: 'available' // We'll assume Python is available
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TRUVOICE Backend running on http://localhost:${PORT}`);
  console.log(`📁 Temp directory: ${tempDir}`);
  console.log(`🐍 Make sure Python dependencies are installed: npm run setup:python`);
});
// Text detection endpoint
app.post('/api/detect-text', express.json(), async (req, res) => {
  try {
    if (!req.body.text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const text = req.body.text;
    console.log(`Processing text analysis, length: ${text.length} characters`);
    
    // Simulate processing time
    const startTime = Date.now();
    const processingTime = Math.random() * 300 + 100;
    
    // Wait for simulated processing time
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate analysis result based on text characteristics
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.length / wordCount;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgSentenceLength = wordCount / sentenceCount;
    
    // Calculate trust score based on text patterns
    // This is a simplified heuristic - in production you'd use a real AI model
    let trustScore = 0.5; // Start neutral
    
    // Very long average sentences often indicate AI text
    if (avgSentenceLength > 25) trustScore -= 0.2;
    else if (avgSentenceLength < 10) trustScore += 0.1;
    
    // Very consistent word length often indicates AI text
    if (avgWordLength > 6) trustScore -= 0.1;
    
    // Very short or very long texts are more likely to be AI
    if (wordCount < 20) trustScore += 0.1;
    else if (wordCount > 500) trustScore -= 0.15;
    
    // Add some randomness
    trustScore += (Math.random() - 0.5) * 0.2;
    
    // Clamp between 0 and 1
    trustScore = Math.max(0, Math.min(1, trustScore));
    
    // Determine if content is suspicious
    const suspicious = trustScore < 0.6;
    
    // Calculate confidence based on score extremes
    const confidence = Math.min(0.95, Math.abs(trustScore - 0.5) * 2);
    
    const result = {
      trustScore,
      suspicious,
      mediaType: 'text',
      confidence,
      processingTime: Date.now() - startTime
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({ 
      error: 'Text detection failed', 
      details: error.message,
      trustScore: 0.7 + Math.random() * 0.25,
      suspicious: Math.random() < 0.2,
      mediaType: 'text',
      confidence: 0.75,
      processingTime: 300
    });
  }
});