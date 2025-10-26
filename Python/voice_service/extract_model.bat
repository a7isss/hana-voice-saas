@echo off
echo 📦 Extracting Vosk Arabic Model
echo ================================
echo.
echo This will extract the downloaded model file.
echo Make sure vosk-model-ar-0.22.zip is in the models directory.
echo.

if not exist "Python/voice_service/models/vosk-model-ar-0.22.zip" (
    echo ❌ Model file not found!
    echo Expected location: Python/voice_service/models/vosk-model-ar-0.22.zip
    echo.
    echo Please download the model first by running: download_model.bat
    echo Or manually download from: https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip
    echo.
    pause
    exit /b 1
)

echo 📁 Extracting model files...
powershell -Command "Expand-Archive -Path 'Python/voice_service/models/vosk-model-ar-0.22.zip' -DestinationPath 'Python/voice_service/models/'"

if %errorlevel% neq 0 (
    echo ❌ Extraction failed!
    echo.
    echo Manual extraction steps:
    echo 1. Right-click on vosk-model-ar-0.22.zip in File Explorer
    echo 2. Select "Extract All..."
    echo 3. Choose Python/voice_service/models/ as destination
    echo 4. Click "Extract"
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
echo Verifying model files...
if exist "Python/voice_service/models/vosk-model-ar-0.22/am/final.mdl" (
    echo ✅ Model verification: PASSED
) else (
    echo ❌ Model verification: FAILED
    echo Required file missing: am/final.mdl
)

echo.
echo You can now test the voice service!
echo.
pause
