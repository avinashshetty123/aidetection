#!/usr/bin/env python3
"""
Setup script to check and install required dependencies
"""

import sys
import subprocess
import os
import platform

def check_and_install_dependencies():
    """Check and install required dependencies"""
    print("Checking and installing required dependencies...")
    
    # Use pip with --no-cache-dir to avoid caching issues
    pip_cmd = [sys.executable, "-m", "pip", "install", "--no-cache-dir"]
    
    # Add --user flag if not in a virtual environment (helps avoid permission issues)
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        pip_cmd.append("--user")
    
    # Core packages - try to install individually to continue if one fails
    core_packages = [
        "opencv-python",
        "numpy",
        "torch",
        "torchvision"
    ]
    
    # Optional packages
    optional_packages = [
        "facenet-pytorch",
        "librosa",
        "onnxruntime"
    ]
    
    # Install core packages
    print("Installing core packages...")
    for package in core_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call(pip_cmd + [package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to install {package}. Error: {e}")
            print("The system will try to continue with reduced functionality.")
    
    # Try to install optional packages
    print("\nInstalling optional packages...")
    for package in optional_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call(pip_cmd + [package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Note: Failed to install optional package {package}. Error: {e}")
            print("Some features may not work, but the system will continue.")
    
    print("\nSetup complete! Some packages might not have installed correctly, but the system will use fallback methods.")

if __name__ == "__main__":
    check_and_install_dependencies()