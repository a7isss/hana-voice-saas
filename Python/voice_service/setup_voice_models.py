#!/usr/bin/env python3
"""
Smart Voice Models Setup Script
Automatically sets up voice models for Railway deployment
- Copies local models if available
- Downloads models if not available locally
- Supports both development and production environments
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VoiceModelSetup:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.models_dir = self.base_dir / "models"
        # Railway mounts volume at /data/models, so /data is accessible
        self.data_dir = Path("/data")
        # Volume mount point is /data/models, so models go directly here
        self.target_models_dir = self.data_dir / "models"
        
        # Model configurations
        self.vosk_config = {
            "name": "vosk-model-ar-0.22-linto-1.1.0",
            "local_path": self.models_dir / "vosk-model-ar-0.22-linto-1.1.0",  # Correct local path
            "target_path": self.target_models_dir / "stt" / "vosk-model-ar-0.22-linto-1.1.0",
            "size_mb": 500,
            "source_type": "github"  # or "local" if found
        }

        self.tts_config = {
            "name": "tts_models--multilingual--multi-dataset--xtts_v2",
            "local_path": self.models_dir / "tts" / "tts_models--multilingual--multi-dataset--xtts_v2",
            "target_path": self.target_models_dir / "tts" / "tts_models--multilingual--multi-dataset--xtts_v2",
            "size_mb": 1000,
            "source_type": "auto"  # TTS library handles downloads automatically
        }
        
        # Download URLs for models
        self.download_urls = {
            "vosk": "https://alphacephei.com/vosk/models/vosk-model-ar-0.22-linto-1.1.0.zip",
            "tts": None  # Will be handled by TTS library
        }

    def check_local_models(self) -> Tuple[bool, bool]:
        """Check if models exist locally"""
        logger.info("Checking for local voice models...")
        
        vosk_local = self.vosk_config["local_path"].exists()
        tts_local = self.tts_config["local_path"].exists()
        
        logger.info(f"Local Vosk model: {'✅ Found' if vosk_local else '❌ Not found'}")
        logger.info(f"Local TTS model: {'✅ Found' if tts_local else '❌ Not found'}")
        
        return vosk_local, tts_local

    def create_directories(self) -> None:
        """Create necessary directories"""
        logger.info("Creating model directories...")
        
        directories = [
            self.target_models_dir / "stt",
            self.target_models_dir / "tts",
            self.data_dir  # Ensure /data exists
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"✓ Created: {directory}")

    def copy_local_model(self, config: dict) -> bool:
        """Copy local model to target directory"""
        local_path = config["local_path"]
        target_path = config["target_path"]
        
        if not local_path.exists():
            logger.warning(f"Local model not found: {local_path}")
            return False
            
        logger.info(f"Copying {config['name']} from {local_path} to {target_path}")
        
        try:
            # Create target directory
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Use rsync for efficient copying with progress
            if sys.platform.startswith('linux') or sys.platform.startswith('darwin'):
                # Linux/macOS
                cmd = ["rsync", "-av", "--progress", str(local_path) + "/", str(target_path) + "/"]
            else:
                # Windows - use robocopy
                cmd = ["robocopy", str(local_path), str(target_path), "/E", "/R:3", "/W:1", "/LOG:nul"]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0 or (sys.platform.startswith('win') and result.returncode <= 7):
                logger.info(f"✅ Successfully copied {config['name']} ({config['size_mb']}MB)")
                return True
            else:
                logger.error(f"Failed to copy {config['name']}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error copying {config['name']}: {e}")
            return False

    def download_model(self, config: dict) -> bool:
        """Download model from remote source"""
        logger.info(f"Downloading {config['name']} ({config['size_mb']}MB)...")
        
        if config['name'].startswith('vosk'):
            return self.download_vosk_model(config)
        elif config['name'].startswith('tts_models'):
            return self.download_tts_model(config)
        else:
            logger.error(f"Unknown model type: {config['name']}")
            return False

    def download_vosk_model(self, config: dict) -> bool:
        """Download Vosk model"""
        import requests
        
        target_path = config["target_path"]
        url = self.download_urls["vosk"]
        
        try:
            logger.info(f"Downloading from: {url}")
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Get file size for progress tracking
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            zip_path = target_path.parent / f"{config['name']}.zip"
            
            with open(zip_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Progress update
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            logger.info(f"Download progress: {progress:.1f}%")
            
            logger.info("Extracting model...")
            # Extract the zip file
            import zipfile
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_path.parent)
            
            # Remove zip file to save space
            zip_path.unlink()
            
            logger.info(f"✅ Successfully downloaded {config['name']}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download {config['name']}: {e}")
            return False

    def download_tts_model(self, config: dict) -> bool:
        """Download TTS model using TTS library"""
        try:
            logger.info("Downloading Coqui XTTS model...")
            
            # Import TTS after dependencies are installed
            from TTS.api import TTS
            
            # This will download the model automatically
            target_path = config["target_path"]
            target_path.mkdir(parents=True, exist_ok=True)
            
            # Create TTS model and download
            tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            
            logger.info(f"✅ Successfully downloaded TTS model to {target_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to download TTS model: {e}")
            return False

    def setup_models(self) -> bool:
        """Main setup function - Prioritizes downloads for Railway deployment"""
        logger.info("🎯 Starting voice model setup...")

        # Check for local models (mostly for development environments)
        vosk_local, tts_local = self.check_local_models()
        is_railway = os.path.exists("/data")

        # Create directories
        self.create_directories()

        success_count = 0
        total_models = 2

        # Setup Vosk model - PRIORITIZE DOWNLOADS for Railway deployment
        logger.info("\n--- Setting up Vosk Arabic STT Model ---")

        # Check if target already exists on volume (Railway)
        if self.vosk_config["target_path"].exists():
            logger.info("✅ Vosk model already exists on volume")
            success_count += 1
        elif is_railway:
            # Railway deployment: Always try download first
            logger.info("⬇️ Railway deployment: Downloading Vosk model...")
            if self.download_model(self.vosk_config):
                success_count += 1
            else:
                logger.error("❌ Railway: Failed to download Vosk model")
        else:
            # Development environment: Try local copy first, then download
            if vosk_local:
                logger.info("Using local Vosk model (development)")
                if self.copy_local_model(self.vosk_config):
                    success_count += 1
            else:
                logger.info("Downloading Vosk model (development)")
                if self.download_model(self.vosk_config):
                    success_count += 1

        # Setup TTS model - Just create directories, TTS library handles downloads
        logger.info("\n--- Setting up Coqui XTTS TTS Model ---")

        # Check if TTS target already exists
        if self.tts_config["target_path"].exists():
            logger.info("✅ TTS model already exists on volume")
            success_count += 1
        else:
        else:
            logger.info("TTS model not found on volume. Downloading to persistent storage...")
            # Ensure TTS directory exists
            self.tts_config["target_path"].parent.mkdir(parents=True, exist_ok=True)
            
            # Trigger download by instantiating TTS
            # Since we set TTS_HOME=/data/models/tts in environment, it should download there
            if self.download_tts_model(self.tts_config):
                success_count += 1
            else:
                logger.error("❌ Failed to download TTS model to volume")

        # Final status
        logger.info(f"\n🎉 Setup completed: {success_count}/{total_models} models ready")

        if success_count == total_models:
            logger.info("✅ All voice models are ready for use!")
            self.verify_models()
            return True
        else:
            logger.error(f"⚠️  Only {success_count}/{total_models} models ready")
            return False

    def verify_models(self) -> None:
        """Verify that models are properly set up"""
        logger.info("\n🔍 Verifying model setup...")
        
        models_to_check = [
            self.vosk_config["target_path"],
            self.tts_config["target_path"]
        ]
        
        for model_path in models_to_check:
            if model_path.exists():
                # Count files to verify it's a real model
                file_count = len(list(model_path.rglob("*")))
                logger.info(f"✅ {model_path.name}: {file_count} files")
            else:
                logger.error(f"❌ {model_path.name}: Not found")

def main():
    """Main entry point"""
    setup = VoiceModelSetup()
    
    # Check if we're in a volume environment (Railway)
    if os.path.exists("/data"):
        logger.info("📦 Detected Railway volume environment")
        success = setup.setup_models()
        sys.exit(0 if success else 1)
    else:
        logger.info("🖥️  Local development environment")
        logger.info("Models are already available locally")
        sys.exit(0)

if __name__ == "__main__":
    main()
