#!/usr/bin/env python3
"""
TRUVOICE AI Detection System
Performs deepfake detection on video and audio files
"""

import sys
import json
import time
import os
import random
from pathlib import Path

def detect_video_deepfake(file_path):
    """
    Simplified mock detection for video files
    """
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")
            
        # Get file size as a simple heuristic
        file_size = os.path.getsize(file_path)
        
        # Generate a trust score based on file size and randomness
        # This is just a mock implementation
        base_score = min(file_size / 500000.0, 0.8)
        
        # Add randomness to simulate real model
        random_factor = random.uniform(0.1, 0.3)
        
        # Bias toward higher scores (more likely to be real)
        trust_score = min(base_score + random_factor, 1.0)
        
        # Occasionally flag as suspicious
        if random.random() < 0.15:  # 15% chance of being suspicious
            trust_score = random.uniform(0.3, 0.55)
            
        return trust_score
        
    except Exception as e:
        print(f"Video detection error: {e}", file=sys.stderr)
        return 0.6  # Default score on error

def detect_audio_deepfake(file_path):
    """
    Simplified mock detection for audio files
    """
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")
            
        # Get file size as a simple heuristic
        file_size = os.path.getsize(file_path)
        
        # Generate a trust score based on file size and randomness
        base_score = min(file_size / 100000.0, 0.7) * 0.5
        
        # Add randomness to simulate real model
        random_factor = random.uniform(0.2, 0.5)
        
        # Bias toward higher scores (more likely to be real)
        trust_score = min(base_score + random_factor, 1.0)
        
        # Occasionally flag as suspicious
        if random.random() < 0.2:  # 20% chance of being suspicious
            trust_score = random.uniform(0.3, 0.55)
            
        return trust_score
        
    except Exception as e:
        print(f"Audio detection error: {e}", file=sys.stderr)
        return 0.7  # Default score on error

def main():
    """Main function to process command line arguments and run detection"""
    if len(sys.argv) != 3:
        print("Usage: python detect.py <file_path> <media_type>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    media_type = sys.argv[2].lower()  # Normalize input
    
    # Add a small delay to simulate processing time (50-300ms)
    time.sleep(random.uniform(0.05, 0.3))
    
    start_time = time.time()
    
    try:
        if media_type == 'video':
            trust_score = detect_video_deepfake(file_path)
        elif media_type == 'audio':
            trust_score = detect_audio_deepfake(file_path)
        else:
            raise ValueError(f"Unknown media type: {media_type}. Must be 'video' or 'audio'.")
        
        processing_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Determine if content is suspicious
        suspicious = trust_score < 0.6
        
        # Calculate confidence based on score extremes
        confidence = abs(trust_score - 0.5) * 2
        
        result = {
            "trustScore": float(trust_score),
            "suspicious": suspicious,
            "mediaType": media_type,
            "confidence": float(confidence),
            "processingTime": float(processing_time)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "trustScore": 0.5,
            "suspicious": False,
            "mediaType": media_type,
            "confidence": 0.0,
            "processingTime": (time.time() - start_time) * 1000,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()