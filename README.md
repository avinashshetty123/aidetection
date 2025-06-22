# AI Detection Bolt

A real-time AI-powered deepfake detection system for video and audio.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn

### Setup

1. Install JavaScript dependencies:
   ```
   cd aidetection
   npm install
   ```

2. Install Python dependencies:
   ```
   npm run setup:python
   ```

### Text Detection Setup

For text detection functionality, you have two options:

1. **Basic Text Detection** (No additional setup required)
   - Works with just OpenCV
   - Detects potential text regions but doesn't read the text

2. **Full Text Detection with OCR** (Recommended)
   - Run the installation script:
     ```
     cd server
     install_text_detection.bat
     ```
   - Download and install Tesseract OCR from: https://github.com/UB-Mannheim/tesseract/wiki

### Running the Application

To start both frontend and backend simultaneously:

```
npm run dev
```

This will start:
- Frontend: Vite development server (typically on http://localhost:5173)
- Backend: Express server on http://localhost:3001

### Running Components Separately

To run only the frontend:
```
npm run dev:client
```

To run only the backend:
```
npm run dev:server
```

### System Maintenance

To optimize and clean the system:
```
npm run optimize
```

To run a full cleanup (optimize + lint):
```
npm run clean
```

To check system health:
```
npm run health-check
```

## 🎓 Academic AI Detection API

### Public API Endpoint

```bash
POST http://localhost:3001/api/v1/analyze
Content-Type: application/json

{
  "text": "Student's response text here...",
  "studentId": "student123",
  "questionId": "q1"
}
```

### Response Format

```json
{
  "aiScore": 0.87,
  "isSuspectedAI": true,
  "confidence": 0.92,
  "riskLevel": "HIGH",
  "message": "Likely AI-generated (Score: 87%)",
  "detailedAnalysis": {
    "linguistic": 85.2,
    "structural": 78.9,
    "semantic": 91.3,
    "behavioral": 88.7
  },
  "detectedPatterns": [
    "Formal transitions",
    "Lack of personal language"
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 1247.5,
    "wordCount": 156
  }
}
```

## 🔌 Platform Integration

### Google Forms Integration

1. Open Google Forms → Script Editor
2. Paste the integration code from the Platform Integration tab
3. Set up form submission trigger
4. Configure teacher email alerts

### Browser Extension

1. Load the extension from `browser-extension/` folder
2. Enable for testing websites
3. Real-time detection on any form submission
4. Visual indicators and alerts

### Webhook Integration

Integrate with any LMS using webhooks:

```javascript
const response = await fetch('http://localhost:3001/api/v1/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: studentResponse,
    studentId: 'student123',
    questionId: 'q1'
  })
});
```

## Features

### 🎓 Academic AI Detection
- **Platform-Agnostic Test Detection** - Works with Google Forms, Moodle, Canvas, any LMS
- **Advanced NLP Analysis** - Multi-layer linguistic, structural, semantic, and behavioral analysis
- **Real-Time Alerts** - Instant notifications for suspicious AI-generated responses
- **Comprehensive Reporting** - Detailed analytics with PDF export capabilities
- **Browser Extension** - Real-time detection for any web-based testing platform
- **Public API** - RESTful endpoint for custom integrations

### 🔍 Media Detection
- Real-time deepfake detection for video and audio using AI models
- Video detection using MesoNet architecture
- Audio detection using CNN-based classifier
- Text detection in videos and images
- Live monitoring of media streams
- Detection history tracking
- Suspicious content flagging

### ⚡ System Features
- Performance monitoring and system optimization
- Enhanced drag-and-drop file upload
- Comprehensive error handling and recovery
- Platform integration tools and documentation

## Troubleshooting

If you encounter issues with Python package installation:

1. Try installing packages individually:
   ```
   pip install --user opencv-python
   pip install --user numpy
   ```

2. For pytesseract installation issues:
   ```
   pip install --no-deps pytesseract
   pip install pillow
   ```

3. If you see "Failed to write executable" errors, try:
   - Run command prompt as administrator
   - Use the `--user` flag with pip
   - Use the installation batch script provided