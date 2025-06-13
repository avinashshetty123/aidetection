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
    // Check if file exists before running inference
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }
    
    const pythonScript = path.join(__dirname, 'detect.py');
    // Use python3 on Unix-like systems, python on Windows
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const py = spawn(pythonCommand, [pythonScript, filePath, mediaType]);
    
    let output = '';
    let error = '';
    
    py.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    py.stderr.on('data', (data) => {
      error += data.toString();
      console.error(`Python stderr: ${data}`);
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

// Text detection function
function detectText(filePath) {
  return runPythonInference(filePath, 'text');
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

// Text detection endpoint
app.post('/api/detect-text', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const filePath = req.file.path;
    console.log(`Processing text detection on file: ${filePath}`);
    
    // Run text detection
    const result = await detectText(filePath);
    
    // Add timestamp
    const detectionData = {
      ...result,
      timestamp: Date.now(),
      filePath: filePath
    };
    
    // Store in history if suspicious
    if (result.suspicious) {
      detectionHistory.push(detectionData);
      
      suspiciousSegments.push({
        id: Date.now(),
        timestamp: Date.now(),
        type: 'text',
        score: Math.round(result.trustScore * 100),
        duration: 1.0,
        filePath: filePath,
        model: result.model || 'TextDetection',
        textResults: result.textResults || []
      });
    } else {
      // Delete the file if not suspicious
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete non-suspicious file:', e.message);
      }
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Text detection error:', error);
    
    // Delete the file on error
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (e) {
        console.warn('Failed to delete file on error:', e.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Text detection failed', 
      details: error.message,
      trustScore: 0.5,
      suspicious: false,
      mediaType: 'text',
      confidence: 0.5,
      processingTime: 300,
      model: 'Error'
    });
  }
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
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
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
        filePath: filePath,
        model: result.model || 'AI'
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
      processingTime: result.processingTime,
      model: result.model || 'AI'
    });
    
  } catch (error) {
    console.error('Detection error:', error);
    
    // Delete the file on error
    if (req.file && req.file.path) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (e) {
        console.warn('Failed to delete file on error:', e.message);
      }
    }
    
    res.status(500).json({ 
      error: 'Detection failed', 
      details: error.message,
      trustScore: 0.5,
      suspicious: false,
      mediaType: req.file?.mimetype.includes('video') ? 'video' : 'audio',
      confidence: 0.5,
      processingTime: 300,
      model: 'Error'
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
    res.json({ success: true });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    python: 'available',
    models: fs.existsSync(modelsDir) ? 'available' : 'missing'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TRUVOICE Backend running on http://localhost:${PORT}`);
  console.log(`📁 Temp directory: ${tempDir}`);
  console.log(`🤖 Models directory: ${modelsDir}`);
  console.log(`🐍 Make sure Python dependencies are installed: npm run setup:python`);
});