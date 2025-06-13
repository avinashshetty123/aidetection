#!/usr/bin/env python3
"""
Text detection module for TRUVOICE AI Detection System
Uses pytesseract with Tesseract OCR
"""

import sys
import os
import cv2
import numpy as np
from pathlib import Path

# Handle import errors gracefully
try:
    import pytesseract
    has_pytesseract = True
    
    # Set Tesseract path if not in PATH
    try:
        # Try to load from config file first
        from tesseract_config import TESSERACT_PATH
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        print(f"Using Tesseract from config: {TESSERACT_PATH}", file=sys.stderr)
    except ImportError:
        # Common installation paths
        common_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            r'C:\Tesseract-OCR\tesseract.exe'
        ]
        
        # Try each path
        for path in common_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"Found Tesseract at: {path}", file=sys.stderr)
                break
    
except ImportError:
    has_pytesseract = False
    print("Warning: pytesseract not installed. Text detection will be limited.", file=sys.stderr)

def detect_text_pytesseract(image):
    """Detect text in image using pytesseract"""
    if not has_pytesseract:
        return []
    
    try:
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply threshold to get black and white image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # Get text
        text = pytesseract.image_to_string(binary)
        
        # Get confidence data
        data = pytesseract.image_to_data(binary, output_type=pytesseract.Output.DICT)
        
        results = []
        for i, conf in enumerate(data['conf']):
            if conf > 0:  # Filter out -1 confidence values
                text_item = data['text'][i]
                if text_item.strip():  # Only include non-empty text
                    confidence = float(conf) / 100.0
                    results.append((text_item, confidence))
        
        # If no detailed results but we have text, return with default confidence
        if not results and text.strip():
            results = [(text.strip(), 0.7)]
            
        return results
    except Exception as e:
        print(f"Pytesseract error: {e}", file=sys.stderr)
        return []

def detect_text_basic(image):
    """
    Basic text detection using edge detection and contour analysis
    Fallback when pytesseract is not available
    """
    try:
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Dilate to connect nearby edges
        kernel = np.ones((3, 3), np.uint8)
        dilated = cv2.dilate(edges, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours by size and shape
        text_regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by aspect ratio and size
            aspect_ratio = w / float(h)
            area = w * h
            
            # Text regions typically have specific aspect ratios and sizes
            if 0.1 < aspect_ratio < 10 and area > 100 and area < 10000:
                text_regions.append((x, y, w, h))
        
        # Simple heuristic: more small rectangular regions = more likely to contain text
        text_likelihood = min(len(text_regions) / 20.0, 1.0)
        
        return [("Potential text region", text_likelihood)]
    
    except Exception as e:
        print(f"Basic text detection error: {e}", file=sys.stderr)
        return []

def detect_text(image):
    """Detect text in image using available methods"""
    # Try pytesseract first
    if has_pytesseract:
        results = detect_text_pytesseract(image)
        if results:
            return results
    
    # Fall back to basic method
    return detect_text_basic(image)

def detect_text_in_video(video_path, max_frames=10):
    """Detect text in video frames"""
    if not os.path.exists(video_path):
        print(f"Video file not found: {video_path}", file=sys.stderr)
        return []
    
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Could not open video: {video_path}", file=sys.stderr)
            return []
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = frame_count / fps if fps > 0 else 0
        
        # Calculate frame interval to sample evenly throughout the video
        interval = max(1, frame_count // max_frames)
        
        all_text = []
        current_frame = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process only selected frames
            if current_frame % interval == 0:
                # Resize for faster processing
                resized = cv2.resize(frame, (640, 360))
                
                # Detect text in frame
                text_results = detect_text(resized)
                
                # Add timestamp information
                timestamp = current_frame / fps if fps > 0 else 0
                for text, confidence in text_results:
                    all_text.append({
                        "text": text,
                        "confidence": confidence,
                        "timestamp": timestamp,
                        "frame": current_frame
                    })
            
            current_frame += 1
        
        cap.release()
        return all_text
    
    except Exception as e:
        print(f"Error detecting text in video: {e}", file=sys.stderr)
        return []

def detect_text_in_audio(audio_path):
    """Placeholder for detecting text in audio (e.g., speech-to-text)"""
    # This would require a speech-to-text model
    # For now, return empty result
    return []

def analyze_detected_text(text_results):
    """Analyze detected text for suspicious content"""
    if not text_results:
        return {
            "has_text": False,
            "suspicious": False,
            "confidence": 0.0,
            "text_count": 0
        }
    
    # Count total text items
    text_count = len(text_results)
    
    # Calculate average confidence
    avg_confidence = sum(item["confidence"] for item in text_results) / text_count if text_count > 0 else 0
    
    # Simple heuristic: more text with higher confidence is more suspicious
    # This is a placeholder for more sophisticated analysis
    suspicion_score = min(avg_confidence * (text_count / 5), 1.0)
    
    return {
        "has_text": text_count > 0,
        "suspicious": suspicion_score > 0.6,
        "confidence": avg_confidence,
        "text_count": text_count,
        "suspicion_score": suspicion_score
    }

def test_tesseract():
    """Test if Tesseract is working properly"""
    if not has_pytesseract:
        print("pytesseract is not installed")
        return False
    
    try:
        # Try to get tesseract version
        version = pytesseract.get_tesseract_version()
        print(f"Tesseract version: {version}")
        
        # Create a simple test image with text
        img = np.zeros((100, 300), dtype=np.uint8)
        img.fill(255)
        
        # Add text to the image
        cv2.putText(img, "TEST TEXT", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        
        # Try to extract text
        text = pytesseract.image_to_string(img)
        print(f"Extracted text: '{text.strip()}'")
        
        return len(text.strip()) > 0
    except Exception as e:
        print(f"Tesseract test failed: {e}")
        return False

if __name__ == "__main__":
    # Test if Tesseract is working
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        if test_tesseract():
            print("Tesseract is working correctly")
        else:
            print("Tesseract is not working correctly")
        sys.exit(0)
        
    # Test the module if run directly with a file
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            if file_path.lower().endswith(('.mp4', '.avi', '.mov', '.webm')):
                results = detect_text_in_video(file_path)
                analysis = analyze_detected_text(results)
                print(f"Text detection results: {len(results)} items found")
                print(f"Analysis: {analysis}")
            elif file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                image = cv2.imread(file_path)
                results = detect_text(image)
                print(f"Text detection results: {results}")
            else:
                print(f"Unsupported file type: {file_path}")
        else:
            print(f"File not found: {file_path}")
    else:
        print("Usage: python text_detection.py <file_path>")
        print("       python text_detection.py --test")