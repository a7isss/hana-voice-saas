#!/usr/bin/env python3
"""
Model Download Script for Arabic Healthcare Voice Service
Downloads and sets up Vosk Arabic and Coqui XTTS models on persistent disk
"""

import os
import logging
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def run_command(command: str, cwd: str = None) -> bool:
    """Run shell command with error handling"""
    try:
        logger.info(f"Running: {command}")
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True
        )
        logger.info(f"Command completed successfully: {command}")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed: {command}")
        logger.error(f"Error: {e.stderr}")
        return False

def download_vosk_arabic_model():
    """Download Vosk Arabic model"""
    model_path = "/data/models"
    vosk_model_path = f"{model_path}/vosk-model-ar-0.22"

    # Check if model already exists
    if os.path.exists(vosk_model_path) and os.path.exists(f"{vosk_model_path}/am/final.mdl"):
        logger.info("✅ Vosk Arabic model already exists, skipping download")
        return True

    logger.info("📥 Downloading Vosk Arabic model...")

    # Create models directory
    os.makedirs(model_path, exist_ok=True)

    try:
        # Download Vosk Arabic model (approximately 1.2GB)
        # Note: In production, you might want to use a mirror or pre-downloaded model
        download_url = "https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip"

        logger.info("Downloading from: https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip")
        logger.warning("This is a large download (~1.2GB). Please be patient...")

        # Use wget or curl to download
        if run_command(f"cd {model_path} && wget -O vosk-model-ar-0.22.zip {download_url}"):
            logger.info("✅ Download completed, extracting...")
            if run_command(f"cd {model_path} && unzip vosk-model-ar-0.22.zip"):
                if run_command(f"cd {model_path} && rm vosk-model-ar-0.22.zip"):
                    logger.info("✅ Vosk Arabic model setup complete!")
                    return True

        # Alternative download method using curl
        elif run_command(f"cd {model_path} && curl -L -o vosk-model-ar-0.22.zip {download_url}"):
            logger.info("✅ Download completed with curl, extracting...")
            if run_command(f"cd {model_path} && unzip vosk-model-ar-0.22.zip"):
                if run_command(f"cd {model_path} && rm vosk-model-ar-0.22.zip"):
                    logger.info("✅ Vosk Arabic model setup complete!")
                    return True

        logger.error("❌ Failed to download Vosk Arabic model")
        return False

    except Exception as e:
        logger.error(f"❌ Error setting up Vosk model: {e}")
        return False

def setup_tts_cache():
    """Setup Coqui TTS cache directory"""
    tts_cache_path = "/data/tts_cache"

    try:
        os.makedirs(tts_cache_path, exist_ok=True)
        logger.info(f"✅ TTS cache directory created: {tts_cache_path}")

        # Set proper permissions
        os.chmod(tts_cache_path, 0o755)
        logger.info("✅ TTS cache permissions set")

        return True

    except Exception as e:
        logger.error(f"❌ Error setting up TTS cache: {e}")
        return False

def verify_models():
    """Verify that all required models are available"""
    logger.info("🔍 Verifying model installation...")

    # Check Vosk model
    vosk_model_path = "/data/models/vosk-model-ar-0.22"
    required_vosk_files = [
        "am/final.mdl",
        "graph/HCLG.fst",
        "ivector/final.dubm",
        "conf/model.conf"
    ]

    vosk_ok = True
    for file_path in required_vosk_files:
        full_path = f"{vosk_model_path}/{file_path}"
        if os.path.exists(full_path):
            logger.info(f"✅ {file_path}")
        else:
            logger.error(f"❌ Missing: {file_path}")
            vosk_ok = False

    # Check TTS cache
    tts_cache_path = "/data/tts_cache"
    if os.path.exists(tts_cache_path):
        logger.info("✅ TTS cache directory exists")
    else:
        logger.error("❌ TTS cache directory missing")
        return False

    return vosk_ok

def main():
    """Main setup function"""
    logger.info("🚀 Starting Arabic Healthcare Voice Service model setup...")

    # Check if /data directory exists (persistent disk)
    if not os.path.exists("/data"):
        logger.error("❌ /data directory not found. Persistent disk not mounted!")
        logger.info("Please ensure the persistent disk is properly configured in render.yaml")
        sys.exit(1)

    logger.info("✅ /data directory found (persistent disk mounted)")

    # Setup TTS cache
    if not setup_tts_cache():
        logger.error("❌ Failed to setup TTS cache")
        sys.exit(1)

    # Download Vosk Arabic model
    if not download_vosk_arabic_model():
        logger.error("❌ Failed to download Vosk Arabic model")
        logger.info("You can manually download the model from:")
        logger.info("https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip")
        logger.info("And extract it to: /data/models/vosk-model-ar-0.22/")
        sys.exit(1)

    # Verify installation
    if verify_models():
        logger.info("🎉 All models verified successfully!")
        logger.info("📊 Model locations:")
        logger.info(f"   Vosk Arabic: /data/models/vosk-model-ar-0.22/")
        logger.info(f"   TTS Cache: /data/tts_cache/")
        logger.info("✅ Arabic Healthcare Voice Service is ready for deployment!")
        return True
    else:
        logger.error("❌ Model verification failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
