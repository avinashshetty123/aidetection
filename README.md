# AI Detection Bolt

A real-time AI-generated content detection system for video and audio.

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
   
   This will install the required Python packages (opencv-python and numpy).

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

### Building for Production

```
npm run build
```

## Features

- Real-time deepfake detection for video and audio
- Live monitoring of media streams
- Detection history tracking
- Suspicious content flagging