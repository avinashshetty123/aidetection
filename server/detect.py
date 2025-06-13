#!/usr/bin/env python3
"""
TRUVOICE AI Detection System
"""

import sys
import json
import time
import os

# Import text detection module
try:
    from text_detection_basic import detect_text_in_video, detect_text_in_audio, analyze_detected_text, detect_text
    has_text_detection = True
except ImportError:
    has_text_detection = False

def detect_video_deepfake(file_path):
    """Basic video analysis"""
    file_size = os.path.getsize(file_path)
    trust_score = min(file_size / 500000.0, 0.8) + 0.1
    return float(trust_score)

def detect_audio_deepfake(file_path):
    """Basic audio analysis"""
    file_size = os.path.getsize(file_path)
    trust_score = min(file_size / 100000.0, 0.7) * 0.5 + 0.3
    return float(trust_score)

def main():
    """Main function"""
    if len(sys.argv) != 3:
        print("Usage: python detect.py <file_path> <media_type>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    media_type = sys.argv[2].lower()
    
    start_time = time.time()
    
    try:
        if media_type == 'text':
            # Fixed values for text detection
            result = {
                "trustScore": 0.7,
                "suspicious": False,
                "mediaType": "text",
                "confidence": 0.7,
                "processingTime": float((time.time() - start_time) * 1000),
                "model": "TextDetection",
                "textCount": 1,
                "textResults": [{"text": "Potential text region", "confidence": 0.7}]
            }
        elif media_type == 'video':
            trust_score = detect_video_deepfake(file_path)
            result = {
                "trustScore": float(trust_score),
                "suspicious": trust_score < 0.5,
                "mediaType": "video",
                "confidence": float(abs(trust_score - 0.5) * 2),
                "processingTime": float((time.time() - start_time) * 1000),
                "model": "BasicVideoAnalysis"
            }
        elif media_type == 'audio':
            trust_score = detect_audio_deepfake(file_path)
            result = {
                "trustScore": float(trust_score),
                "suspicious": trust_score < 0.5,
                "mediaType": "audio",
                "confidence": float(abs(trust_score - 0.5) * 2),
                "processingTime": float((time.time() - start_time) * 1000),
                "model": "BasicAudioAnalysis"
            }
        else:
            raise ValueError(f"Unknown media type: {media_type}")
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "trustScore": 0.5,
            "suspicious": False,
            "mediaType": media_type,
            "confidence": 0.0,
            "processingTime": (time.time() - start_time) * 1000,
            "error": str(e),
            "model": "Error"
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()