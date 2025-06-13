#!/usr/bin/env python3
"""
Tesseract OCR setup and testing script
"""

import sys
import os
import subprocess
import platform

def find_tesseract():
    """Try to find Tesseract OCR installation"""
    print("Searching for Tesseract OCR installation...")
    
    # Common installation paths
    common_paths = []
    
    if platform.system() == "Windows":
        common_paths = [
            r"C:\Program Files\Tesseract-OCR",
            r"C:\Program Files (x86)\Tesseract-OCR",
            r"C:\Tesseract-OCR"
        ]
    elif platform.system() == "Darwin":  # macOS
        common_paths = [
            "/usr/local/bin",
            "/opt/homebrew/bin",
            "/usr/bin"
        ]
    else:  # Linux and others
        common_paths = [
            "/usr/bin",
            "/usr/local/bin"
        ]
    
    # Check common paths
    for path in common_paths:
        tesseract_path = os.path.join(path, "tesseract.exe" if platform.system() == "Windows" else "tesseract")
        if os.path.exists(tesseract_path):
            print(f"Found Tesseract at: {tesseract_path}")
            return tesseract_path
    
    # Try to find using where/which command
    try:
        if platform.system() == "Windows":
            result = subprocess.run(["where", "tesseract"], capture_output=True, text=True)
        else:
            result = subprocess.run(["which", "tesseract"], capture_output=True, text=True)
        
        if result.returncode == 0 and result.stdout.strip():
            path = result.stdout.strip().split("\n")[0]
            print(f"Found Tesseract at: {path}")
            return path
    except Exception as e:
        print(f"Error searching for Tesseract: {e}")
    
    print("Tesseract not found in common locations.")
    return None

def test_pytesseract(tesseract_path=None):
    """Test if pytesseract can use Tesseract OCR"""
    try:
        import pytesseract
        
        # Set Tesseract path if provided
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
        
        # Get version
        version = pytesseract.get_tesseract_version()
        print(f"Tesseract version: {version}")
        
        # Test with a simple image
        try:
            import numpy as np
            import cv2
            
            # Create a simple test image with text
            img = np.zeros((100, 300), dtype=np.uint8)
            img.fill(255)
            
            # Add text to the image
            cv2.putText(img, "TEST TEXT", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
            
            # Try to extract text
            text = pytesseract.image_to_string(img)
            print(f"Extracted text: '{text.strip()}'")
            
            if text.strip():
                print("✅ Tesseract OCR is working correctly!")
                return True
            else:
                print("❌ Tesseract OCR didn't extract any text from test image.")
                return False
                
        except ImportError:
            print("Could not create test image (OpenCV or NumPy missing).")
            print("Testing with basic Tesseract functionality only.")
            return True  # Assume it's working if we got the version
            
    except Exception as e:
        print(f"❌ Tesseract test failed: {e}")
        return False

def create_config_file(tesseract_path):
    """Create a configuration file with the Tesseract path"""
    config_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(config_dir, "tesseract_config.py")
    
    with open(config_path, "w") as f:
        f.write(f"""#!/usr/bin/env python3
\"\"\"
Tesseract OCR configuration
Generated automatically by tesseract_setup.py
\"\"\"

# Path to Tesseract executable
TESSERACT_PATH = r"{tesseract_path}"
""")
    
    print(f"Created configuration file at: {config_path}")
    return config_path

def main():
    """Main function"""
    print("Tesseract OCR Setup and Testing")
    print("==============================")
    
    # Check if pytesseract is installed
    try:
        import pytesseract
        print("✅ pytesseract is installed")
    except ImportError:
        print("❌ pytesseract is not installed")
        print("Please install it with: pip install pytesseract")
        return False
    
    # Find Tesseract installation
    tesseract_path = find_tesseract()
    
    if not tesseract_path:
        print("\n❌ Tesseract OCR not found!")
        print("Please download and install Tesseract OCR from:")
        print("https://github.com/UB-Mannheim/tesseract/wiki")
        
        # Ask for manual path
        print("\nIf Tesseract is already installed, please enter the path to tesseract.exe:")
        manual_path = input("> ").strip()
        
        if manual_path and os.path.exists(manual_path):
            tesseract_path = manual_path
        else:
            print("Invalid path or no path provided.")
            return False
    
    # Test pytesseract with the found path
    print("\nTesting Tesseract OCR...")
    if test_pytesseract(tesseract_path):
        # Create configuration file
        config_path = create_config_file(tesseract_path)
        
        print("\n✅ Setup complete!")
        print(f"Tesseract path: {tesseract_path}")
        print(f"Configuration saved to: {config_path}")
        
        # Show how to use in code
        print("\nTo use Tesseract in your code, add:")
        print("```python")
        print("import pytesseract")
        print(f"pytesseract.pytesseract.tesseract_cmd = r'{tesseract_path}'")
        print("```")
        
        return True
    else:
        print("\n❌ Tesseract OCR test failed!")
        print("Please check your Tesseract installation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)