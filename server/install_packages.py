#!/usr/bin/env python3
"""
Custom installation script to work around permission issues
"""

import sys
import subprocess
import os

def install_packages():
    """Install packages one by one with error handling"""
    print("Installing packages with custom error handling...")
    
    # Install core packages first
    core_packages = [
        "opencv-python==4.8.1.78",
        "numpy==1.26.0",
        "torch==2.0.1",
        "torchvision==0.15.2"
    ]
    
    # Install pytesseract separately
    ocr_package = "pytesseract==0.3.10"
    
    # Use pip with user flag to avoid permission issues
    pip_cmd = [sys.executable, "-m", "pip", "install", "--user"]
    
    # Install core packages
    for package in core_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call(pip_cmd + [package])
            print(f"Successfully installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to install {package}. Error: {e}")
    
    # Install pytesseract with special handling
    try:
        print(f"\nInstalling {ocr_package}...")
        # Try with --no-deps to avoid pybidi dependency
        subprocess.check_call(pip_cmd + ["--no-deps", ocr_package])
        print(f"Successfully installed {ocr_package} without dependencies")
        
        # Now install the minimal dependencies it needs
        print("Installing minimal dependencies...")
        subprocess.check_call(pip_cmd + ["pillow"])
        print("Successfully installed dependencies")
    except subprocess.CalledProcessError as e:
        print(f"Warning: Failed to install {ocr_package}. Error: {e}")
    
    print("\nInstallation complete. You may need to restart your application.")

if __name__ == "__main__":
    install_packages()