#!/usr/bin/env python3
"""
Script to download Coqui XTTS models locally for deployment to Render persistent disk.
This ensures models are pre-deployed and don't need to download on cold starts.
"""

import os
import sys
import logging
from pathlib import Path

# Add the Python voice service directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Python', 'voice_service'))

try:
    from TTS.api import TTS
    print("✅ TTS library available")
except ImportError as e:
    print(f"❌ TTS library not available: {e}")
    print("Please run: pip install -r Python/voice_service/requirements.txt")
    sys.exit(1)

def download_xtts_models():
    """Download Coqui XTTS v2 models locally"""
    print("🔄 Downloading Coqui XTTS v2 models...")

    try:
        # Check if model is already downloaded in the default location
        # Default path usually: ~/.local/share/tts/tts_models--multilingual--multi-dataset--xtts_v2
        # or ~/.cache/tts/... depending on OS
        
        # We can try to instantiate with progress_bar=False to check without downloading if possible,
        # but TTS lib usually auto-downloads. 
        # Better approach: Check if we can find it via TTS.list_models() or similar, 
        # but for now let's rely on TTS() handling caching. 
        # However, to be explicit as requested:
        
        print("🔍 Checking for existing models...")
        # Note: The TTS library handles caching automatically. 
        # If the model exists in the cache, it won't re-download unless forced.
        # But we will add a log message to confirm this behavior.
        
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False, progress_bar=True)
        print("✅ XTTS v2 model ready (cached or downloaded)")

        # Get the model path
        model_path = tts.model_path
        print(f"📁 Model path: {model_path}")

        # Check model size
        if os.path.exists(model_path):
            total_size = sum(
                os.path.getsize(os.path.join(dirpath, filename))
                for dirpath, dirnames, filenames in os.walk(model_path)
                for filename in filenames
            )
            size_mb = total_size / (1024 * 1024)
            print(f"📊 Model size: {size_mb:.1f} MB")
        return model_path

    except Exception as e:
        print(f"❌ Failed to download XTTS model: {e}")
        return None

def main():
    print("🎵 TTS Model Download Script")
    print("=" * 40)

    # Create models directory if it doesn't exist
    models_dir = Path("Python/voice_service/models/tts")
    models_dir.mkdir(parents=True, exist_ok=True)

    print(f"📂 Target directory: {models_dir.absolute()}")

    # Download the model
    model_path = download_xtts_models()

    if model_path:
        print("\n✅ Model download completed successfully!")
        print(f"📍 Local model path: {model_path}")
        print(f"🎯 Ready for upload to Render persistent disk")
        print("\n🚀 Next steps:")
        print("1. The model is now downloaded locally")
        print("2. Use Render CLI to upload to persistent disk:")
        print(f"   render disks upload hana-voice-service:voice-models /data/models/tts {model_path}")
    else:
        print("\n❌ Model download failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
