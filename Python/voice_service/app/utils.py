# app/utils.py - Helper functions for Arabic voice processing
# Audio format conversions and utility functions

import os
import struct
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

def convert_mulaw_to_pcm(mulaw_data: bytes, sample_rate: int = 8000) -> bytes:
    """Convert μ-law encoded audio to linear PCM for voice processing

    Maqsam sends audio in μ-law format (8kHz), but voice models expect linear PCM (16kHz).
    This function handles the conversion for real-time processing.

    Args:
        mulaw_data: Raw μ-law audio bytes from Maqsam
        sample_rate: Target sample rate (default 8000 for μ-law)

    Returns:
        Linear PCM audio bytes (16-bit mono)
    """
    try:
        pcm_samples = []

        # μ-law to linear conversion table
        mulaw_to_linear = []
        for i in range(256):
            # μ-law decoding algorithm
            val = i ^ 0xFF  # Invert bits
            t = ((val & 0x0F) << 3) + 8  # Get mantissa
            t <<= ((val & 0x70) >> 4)    # Get exponent
            if val & 0x80:               # Sign bit
                t = -t
            mulaw_to_linear.append(t)

        # Convert each byte to 16-bit PCM sample
        for byte in mulaw_data:
            linear_sample = mulaw_to_linear[byte]
            # Convert to 16-bit signed integer
            pcm_sample = struct.pack('<h', linear_sample)
            pcm_samples.append(pcm_sample)

        return b''.join(pcm_samples)

    except Exception as e:
        logger.error(".2f")
        return mulaw_data  # Return original if conversion fails

def convert_pcm_to_mulaw(pcm_data: bytes) -> bytes:
    """Convert linear PCM back to μ-law for Maqsam compatibility

    Args:
        pcm_data: Linear PCM audio bytes (16-bit)

    Returns:
        μ-law encoded bytes for Maqsam
    """
    try:
        mulaw_samples = []

        # Linear to μ-law conversion
        linear_to_mulaw = []
        for i in range(65536):
            # Placeholder for μ-law encoding algorithm
            # This would need the full μ-law encoding table
            pass

        # Convert 16-bit PCM samples to μ-law
        for i in range(0, len(pcm_data), 2):
            if i + 1 < len(pcm_data):
                # Unpack 16-bit signed integer
                pcm_sample = struct.unpack('<h', pcm_data[i:i+2])[0]

                # Convert to μ-law (simplified version)
                # In real implementation, use proper μ-law encoding
                if pcm_sample >= 0:
                    sign = 0
                    magnitude = pcm_sample
                else:
                    sign = 0x80
                    magnitude = -pcm_sample

                # Clamp to 14-bit range
                magnitude = min(magnitude, 0x1FFF)

                # μ-law encoding algorithm (simplified)
                if magnitude < 32:
                    exp = 0
                    mant = magnitude >> 1
                else:
                    exp = 0
                    while magnitude > 31:
                        magnitude >>= 1
                        exp += 1
                    exp = min(exp, 7)
                    mant = (magnitude - 16) >> 1

                mulaw_byte = sign | (exp << 4) | mant
                mulaw_samples.append(mulaw_byte ^ 0xFF)  # μ-law bias

        return bytes(mulaw_samples)

    except Exception as e:
        logger.error(f"PCM to μ-law conversion error: {e}")
        return pcm_data  # Return original if conversion fails

def validate_audio_format(audio_data: bytes, expected_format: str = "mulaw") -> bool:
    """Validate audio format for processing

    Args:
        audio_data: Raw audio bytes
        expected_format: Expected format ("mulaw" or "pcm")

    Returns:
        True if format is valid
    """
    try:
        if len(audio_data) == 0:
            logger.warning("Empty audio data")
            return False

        if expected_format == "mulaw":
            # μ-law should have values 0-255
            if all(0 <= byte <= 255 for byte in audio_data[:100]):  # Check first 100 samples
                logger.debug(f"✅ μ-law format validated: {len(audio_data)} samples")
                return True
            else:
                logger.warning("Audio data doesn't match μ-law format")
                return False

        elif expected_format == "pcm":
            # PCM should be even length (16-bit samples)
            if len(audio_data) % 2 == 0:
                logger.debug(f"✅ PCM format validated: {len(audio_data)//2} samples")
                return True
            else:
                logger.warning("PCM audio data length is not even (16-bit samples)")
                return False

        else:
            logger.warning(f"Unknown format validation requested: {expected_format}")
            return False

    except Exception as e:
        logger.error(f"Audio format validation error: {e}")
        return False

def get_audio_info(audio_data: bytes) -> dict:
    """Get basic information about audio data

    Args:
        audio_data: Raw audio bytes

    Returns:
        Dictionary with audio information
    """
    return {
        "size_bytes": len(audio_data),
        "duration_seconds": len(audio_data) / 8000,  # Assuming 8kHz μ-law
        "format": "mulaw_8kHz" if len(audio_data) > 0 else "unknown"
    }

def ensure_directories():
    """Ensure required directories exist"""
    directories = [
        "models",
        "logs",
        "temp_audio"
    ]

    for dir_name in directories:
        if not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
            logger.info(f"Created directory: {dir_name}")

def cleanup_temp_files(directory: str = "temp_audio", max_age_hours: int = 1):
    """Clean up temporary audio files older than specified hours

    Args:
        directory: Directory to clean
        max_age_hours: Maximum age of files to keep
    """
    import time
    from pathlib import Path

    try:
        if not os.path.exists(directory):
            return

        current_time = time.time()
        max_age_seconds = max_age_hours * 3600

        temp_dir = Path(directory)
        cleaned_files = 0

        for file_path in temp_dir.glob("*.wav"):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    file_path.unlink()
                    cleaned_files += 1

        if cleaned_files > 0:
            logger.info(f"Cleaned up {cleaned_files} temporary audio files")

    except Exception as e:
        logger.error(f"Error cleaning temporary files: {e}")

# Initialize required directories on module import
ensure_directories()
