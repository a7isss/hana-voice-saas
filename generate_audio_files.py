#!/usr/bin/env python3
"""
Generate Audio Files from Text Questionnaires
Utility script to create pre-recorded question audio files from JSON questionnaires
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.insert(0, str(Path(__file__).parent))

from src.core.audio_questionnaire import AudioQuestionnaireManager


async def generate_audio_for_questionnaire(questionnaire_id: str):
    """Generate audio files for a specific questionnaire"""
    manager = AudioQuestionnaireManager()

    print(f"Generating audio files for questionnaire: {questionnaire_id}")

    try:
        # Get the questionnaire
        questionnaire = manager.get_questionnaire(questionnaire_id)
        if not questionnaire:
            print(f"❌ Questionnaire {questionnaire_id} not found")
            return False

        print(f"📋 Found questionnaire: {questionnaire.name}")
        print(f"📝 Contains {len(questionnaire.questions)} questions")

        # Generate audio files
        generated_files = await manager.create_audio_files_from_text_questionnaire(questionnaire_id)

        print(f"✅ Generated {len(generated_files)} audio files")

        # Validate that all files were created
        validation = manager.validate_audio_files(questionnaire_id)
        all_valid = all(validation.values())

        if all_valid:
            print(f"✅ All audio files created successfully for {questionnaire_id}")
        else:
            missing = [q_id for q_id, exists in validation.items() if not exists]
            print(f"⚠️  Missing audio files for questions: {missing}")

        return all_valid

    except Exception as e:
        print(f"❌ Error generating audio for {questionnaire_id}: {e}")
        return False


async def generate_audio_for_all_questionnaires():
    """Generate audio files for all available questionnaires"""
    manager = AudioQuestionnaireManager()

    print("🔍 Discovering available questionnaires...")
    questionnaire_ids = list(manager.questionnaires.keys())

    if not questionnaire_ids:
        print("❌ No questionnaires found in config/surveys/ directory")
        return False

    print(f"📋 Found {len(questionnaire_ids)} questionnaires:")
    for q_id in questionnaire_ids:
        print(f"  • {q_id}")

    success_count = 0
    total_count = len(questionnaire_ids)

    for questionnaire_id in questionnaire_ids:
        print(f"\n{'='*50}")
        success = await generate_audio_for_questionnaire(questionnaire_id)
        if success:
            success_count += 1

    print(f"\n{'='*50}")
    print("🎯 Generation Summary:")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {total_count - success_count}")
    print(f"  📊 Success Rate: {success_count}/{total_count}")

    return success_count == total_count


async def main():
    """Main function to handle command line arguments"""
    print("🎵 Voice Robot V3 - Audio File Generator")
    print("=" * 50)

    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ OPENAI_API_KEY environment variable not set")
        print("   Please set your OpenAI API key:")
        print("   export OPENAI_API_KEY='your-api-key-here'")
        return False

    args = sys.argv[1:]

    if len(args) == 0:
        # No arguments - generate all questionnaires
        print("🎵 Generating audio files for all questionnaires...")
        success = await generate_audio_for_all_questionnaires()

    elif len(args) == 1:
        # Single questionnaire specified
        questionnaire_id = args[0]
        print(f"🎵 Generating audio files for questionnaire: {questionnaire_id}")
        success = await generate_audio_for_questionnaire(questionnaire_id)

    else:
        print("❌ Usage:")
        print("  python generate_audio_files.py              # Generate all questionnaires")
        print("  python generate_audio_files.py <questionnaire_id>  # Generate specific questionnaire")
        return False

    print("\n🎵 Audio file generation completed!")
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
