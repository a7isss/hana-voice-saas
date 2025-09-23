#!/usr/bin/env python3
"""
🛠️ Local Development Setup Script for Hana Voice SaaS
Sets up database, creates test institution, and seeds sample data
"""

import os
import sys
import logging
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_environment():
    """Check if required environment variables are set"""
    logger.info("🔍 Checking environment variables...")

    required_vars = ['OPENAI_API_KEY', 'JWT_SECRET_KEY']
    missing_vars = []

    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        logger.warning(f"⚠️ Missing required environment variables: {', '.join(missing_vars)}")
        logger.info("💡 Copy .env.example to .env and fill in the missing values")
    else:
        logger.info("✅ All required environment variables are set")

def setup_database():
    """Initialize database tables"""
    logger.info("🗄️ Setting up database...")

    try:
        from src.storage.database import init_db
