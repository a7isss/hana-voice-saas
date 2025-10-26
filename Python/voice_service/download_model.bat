@echo off
echo 🚀 Downloading Vosk Arabic Model for Hana Voice Service
echo ====================================================
echo.
echo This will download the Arabic speech recognition model (~1.2GB)
echo Make sure you have a stable internet connection.
echo.
echo Model will be saved to: Python/voice_service/models/
echo.
pause

echo.
echo 📥 Starting download...
echo URL: https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip
echo Destination: Python/voice_service/models/vosk-model-ar-0.22.zip
echo.

powershell -Command "Invoke-WebRequest -Uri 'https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip' -OutFile 'Python/voice_service/models/vosk-model-ar-0.22.zip'"

if %errorlevel% neq 0 (
    echo ❌ Download failed!
    echo.
    echo Alternative download options:
    echo 1. Use a web browser to download from: https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip
    echo 2. Save the file as: Python/voice_service/models/vosk-model-ar-0.22.zip
    echo 3. Then run: extract_model.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Download completed successfully!
echo.
echo 📦 Extracting model files...
powershell -Command "Expand-Archive -Path 'Python/voice_service/models/vosk-model-ar-0.22.zip' -DestinationPath 'Python/voice_service/models/'"

if %errorlevel% neq 0 (
    echo ❌ Extraction failed!
    echo.
    echo Manual extraction steps:
    echo 1. Right-click on vosk-model-ar-0.22.zip
    echo 2. Select "Extract All..."
    echo 3. Extract to: Python/voice_service/models/
    echo.
    pause
    exit /b 1
)

echo ✅ Model extracted successfully!
echo.
echo 🧹 Cleaning up zip file...
del Python/voice_service/models/vosk-model-ar-0.22.zip

echo.
echo 🎉 Model setup complete!
echo Model location: Python/voice_service/models/vosk-model-ar-0.22/
echo.
echo You can now test the voice service with:
echo python -m app.main
echo.
pause
