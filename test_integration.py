#!/usr/bin/env python3
"""
Integration test script for هناء Voice Robot V3
Tests all major components: telephony, AI agent, survey engine, and database
"""

import os
import sys
import json
import logging
import asyncio
from datetime import datetime

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from fastapi.testclient import TestClient
from src.storage.database import init_db, get_db, SessionLocal
from src.config.client_manager import client_manager
from src.core.ai_agent import hana_agent
from src.survey.engine import survey_engine
from src.telephony.manager import telephony_manager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import main app
from main import app

class IntegrationTester:
    def __init__(self):
        self.client = TestClient(app)
        self.test_conversation_id = None
        
    def setup_database(self):
        """Initialize test database"""
        logger.info("Setting up test database...")
        init_db()
        logger.info("Database setup complete")
        
    def test_health_check(self):
        """Test health check endpoint"""
        logger.info("Testing health check...")
        response = self.client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        logger.info("✓ Health check passed")
        
    def test_list_clients(self):
        """Test client listing"""
        logger.info("Testing client listing...")
        response = self.client.get("/clients")
        assert response.status_code == 200
        assert "clients" in response.json()
        logger.info("✓ Client listing passed")
        
    def test_conversation_initialization(self):
        """Test conversation initialization"""
        logger.info("Testing conversation initialization...")
        
        # Test with valid client and department
        conversation_id = hana_agent.initialize_conversation(
            client_id="king_faisal_hospital",
            patient_id="test_patient_001",
            department="general_practitioner",
            visit_date=datetime.now()
        )
        
        assert conversation_id is not None
        self.test_conversation_id = conversation_id
        logger.info(f"✓ Conversation initialized: {conversation_id}")
        
        # Test conversation stats
        stats = hana_agent.get_conversation_stats(conversation_id)
        assert stats is not None
        assert "call_attempts" in stats
        logger.info("✓ Conversation stats retrieved")
        
    def test_survey_engine(self):
        """Test survey engine functionality"""
        logger.info("Testing survey engine...")
        
        # Test loading survey templates
        templates = survey_engine.templates
        assert len(templates) > 0
        logger.info(f"✓ Loaded {len(templates)} survey templates")
        
        # Test getting specific survey
        survey = survey_engine.get_survey("general_practitioner_v1")
        assert survey is not None
        assert "questions" in survey
        logger.info(f"✓ Retrieved survey with {len(survey['questions'])} questions")
        
    def test_telephony_manager(self):
        """Test telephony manager functionality"""
        logger.info("Testing telephony manager...")
        
        # Test provider availability
        providers = list(telephony_manager.adapters.keys())
        assert len(providers) > 0
        logger.info(f"✓ Available providers: {providers}")
        
        # Test default provider
        default_provider = telephony_manager.default_provider
        assert default_provider is not None
        logger.info(f"✓ Default provider: {default_provider}")
        
    def test_ai_agent_response_processing(self):
        """Test AI agent response processing"""
        logger.info("Testing AI agent response processing...")
        
        if not self.test_conversation_id:
            self.test_conversation_initialization()
            
        # Test yes response
        result = hana_agent.process_response(self.test_conversation_id, "نعم")
        assert result["response_type"] in ["yes", "no", "uncertain"]
        assert "confidence" in result
        logger.info(f"✓ Yes response processed: {result['response_type']} (confidence: {result['confidence']})")
        
        # Test no response
        result = hana_agent.process_response(self.test_conversation_id, "لا")
        assert result["response_type"] in ["yes", "no", "uncertain"]
        logger.info(f"✓ No response processed: {result['response_type']} (confidence: {result['confidence']})")
        
        # Test uncertain response
        result = hana_agent.process_response(self.test_conversation_id, "غير متأكد")
        assert result["response_type"] in ["yes", "no", "uncertain"]
        logger.info(f"✓ Uncertain response processed: {result['response_type']} (confidence: {result['confidence']})")
        
    def test_api_endpoints(self):
        """Test API endpoints"""
        logger.info("Testing API endpoints...")
        
        # Test root endpoint
        response = self.client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
        logger.info("✓ Root endpoint working")
        
        # Test conversation endpoint
        if self.test_conversation_id:
            response = self.client.get(f"/conversation/{self.test_conversation_id}")
            assert response.status_code == 200
            assert "stats" in response.json()
            logger.info("✓ Conversation endpoint working")
            
    def test_configuration_validation(self):
        """Test configuration validation"""
        logger.info("Testing configuration validation...")
        
        # Test client configuration
        clients = client_manager.get_all_clients()
        assert len(clients) > 0
        
        for client in clients:
            assert hasattr(client, 'client_id')
            assert hasattr(client, 'name')
            assert hasattr(client, 'departments')
            logger.info(f"✓ Client config valid: {client.name}")
            
    def run_all_tests(self):
        """Run all integration tests"""
        logger.info("🚀 Starting هناء Voice Robot V3 Integration Tests")
        logger.info("=" * 60)
        
        try:
            self.setup_database()
            self.test_health_check()
            self.test_list_clients()
            self.test_conversation_initialization()
            self.test_survey_engine()
            self.test_telephony_manager()
            self.test_ai_agent_response_processing()
            self.test_api_endpoints()
            self.test_configuration_validation()
            
            logger.info("=" * 60)
            logger.info("🎉 All integration tests passed successfully!")
            logger.info("System is ready for deployment with proper configuration.")
            
        except Exception as e:
            logger.error(f"❌ Integration test failed: {e}")
            raise

def test_environment_configuration():
    """Test environment configuration"""
    logger.info("Testing environment configuration...")
    
    required_env_vars = [
        'DATABASE_URL',
        'FREEPBX_HOST',
        'FREEPBX_USERNAME',
        'FREEPBX_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
            
    if missing_vars:
        logger.warning(f"Missing environment variables: {missing_vars}")
        logger.warning("Some tests may fail without proper configuration")
    else:
        logger.info("✓ All required environment variables are set")
        
    # Test database connection
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        logger.info("✓ Database connection successful")
    except Exception as e:
        logger.warning(f"Database connection test failed: {e}")

if __name__ == "__main__":
    # Test environment first
    test_environment_configuration()
    
    # Run integration tests
    tester = IntegrationTester()
    tester.run_all_tests()
