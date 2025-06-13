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

## Features

- Real-time deepfake detection for video and audio using AI models
- Video detection using MesoNet architecture
- Audio detection using CNN-based classifier
- Text detection in videos and images
- Live monitoring of media streams
- Detection history tracking
- Suspicious content flagging

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