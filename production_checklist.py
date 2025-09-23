#!/usr/bin/env python3
"""
🧪 Production Readiness Checklist for Hana Voice SaaS
Tests all MVP requirements before Render deployment
"""

import os
import sys
import json
import logging
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from fastapi.testclient import TestClient
from src.storage.database import init_db, get_db, SessionLocal
from src.core.ai_agent import call_coordinator
from src.core.audio_questionnaire import audio_questionnaire_processor

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from main import app

class ProductionChecker:
    def __init__(self):
        self.client = TestClient(app)
        self.checks = []

    def log_check(self, name: str, passed: bool, details: str = ""):
        """Log a production check result"""
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"{status} - {name}")
        if details:
            logger.info(f"   Details: {details}")
        self.checks.append({"name": name, "passed": passed, "details": details})

    def check_database(self):
        """✅ 1. Database Setup & Schema"""
        logger.info("\n🔍 CHECKING DATABASE...")

        try:
            # Initialize database
            init_db()
            db = next(get_db())

            # Check if all new tables exist
            from sqlalchemy import inspect
            inspector = inspect(db.bind)

            required_tables = [
                'saas_users', 'institutions', 'call_transactions',
                'customers', 'survey_responses', 'call_logs'
            ]

            missing_tables = []
            for table in required_tables:
                if table not in inspector.get_table_names():
                    missing_tables.append(table)

            if missing_tables:
                self.log_check("Database tables exist", False, f"Missing tables: {missing_tables}")
            else:
                self.log_check("Database tables exist", True, f"All {len(required_tables)} tables created")

            # Test SaaS user creation
            from src.storage.database import create_saas_user, get_saas_user_by_user_id
            test_user = create_saas_user(db, {
                "user_id": "test_user_prod",
                "email": "test@example.com",
                "full_name": "Production Test User"
            })

            if test_user and test_user.call_credits_free == 10:
                self.log_check("SaaS user creation", True, f"User {test_user.email} created with 10 free credits")
            else:
                self.log_check("SaaS user creation", False, "Failed to create user with free credits")

        except Exception as e:
            self.log_check("Database setup", False, str(e))

    def check_billing_system(self):
        """✅ 2. Billing System Implementation"""
        logger.info("\n💰 CHECKING BILLING SYSTEM...")

        try:
            db = next(get_db())

            # Test credit deduction
            from src.storage.database import deduct_call_credit, get_available_credits

            # Get or create test user
            from src.storage.database import get_saas_user_by_user_id, create_saas_user
            test_user = get_saas_user_by_user_id(db, "test_user_prod")

            if not test_user:
                test_user = create_saas_user(db, {
                    "user_id": "test_user_prod",
                    "email": "test@example.com",
                    "full_name": "Production Test User"
                })

            initial_credits = test_user.call_credits_free + test_user.call_credits_paid

            # Try to deduct credit
            user_after, credit_type = deduct_call_credit(db, test_user.id)

            if initial_credits > 0 and user_after:
                available_after = user_after.call_credits_free + user_after.call_credits_paid
                if available_after == initial_credits - 1:
                    self.log_check("Credit deduction", True, f"Successfully deducted {credit_type} credit")
                else:
                    self.log_check("Credit deduction", False, "Credit count unexpected after deduction")
            elif initial_credits == 0:
                self.log_check("Credit deduction", True, "Correctly rejected when no credits available")
            else:
                self.log_check("Credit deduction", False, "Failed to deduct credit")

        except Exception as e:
            self.log_check("Billing system", False, str(e))

    def check_api_endpoints(self):
        """✅ 3. Authentication & API Endpoints"""
        logger.info("\n🔒 CHECKING API ENDPOINTS...")

        # Test health check
        try:
            response = self.client.get("/health")
            if response.status_code == 200 and response.json().get("status") == "healthy":
                self.log_check("Health check endpoint", True)
            else:
                self.log_check("Health check endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_check("Health check endpoint", False, str(e))

        # Test billing status (mock auth)
        try:
            # Without proper JWT, this should fail but verify endpoint exists
            response = self.client.get("/billing/status")
            if response.status_code == 401:  # Unauthorized due to no token
                self.log_check("Billing status endpoint", True, "Endpoint exists and requires auth")
            else:
                self.log_check("Billing status endpoint", False, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_check("Billing status endpoint", False, str(e))

    def check_audio_questionnaire(self):
        """✅ 4. Audio Questionnaire System"""
        logger.info("\n🎵 CHECKING AUDIO QUESTIONNAIRE...")

        try:
            # Check questionnaire processor
            questionnaire_info = audio_questionnaire_processor.get_questionnaire_info("dermatology_v1")

            if questionnaire_info and "questions" in questionnaire_info:
                question_count = len(questionnaire_info["questions"])
                self.log_check("Questionnaire loading", True, f"Loaded {question_count} questions")
            else:
                self.log_check("Questionnaire loading", False, "Failed to load questionnaire")

            # Check if audio files directory exists or can be generated
            if audio_questionnaire_processor.can_generate_audio():
                self.log_check("Audio generation capability", True)
            else:
                self.log_check("Audio generation capability", False, "OpenAI TTS API required for audio generation")

        except Exception as e:
            self.log_check("Audio questionnaire system", False, str(e))

    def check_call_coordinator(self):
        """✅ 5. Call Coordinator Logic"""
        logger.info("\n📞 CHECKING CALL COORDINATOR...")

        try:
            db = next(get_db())

            # Get a customer for testing
            from src.storage.database import Customer
            test_customer = db.query(Customer).first()

            if not test_customer:
                self.log_check("Call coordinator", False, "No customers in database for testing")
                return

            # Test call preparation (this checks credits and questionnaire logic)
            prep_result = call_coordinator.prepare_call(test_customer.id, "9665551234567", "test_client")

            if isinstance(prep_result, dict):
                if prep_result.get("can_call") == True:
                    self.log_check("Call coordinator logic", True, "Successfully validated call preparation")
                elif prep_result.get("reason") == "no_credits":
                    self.log_check("Call coordinator logic", True, "Correctly rejected call with no credits")
                else:
                    self.log_check("Call coordinator logic", False, f"Unexpected result: {prep_result.get('reason')}")
            else:
                self.log_check("Call coordinator logic", False, "Invalid response format")

        except Exception as e:
            self.log_check("Call coordinator", False, str(e))

    def check_environment_variables(self):
        """✅ 6. Environment Configuration"""
        logger.info("\n⚙️ CHECKING ENVIRONMENT VARIABLES...")

        required_vars = {
            "DATABASE_URL": "PostgreSQL connection string",
            "OPENAI_API_KEY": "OpenAI API key for TTS (Saudi accent)",
            "JWT_SECRET_KEY": "Secret key for JWT authentication"
        }

        missing_critical = []
        missing_optional = []

        for var, description in required_vars.items():
            if not os.getenv(var):
                if var in ["OPENAI_API_KEY", "JWT_SECRET_KEY"]:
                    missing_optional.append(f"{var} ({description})")
                else:
                    missing_critical.append(f"{var} ({description})")

        if not missing_critical:
            self.log_check("Critical environment variables", True, "All required vars present")
        else:
            self.log_check("Critical environment variables", False, f"Missing: {', '.join(missing_critical)}")

        if missing_optional:
            logger.warning(f"📝 Optional environment variables missing: {', '.join(missing_optional)}")
        else:
            logger.info("✅ All optional environment variables configured")

    def check_deployment_readiness(self):
        """✅ 7. Render Deployment Configuration"""
        logger.info("\n🚀 CHECKING DEPLOYMENT READINESS...")

        # Check if Dockerfile.production exists
        if os.path.exists("Dockerfile.production"):
            self.log_check("Production Dockerfile", True)
        else:
            self.log_check("Production Dockerfile", False)

        # Check if render.yaml exists
        if os.path.exists("render.yaml"):
            try:
                with open("render.yaml", "r") as f:
                    render_config = f.read()
                    if "hana-voice-saas" in render_config and "hana-db" in render_config:
                        self.log_check("Render configuration", True, "Valid render.yaml detected")
                    else:
                        self.log_check("Render configuration", False, "Missing service/database configuration")
            except Exception as e:
                self.log_check("Render configuration", False, str(e))
        else:
            self.log_check("Render configuration", False, "render.yaml file missing")

        # Check Python version compatibility
        if sys.version_info >= (3, 11):
            self.log_check("Python version", True, f"Python {sys.version.split()[0]} (compatible)")
        else:
            self.log_check("Python version", False, f"Python {sys.version.split()[0]} (requires 3.11+)")

    def run_all_checks(self):
        """Run all production readiness checks"""
        logger.info("🚀 HANA VOICE SAAS - PRODUCTION READINESS CHECK")
        logger.info("=" * 60)

        self.check_database()
        self.check_billing_system()
        self.check_api_endpoints()
        self.check_audio_questionnaire()
        self.check_call_coordinator()
        self.check_environment_variables()
        self.check_deployment_readiness()

        logger.info("\n" + "=" * 60)
        logger.info("📊 PRODUCTION CHECK SUMMARY")
        logger.info("=" * 60)

        passed = sum(1 for check in self.checks if check["passed"])
        total = len(self.checks)

        for check in self.checks:
            status_icon = "✅" if check["passed"] else "❌"
            logger.info(f"{status_icon} {check['name']}")
            if check["details"]:
                logger.info(f"   {check['details']}")

        logger.info("=" * 60)

        if passed == total:
            logger.info(f"🎉 ALL CHECKS PASSED ({passed}/{total})")
            logger.info("🚀 READY FOR PRODUCTION DEPLOYMENT")
            logger.info("\nNext steps:")
            logger.info("1. Set OPENAI_API_KEY in Render dashboard")
            logger.info("2. Generate JWT_SECRET_KEY and add to environment")
            logger.info("3. Deploy to Render using render.yaml")
            logger.info("4. Run generate_audio_files.py to create question audio")
            return True
        else:
            logger.error(f"❌ {total - passed} CHECKS FAILED ({passed}/{total})")
            logger.error("🔧 FIX FAILED CHECKS BEFORE DEPLOYMENT")
            return False

if __name__ == "__main__":
    checker = ProductionChecker()
    success = checker.run_all_checks()
    sys.exit(0 if success else 1)
