#!/usr/bin/env python3
"""
Simple model test - just test vosk and TTS imports and basic functionality
"""

import os
import sys

def test_vosk_import():
    """Test if vosk can be imported"""
    print("Testing Vosk import...")
    try:
        from vosk import Model, KaldiRecognizer
        print("PASS: Vosk imported successfully!")
        return True
    except ImportError as e:
        print(f"FAIL: Vosk import failed: {e}")
        return False

def test_tts_import():
    """Test if TTS can be imported"""
    print("\nTesting Coqui TTS import...")
    try:
        from TTS.api import TTS
        print("PASS: Coqui TTS imported successfully!")
        return True
    except ImportError as e:
        print(f"FAIL: TTS import failed: {e}")
        return False

def test_vosk_model_load():
    """Test if Arabic Vosk model can be loaded"""
    print("\nTesting Arabic Vosk model loading...")

    # Check if model exists
    VOSK_MODEL_PATH = "models"  # Current directory in voice_service

    if not os.path.exists(VOSK_MODEL_PATH):
        print(f"Model directory not found: {VOSK_MODEL_PATH}")
        return False

    try:
        from vosk import Model
        model = Model(VOSK_MODEL_PATH)
        print("PASS: Arabic Vosk model loaded successfully!")
        print(f"   Model path: {VOSK_MODEL_PATH}")

        # Test basic functionality - create a simple recognizer
        from vosk import KaldiRecognizer
        recognizer = KaldiRecognizer(model, 16000)
        print("   Recognizer created: SUCCESS")

        return True
    except Exception as e:
        print(f"FAIL: Model loading failed: {e}")
        return False

def test_tts_basic():
    """Test basic TTS functionality (without downloading model)"""
    print("\nTesting Coqui TTS basic functionality...")

    try:
        from TTS.api import TTS

        # List available models (Arabic)
        models = TTS.list_models()
        arabic_models = [m for m in models if 'ar' in m.lower() or 'arabic' in m.lower()]

        print(f"PASS: Found {len(models)} total models")
        print(f"   Arabic models: {len(arabic_models)}")

        if arabic_models:
            print("   Sample Arabic models:")
            for model in arabic_models[:3]:  # Show first 3
                print(f"      - {model}")

        return True
    except Exception as e:
        print(f"FAIL: TTS basic test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Hana Voice Service - Phase 1 Model Verification")
    print(f"Python version: {sys.version}")
    print(f"Working directory: {os.getcwd()}")
    print()

    results = []

    # Test imports
    results.append(("Vosk Import", test_vosk_import()))
    results.append(("TTS Import", test_tts_import()))

    # Test functionality
    results.append(("Vosk Model Loading", test_vosk_model_load()))
    results.append(("TTS Basic Test", test_tts_basic()))

    # Summary
    print("\nTest Results Summary:")
    print("=" * 40)

    passed = 0
    total = len(results)

    for test_name, success in results:
        status = "PASS" if success else "FAIL"
        print(f"{test_name}: {status}")
        if success:
            passed += 1

    print(f"\nOverall: {passed}/{total} tests passed")

    if passed == total:
        print("SUCCESS: All basic model tests PASSED! Ready for integration.")
    elif passed >= 2:
        print("PARTIAL: Basic imports working. Some functionality needs attention.")
    else:
        print("FAILED: Critical issues found. Check dependencies.")

    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
