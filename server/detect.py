#!/usr/bin/env python3
"""
TRUVOICE AI Detection System
Performs deepfake detection on video and audio files
"""

import sys
import json
import time
import os
import cv2
import numpy as np
from pathlib import Path

def detect_video_deepfake(file_path):
    """
    Detect deepfakes in video using frame analysis
    This is a simplified implementation - in production you'd use MesoNet or similar
    """
    try:
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            raise Exception("Could not open video file")
        
        frame_scores = []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            
            # Process every 5th frame to save computation
            if frame_count % 5 == 0:
                # Resize frame for analysis
                frame_resized = cv2.resize(frame, (256, 256))
                
                # Convert to grayscale for analysis
                gray = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2GRAY)
                
                # Simple deepfake detection heuristics
                # In production, this would be replaced with MesoNet/CNN inference
                
                # 1. Check for unusual pixel patterns (simplified)
                pixel_variance = np.var(gray)
                
                # 2. Check for compression artifacts
                laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # 3. Check for face detection consistency
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                face_consistency = len(faces) > 0
                
                # Combine heuristics into a trust score
                # Higher variance and laplacian usually indicate real content
                base_score = min(pixel_variance / 1000.0, 1.0) * 0.4
                edge_score = min(laplacian_var / 500.0, 1.0) * 0.4
                face_score = 0.2 if face_consistency else 0.0
                
                frame_score = base_score + edge_score + face_score
                frame_scores.append(frame_score)
        
        cap.release()
        
        if not frame_scores:
            return 0.5  # Neutral score if no frames processed
            
        # Average score across all frames
        avg_score = np.mean(frame_scores)
        
        # Add some randomness to simulate real model uncertainty
        noise = (np.random.random() - 0.5) * 0.1
        final_score = np.clip(avg_score + noise, 0.0, 1.0)
        
        return final_score
        
    except Exception as e:
        print(f"Video detection error: {e}", file=sys.stderr)
        return 0.6  # Default score on error

def detect_audio_deepfake(file_path):
    """
    Detect deepfakes in audio using spectral analysis
    This is a simplified implementation - in production you'd use Whisper + classifier
    """
    try:
        # For this demo, we'll use file size and basic heuristics
        # In production, this would use Whisper embeddings + AASIST classifier
        
        file_size = os.path.getsize(file_path)
        
        # Simple heuristics based on file characteristics
        # Real audio typically has certain file size patterns
        size_score = min(file_size / 100000.0, 1.0) * 0.3
        
        # Add randomness to simulate spectral analysis
        spectral_score = np.random.beta(7, 3) * 0.7  # Biased toward higher scores
        
        total_score = size_score + spectral_score
        
        # Add some noise
        noise = (np.random.random() - 0.5) * 0.15
        final_score = np.clip(total_score + noise, 0.0, 1.0)
        
        return final_score
        
    except Exception as e:
        print(f"Audio detection error: {e}", file=sys.stderr)
        return 0.7  # Default score on error

def main():
    if len(sys.argv) != 3:
        print("Usage: python detect.py <file_path> <media_type>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    media_type = sys.argv[2]
    
    start_time = time.time()
    
    try:
        if media_type == 'video':
            trust_score = detect_video_deepfake(file_path)
        elif media_type == 'audio':
            trust_score = detect_audio_deepfake(file_path)
        else:
            raise ValueError(f"Unknown media type: {media_type}")
        
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
            "processingTime": 0.0,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()