import os
import pandas as pd
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import io
from ..storage.supabase_client import supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataExporter:
    """Data export service for Excel reports with Arabic RTL support"""
    
    def __init__(self):
        self.supabase = supabase_client
        self.default_language = "ar"
        
    def export_survey_responses(self, client_id: str, start_date: str = None, 
                               end_date: str = None, language: str = None) -> Optional[bytes]:
        """Export survey responses to Excel with Arabic formatting"""
        try:
            language = language or self.default_language
            
            # Get survey responses from database
            responses = self._get_survey_responses(client_id, start_date, end_date)
            if not responses:
                return None
            
            # Create DataFrame
            df = self._create_survey_dataframe(responses, language)
            
            # Generate Excel file
            excel_bytes = self._generate_excel_report(df, language)
            
            logger.info(f"Exported {len(responses)} survey responses for client {client_id}")
            return excel_bytes
            
        except Exception as e:
            logger.error(f"Survey export error: {e}")
            return None
    
    def export_call_analytics(self, client_id: str, start_date: str = None, 
                             end_date: str = None, language: str = None) -> Optional[bytes]:
        """Export call analytics to Excel"""
        try:
            language = language or self.default_language
            
            # Get call logs from database
            call_logs = self._get_call_logs(client_id, start_date, end_date)
            if not call_logs:
                return None
            
            # Create analytics DataFrame
            df = self._create_analytics_dataframe(call_logs, language)
            
            # Generate Excel file
            excel_bytes = self._generate_excel_report(df, language)
            
            logger.info(f"Exported {len(call_logs)} call logs for client {client_id}")
            return excel_bytes
            
        except Exception as e:
            logger.error(f"Analytics export error: {e}")
            return None
    
    def export_customer_list(self, client_id: str, language: str = None) -> Optional[bytes]:
        """Export customer list to Excel"""
        try:
            language = language or self.default_language
            
            # Get customers from database
            customers = self._get_customers(client_id)
            if not customers:
                return None
            
            # Create customer DataFrame
            df = self._create_customer_dataframe(customers, language)
            
            # Generate Excel file
            excel_bytes = self._generate_excel_report(df, language)
            
            logger.info(f"Exported {len(customers)} customers for client {client_id}")
            return excel_bytes
            
        except Exception as e:
            logger.error(f"Customer export error: {e}")
            return None
    
    def _get_survey_responses(self, client_id: str, start_date: str, end_date: str) -> List[Dict]:
        """Get survey responses from database"""
        try:
            query = self.supabase.client.table('survey_responses').select('*').eq('client_id', client_id)
            
            if start_date:
                query = query.gte('timestamp', start_date)
            if end_date:
                query = query.lte('timestamp', end_date)
            
            response = query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching survey responses: {e}")
            return []
    
    def _get_call_logs(self, client_id: str, start_date: str, end_date: str) -> List[Dict]:
        """Get call logs from database"""
        try:
            query = self.supabase.client.table('call_logs').select('*').eq('client_id', client_id)
            
            if start_date:
                query = query.gte('timestamp', start_date)
            if end_date:
                query = query.lte('timestamp', end_date)
            
            response = query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching call logs: {e}")
            return []
    
    def _get_customers(self, client_id: str) -> List[Dict]:
        """Get customers from database"""
        try:
            response = self.supabase.client.table('customers').select('*').eq('client_id', client_id).execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching customers: {e}")
            return []
    
    def _create_survey_dataframe(self, responses: List[Dict], language: str) -> pd.DataFrame:
        """Create survey responses DataFrame with Arabic column names"""
        # Arabic column names
        columns_ar = {
            'conversation_id': 'رقم المحادثة',
            'patient_id': 'رقم المريض',
            'department': 'القسم',
            'question_id': 'رقم السؤال',
            'question_text': 'نص السؤال',
            'response': 'الإجابة',
            'confidence': 'مستوى الثقة',
            'answered': 'تم الإجابة',
            'speech_text': 'النص المقروء',
            'timestamp': 'التاريخ والوقت',
            'survey_version': 'إصدار الاستبيان'
        }
        
        # Create DataFrame
        df = pd.DataFrame(responses)
        
        # Rename columns based on language
        if language == 'ar':
            df = df.rename(columns=columns_ar)
        
        # Format timestamp
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return df
    
    def _create_analytics_dataframe(self, call_logs: List[Dict], language: str) -> pd.DataFrame:
        """Create call analytics DataFrame"""
        # Arabic column names
        columns_ar = {
            'conversation_id': 'رقم المحادثة',
            'patient_id': 'رقم المريض',
            'department': 'القسم',
            'phone_number': 'رقم الهاتف',
            'attempt_number': 'عدد المحاولات',
            'status': 'الحالة',
            'call_duration': 'مدة المكالمة (ثانية)',
            'call_cost': 'تكلفة المكالمة',
            'provider': 'مزود الخدمة',
            'error_message': 'رسالة الخطأ',
            'timestamp': 'التاريخ والوقت'
        }
        
        # Create DataFrame
        df = pd.DataFrame(call_logs)
        
        # Rename columns based on language
        if language == 'ar':
            df = df.rename(columns=columns_ar)
        
        # Format timestamp and duration
        df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        if 'call_duration' in df.columns:
            df['call_duration'] = df['call_duration'].fillna(0).astype(int)
        
        return df
    
    def _create_customer_dataframe(self, customers: List[Dict], language: str) -> pd.DataFrame:
        """Create customer list DataFrame"""
        # Arabic column names
        columns_ar = {
            'name': 'اسم المريض',
            'phone_number': 'رقم الهاتف',
            'department': 'القسم',
            'status': 'الحالة',
            'priority': 'الأولوية',
            'notes': 'ملاحظات',
            'last_call_attempt': 'آخر محاولة اتصال',
            'created_at': 'تاريخ الإضافة'
        }
        
        # Create DataFrame
        df = pd.DataFrame(customers)
        
        # Rename columns based on language
        if language == 'ar':
            df = df.rename(columns=columns_ar)
        
        # Format timestamps
        df['last_call_attempt'] = pd.to_datetime(df['last_call_attempt']).dt.strftime('%Y-%m-%d %H:%M:%S')
        df['created_at'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return df
    
    def _generate_excel_report(self, df: pd.DataFrame, language: str) -> bytes:
        """Generate Excel file with proper Arabic RTL formatting"""
        try:
            # Create Excel writer
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                # Write DataFrame to Excel
                df.to_excel(writer, sheet_name='التقرير' if language == 'ar' else 'Report', index=False)
                
                # Get workbook and worksheet
                workbook = writer.book
                worksheet = writer.sheets['التقرير' if language == 'ar' else 'Report']
                
                # Apply Arabic RTL formatting if needed
                if language == 'ar':
                    self._apply_arabic_formatting(workbook, worksheet, df)
                else:
                    self._apply_english_formatting(workbook, worksheet, df)
                
                # Auto-adjust column widths
                for idx, col in enumerate(df.columns):
                    max_len = max(df[col].astype(str).apply(len).max(), len(col)) + 2
                    worksheet.set_column(idx, idx, max_len)
            
            # Return bytes
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Excel generation error: {e}")
            raise
    
    def _apply_arabic_formatting(self, workbook, worksheet, df):
        """Apply Arabic RTL formatting to Excel worksheet"""
        # Arabic font format
        arabic_format = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 11,
            'reading_order': 2,  # RTL
            'align': 'right'
        })
        
        # Header format
        header_format = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 12,
            'bold': True,
            'reading_order': 2,  # RTL
            'align': 'right',
            'bg_color': '#D3D3D3'
        })
        
        # Apply formats
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        # Apply Arabic format to all data cells
        for row_num in range(1, len(df) + 1):
            for col_num in range(len(df.columns)):
                worksheet.write(row_num, col_num, df.iloc[row_num-1, col_num], arabic_format)
        
        # Set RTL direction for the sheet
        worksheet.right_to_left()
    
    def _apply_english_formatting(self, workbook, worksheet, df):
        """Apply English LTR formatting to Excel worksheet"""
        # English font format
        english_format = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 11,
            'align': 'left'
        })
        
        # Header format
        header_format = workbook.add_format({
            'font_name': 'Arial',
            'font_size': 12,
            'bold': True,
            'align': 'left',
            'bg_color': '#D3D3D3'
        })
        
        # Apply formats
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
        
        for row_num in range(1, len(df) + 1):
            for col_num in range(len(df.columns)):
                worksheet.write(row_num, col_num, df.iloc[row_num-1, col_num], english_format)
    
    def generate_summary_report(self, client_id: str, language: str = None) -> Dict:
        """Generate summary statistics for a client"""
        try:
            language = language or self.default_language
            
            # Get data for summary
            customers = self._get_customers(client_id)
            call_logs = self._get_call_logs(client_id, None, None)
            survey_responses = self._get_survey_responses(client_id, None, None)
            
            # Calculate statistics
            total_customers = len(customers)
            total_calls = len(call_logs)
            completed_calls = len([log for log in call_logs if log.get('status') == 'completed'])
            failed_calls = len([log for log in call_logs if log.get('status') == 'failed'])
            total_responses = len(survey_responses)
            
            # Calculate success rate
            success_rate = (completed_calls / total_calls * 100) if total_calls > 0 else 0
            
            # Department breakdown
            departments = {}
            for customer in customers:
                dept = customer.get('department', 'unknown')
                departments[dept] = departments.get(dept, 0) + 1
            
            # Response analysis
            yes_responses = len([r for r in survey_responses if r.get('response') == 'yes'])
            no_responses = len([r for r in survey_responses if r.get('response') == 'no'])
            uncertain_responses = len([r for r in survey_responses if r.get('response') == 'uncertain'])
            
            summary = {
                'total_customers': total_customers,
                'total_calls': total_calls,
                'completed_calls': completed_calls,
                'failed_calls': failed_calls,
                'success_rate': round(success_rate, 2),
                'total_responses': total_responses,
                'yes_responses': yes_responses,
                'no_responses': no_responses,
                'uncertain_responses': uncertain_responses,
                'departments': departments,
                'generated_at': datetime.now().isoformat()
            }
            
            return summary
            
        except Exception as e:
            logger.error(f"Summary generation error: {e}")
            return {}
    
    def health_check(self) -> Dict:
        """Check data service health"""
        try:
            # Test database connection
            test_response = self.supabase.health_check()
            
            # Test Excel generation with sample data
            sample_df = pd.DataFrame({'test': ['data']})
            test_excel = self._generate_excel_report(sample_df, 'en')
            
            return {
                "status": "healthy",
                "database_connected": test_response,
                "excel_generation": bool(test_excel),
                "pandas_available": True
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "database_connected": False,
                "excel_generation": False,
                "pandas_available": False,
                "error": str(e)
            }

# Global data exporter instance
data_exporter = DataExporter()
