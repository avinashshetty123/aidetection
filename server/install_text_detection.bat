@echo off
echo Installing text detection components...

:: Create a directory for Tesseract if it doesn't exist
if not exist "%USERPROFILE%\Tesseract-OCR" (
    echo Creating Tesseract directory...
    mkdir "%USERPROFILE%\Tesseract-OCR"
)

:: Check if Tesseract is already installed
if exist "C:\Program Files\Tesseract-OCR\tesseract.exe" (
    echo Tesseract is already installed in Program Files.
) else if exist "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe" (
    echo Tesseract is already installed in Program Files (x86).
) else if exist "%USERPROFILE%\Tesseract-OCR\tesseract.exe" (
    echo Tesseract is already installed in user directory.
) else (
    echo Tesseract OCR is not installed.
    echo Please download and install Tesseract OCR from:
    echo https://github.com/UB-Mannheim/tesseract/wiki
    echo.
    echo After installation, text detection will work automatically.
)

:: Install pytesseract without dependencies
echo Installing pytesseract without dependencies...
pip install --no-deps pytesseract

:: Install Pillow (required by pytesseract)
echo Installing Pillow...
pip install pillow

echo.
echo Setup complete!
echo If you installed Tesseract OCR, please restart the application.
echo.
pause