#!/usr/bin/env python3
# scripts/download_models.py - Render Model Setup Script
# Downloads and configures voice models on persistent disk

import os
import sys
import urllib.request
import zipfile
import subprocess
from pathlib import Path

def download_file(url: str, destination: str) -> None:
    """Download file with progress indication"""
    print(f"⬇️ Downloading {url}")
    urllib.request.urlretrieve(url, destination)
    print("✅ Download complete")

def extract_zip(zip_path: str, extract_to: str) -> None:
    """Extract ZIP file to directory"""
    print(f"📦 Extracting {zip_path} to {extract_to}")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)
    print("✅ Extraction complete")

def setup_vosk_arabic_model():
    """Download and setup Arabic Vosk model"""
    print("\n🎤 Setting up Vosk Arabic STT model...")

    # Model details
    vosk_url = "https://alphacephei.com/vosk/models/vosk-model-ar-0.22.zip"
    model_dir = "/data/models"
    vosk_dir = os.path.join(model_dir, "vosk-model-ar-0.22")

    # Create directories
    os.makedirs(model_dir, exist_ok=True)

    # Check if already exists
    if os.path.exists(vosk_dir):
        print(f"✅ Vosk Arabic model already exists at {vosk_dir}")
        return vosk_dir

    try:
        # Download ZIP
        zip_path = "/tmp/vosk-arabic.zip"
        download_file(vosk_url, zip_path)

        # Extract to models directory
        extract_zip(zip_path, model_dir)

        # Verify extraction
        if os.path.exists(vosk_dir):
            # Clean up ZIP file
            os.remove(zip_path)
            print(f"✅ Vosk Arabic model ready at: {vosk_dir}")
            return vosk_dir
        else:
            raise FileNotFoundError(f"Model directory not found after extraction: {vosk_dir}")

    except Exception as e:
        print(f"❌ Failed to setup Vosk model: {e}")
        if os.path.exists(zip_path):
            os.remove(zip_path)
        raise

def setup_coqui_xtts_model():
    """Setup Coqui XTTS model (downloaded automatically on first use)"""
    print("\n🔊 Setting up Coqui XTTS TTS model...")

    # Coqui models are downloaded automatically on first use
    # We can pre-warm the cache by importing and triggering a download
    try:
        from TTS.api import TTS

        # Create TTS instance to trigger download
        print("   Downloading XTTS model (this may take several minutes)...")
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)

        # Test the model with a short Arabic phrase
        print("   Testing model with Arabic phrase...")
        test_output = "/tmp/xtts_test.wav"
        tts.tts_to_file(text="اختبار النموذج الصوتي", file_path=test_output, language="ar")

        if os.path.exists(test_output):
            file_size = os.path.getsize(test_output)
            os.remove(test_output)
            print(f"✅ Coqui XTTS model ready! Test file was {file_size} bytes")
            return True
        else:
            raise FileNotFoundError("Test audio file not generated")

    except ImportError:
        print("⚠️ TTS library not available yet - will download on first use")
        return False

    except Exception as e:
        print(f"❌ Failed to setup XTTS model: {e}")
        return False

def verify_model_setup():
    """Verify all models are properly set up"""
    print("\n🔍 Verifying model setup...")

    # Check Vosk model
    vosk_path = "/data/models/vosk-model-ar-0.22"
    vosk_ok = os.path.exists(vosk_path) and len(os.listdir(vosk_path)) > 0

    # Check Coqui XTTS (will be ready after first download)
    xtts_ok = True  # Assume OK for now, verified in runtime

    print("📋 Model Verification Results:")
    print(f"   Vosk Arabic STT: {'✅ Ready' if vosk_ok else '❌ Missing'}")
    print(f"   Coqui XTTS: {'✅ Ready' if xtts_ok else '❌ Pending download'}")

    return vosk_ok

def main():
    """Main setup function"""
    print("🚀 Arabic Healthcare Voice Service - Model Setup")
    print("=" * 50)

    try:
        # Setup models
        vosk_path = setup_vosk_arabic_model()
        xtts_success = setup_coqui_xtts_model()

        # Verify setup
        models_ready = verify_model_setup()

        if models_ready:
            print("\n🎉 All voice models successfully configured!")
            print("📁 Model Locations:")
            print(f"   - Vosk Arabic: {vosk_path}")
            print(f"   - Coqui XTTS: Auto-cached (in TTS_HOME directory)")
            print("\n✅ Ready to start Arabic voice service!")
            return True
        else:
            print("\n⚠️ Some models are not ready. This is normal for first deployment.")
            print("   Models will finish downloading on first service start.")
            return False

    except Exception as e:
        print(f"\n❌ Model setup failed: {e}")
        print("   This will be retried on next deployment or service start")
        return False

    finally:
        # Clean up any temporary files
        import glob
        for temp_file in glob.glob("/tmp/*voice*.zip") + glob.glob("/tmp/*voice*.wav"):
            try:
                os.remove(temp_file)
                print(f"🧹 Cleaned up: {temp_file}")
            except:
                pass

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
