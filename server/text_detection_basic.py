#!/usr/bin/env python3
"""
Minimal text detection module
"""

import sys
import os
import cv2
import numpy as np

def detect_text_basic(image):
    """Basic text detection"""
    return [("Potential text region", 0.7)]

def detect_text_in_video(video_path, max_frames=10):
    """Minimal video text detection"""
    return [{"text": "Potential text region", "confidence": 0.7, "timestamp": 0.0, "frame": 0}]

def detect_text_in_audio(audio_path):
    """Placeholder"""
    return []

def analyze_detected_text(text_results):
    """Simple analysis"""
    return {
        "has_text": True,
        "suspicious": False,
        "confidence": 0.7,
        "text_count": 1
    }

def detect_text(image):
    """Detect text in image"""
    return detect_text_basic(image)