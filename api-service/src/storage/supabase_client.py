import os
from supabase import create_client, Client
from typing import Optional, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseClient:
    """Supabase client for database operations"""
    
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("Supabase URL and key must be set in environment variables")
        
        self.client: Client = create_client(self.url, self.key)
        logger.info("Supabase client initialized successfully")
    
    def get_profiles(self) -> Optional[Dict]:
        """Get all profiles (admin only)"""
        try:
            response = self.client.table('profiles').select('*').execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching profiles: {e}")
            return None
    
    def get_profile_by_email(self, email: str) -> Optional[Dict]:
        """Get profile by email"""
        try:
            response = self.client.table('profiles').select('*').eq('email', email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching profile by email: {e}")
            return None
    
    def create_profile(self, profile_data: Dict) -> Optional[Dict]:
        """Create a new profile"""
        try:
            response = self.client.table('profiles').insert(profile_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating profile: {e}")
            return None
    
    def update_profile_credits(self, profile_id: str, free_credits: int = None, paid_credits: int = None) -> bool:
        """Update profile credits"""
        try:
            update_data = {}
            if free_credits is not None:
                update_data['call_credits_free'] = free_credits
            if paid_credits is not None:
                update_data['call_credits_paid'] = paid_credits
            
            response = self.client.table('profiles').update(update_data).eq('id', profile_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error updating profile credits: {e}")
            return False
    
    def create_institution(self, institution_data: Dict) -> Optional[Dict]:
        """Create a new institution"""
        try:
            response = self.client.table('institutions').insert(institution_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating institution: {e}")
            return None
    
    def get_institutions_by_user(self, user_id: str) -> Optional[Dict]:
        """Get institutions by user ID"""
        try:
            response = self.client.table('institutions').select('*').eq('saas_user_id', user_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching institutions: {e}")
            return None
    
    def create_customer(self, customer_data: Dict) -> Optional[Dict]:
        """Create a new customer"""
        try:
            response = self.client.table('customers').insert(customer_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating customer: {e}")
            return None
    
    def get_customers_by_client(self, client_id: str) -> Optional[Dict]:
        """Get customers by client ID"""
        try:
            response = self.client.table('customers').select('*').eq('client_id', client_id).execute()
            return response.data
        except Exception as e:
            logger.error(f"Error fetching customers: {e}")
            return None
    
    def create_call_log(self, call_data: Dict) -> Optional[Dict]:
        """Create a call log entry"""
        try:
            response = self.client.table('call_logs').insert(call_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating call log: {e}")
            return None
    
    def update_call_log(self, call_id: int, update_data: Dict) -> bool:
        """Update call log"""
        try:
            response = self.client.table('call_logs').update(update_data).eq('id', call_id).execute()
            return bool(response.data)
        except Exception as e:
            logger.error(f"Error updating call log: {e}")
            return False
    
    def create_survey_response(self, response_data: Dict) -> Optional[Dict]:
        """Create a survey response"""
        try:
            response = self.client.table('survey_responses').insert(response_data).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error creating survey response: {e}")
            return None
    
    def get_dashboard_stats(self, user_id: str) -> Optional[Dict]:
        """Get dashboard statistics for a user"""
        try:
            # Use the dashboard_stats view
            response = self.client.table('dashboard_stats').select('*').eq('profile_id', user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error fetching dashboard stats: {e}")
            return None
    
    def health_check(self) -> bool:
        """Check if Supabase connection is healthy"""
        try:
            # Simple query to check connection
            response = self.client.table('profiles').select('count', count='exact').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False

# Global Supabase client instance
supabase_client = SupabaseClient()
