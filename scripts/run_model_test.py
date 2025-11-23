#!/usr/bin/env python3
"""
Run model test from root directory
"""

import os
import subprocess
import sys

def main():
    # Change to voice service directory
    voice_service_dir = os.path.join(os.getcwd(), 'Python', 'voice_service')

    if not os.path.exists(voice_service_dir):
        print(f"❌ Voice service directory not found: {voice_service_dir}")
        return False

    # Path to conda python
    conda_python = r"C:\Users\ADMI\anaconda3\python.exe"

    if not os.path.exists(conda_python):
        print(f"❌ Conda Python not found: {conda_python}")
        return False

    # Test file path
    test_file = os.path.join(voice_service_dir, 'tests', 'test_models_simple.py')

    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return False

    # Run the test
    print(f"🚀 Running model test...")
    print(f"   Directory: {voice_service_dir}")
    print(f"   Python: {conda_python}")
    print(f"   Test file: {test_file}")
    print()

    try:
        result = subprocess.run([conda_python, test_file],
                              cwd=voice_service_dir,
                              capture_output=True,
                              text=True,
                              timeout=300)

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        print("❌ Test timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"❌ Failed to run test: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
