#!/usr/bin/env python3
"""
Railway Deployment Verification Script
Tests the Python voice service deployment on Railway
"""

import os
import sys
import json
import time
import asyncio
import requests
from typing import Dict, Any, Optional

class DeploymentVerifier:
    """Railway deployment verification for Hana Voice Service"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.health_url = f"{self.base_url}/health"
        self.root_url = f"{self.base_url}/"
        self.maqsam_status_url = f"{self.base_url}/maqsam/status"
        
    def check_basic_connectivity(self) -> Dict[str, Any]:
        """Test basic HTTP connectivity"""
        print("🔍 Testing basic connectivity...")
        
        try:
            response = requests.get(self.root_url, timeout=10)
            return {
                "status": "success" if response.status_code == 200 else "partial",
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds(),
                "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
            }
        except requests.exceptions.RequestException as e:
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def check_health_endpoint(self) -> Dict[str, Any]:
        """Test health check endpoint"""
        print("🏥 Testing health endpoint...")
        
        try:
            response = requests.get(self.health_url, timeout=15)
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "status_code": response.status_code,
                    "voice_service": data.get("voice_service", "unknown"),
                    "models": data.get("models", {}),
                    "status_field": data.get("status", "unknown")
                }
            else:
                return {
                    "status": "failed",
                    "status_code": response.status_code,
                    "response": response.text[:200]
                }
        except requests.exceptions.RequestException as e:
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def check_maqsam_status(self) -> Dict[str, Any]:
        """Test Maqsam integration status"""
        print("📞 Testing Maqsam integration status...")
        
        try:
            response = requests.get(self.maqsam_status_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "maqsam_integration": data.get("integration", "unknown"),
                    "protocol": data.get("protocol", "unknown"),
                    "endpoints": data.get("endpoints", {}),
                    "authentication_status": data.get("authentication", {}).get("status", "unknown")
                }
            else:
                return {
                    "status": "partial",
                    "status_code": response.status_code
                }
        except requests.exceptions.RequestException as e:
            return {
                "status": "failed",
                "error": str(e)
            }
    
    def check_environment_variables(self) -> Dict[str, Any]:
        """Check critical environment variables"""
        print("🔧 Checking environment configuration...")
        
        critical_vars = [
            "VOICE_SERVICE_SECRET",
            "LOG_LEVEL",
            "MAX_CONCURRENT_SESSIONS",
            "VOSK_MODEL_PATH",
            "TTS_MODEL_NAME"
        ]
        
        missing_vars = []
        present_vars = {}
        
        for var in critical_vars:
            if os.environ.get(var):
                present_vars[var] = "✅ set"
            else:
                missing_vars.append(var)
                present_vars[var] = "❌ missing"
        
        return {
            "status": "success" if not missing_vars else "partial",
            "present_variables": present_vars,
            "missing_variables": missing_vars,
            "total_checked": len(critical_vars)
        }
    
    def check_voice_models(self) -> Dict[str, Any]:
        """Check voice model availability"""
        print("🎯 Checking voice model paths...")
        
        vosk_path = os.environ.get("VOSK_MODEL_PATH", "models/vosk-model-ar-0.22-linto-1.1.0")
        tts_path = os.environ.get("TTS_MODEL_NAME", "tts_models/multilingual/multi-dataset/xtts_v2")
        
        vosk_exists = os.path.exists(vosk_path)
        # TTS model check is more complex, just check if path looks reasonable
        tts_reasonable = len(tts_path) > 10 and "/" in tts_path
        
        return {
            "status": "success" if vosk_exists else "partial",
            "vosk_model": {
                "path": vosk_path,
                "exists": vosk_exists
            },
            "tts_model": {
                "path": tts_path,
                "reasonable_path": tts_reasonable
            }
        }
    
    def verify_deployment(self) -> Dict[str, Any]:
        """Comprehensive deployment verification"""
        print("🚀 Starting Railway Deployment Verification")
        print("=" * 60)
        
        results = {
            "timestamp": time.time(),
            "base_url": self.base_url,
            "checks": {}
        }
        
        # Run all checks
        results["checks"]["connectivity"] = self.check_basic_connectivity()
        results["checks"]["health"] = self.check_health_endpoint()
        results["checks"]["maqsam_status"] = self.check_maqsam_status()
        results["checks"]["environment"] = self.check_environment_variables()
        results["checks"]["voice_models"] = self.check_voice_models()
        
        # Calculate overall status
        check_statuses = [check.get("status", "failed") for check in results["checks"].values()]
        success_count = check_statuses.count("success")
        total_checks = len(check_statuses)
        
        if success_count == total_checks:
            overall_status = "deployment_successful"
        elif success_count >= total_checks * 0.7:
            overall_status = "deployment_partially_successful"
        else:
            overall_status = "deployment_failed"
        
        results["overall_status"] = overall_status
        results["success_ratio"] = f"{success_count}/{total_checks}"
        
        return results
    
    def print_results(self, results: Dict[str, Any]):
        """Print formatted verification results"""
        print("\n" + "=" * 60)
        print("📊 DEPLOYMENT VERIFICATION RESULTS")
        print("=" * 60)
        
        print(f"🌐 Base URL: {results['base_url']}")
        print(f"⏰ Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(results['timestamp']))}")
        print(f"📈 Overall Status: {results['overall_status'].upper()}")
        print(f"✅ Success Rate: {results['success_ratio']}")
        
        print("\n🔍 CHECK DETAILS:")
        print("-" * 40)
        
        for check_name, check_result in results["checks"].items():
            status_icon = "✅" if check_result.get("status") == "success" else "⚠️" if check_result.get("status") == "partial" else "❌"
            print(f"{status_icon} {check_name.upper()}: {check_result.get('status', 'unknown')}")
            
            if "error" in check_result:
                print(f"   Error: {check_result['error']}")
            
            if check_name == "connectivity":
                if check_result.get("status_code"):
                    print(f"   Status Code: {check_result['status_code']}")
                if check_result.get("response_time"):
                    print(f"   Response Time: {check_result['response_time']:.2f}s")
            
            elif check_name == "health":
                if check_result.get("voice_service"):
                    print(f"   Voice Service: {check_result['voice_service']}")
                if check_result.get("status_field"):
                    print(f"   Service Status: {check_result['status_field']}")
            
            elif check_name == "environment":
                present = check_result.get("present_variables", {})
                missing = check_result.get("missing_variables", [])
                if missing:
                    print(f"   Missing: {', '.join(missing)}")
                print(f"   Environment Variables: {len(present)}/{check_result.get('total_checked', 0)} configured")
        
        print("\n" + "=" * 60)
        
        # Print recommendations
        if results["overall_status"] == "deployment_successful":
            print("🎉 DEPLOYMENT SUCCESSFUL! Voice service is ready for use.")
        elif results["overall_status"] == "deployment_partially_successful":
            print("⚠️ DEPLOYMENT PARTIALLY SUCCESSFUL. Some issues detected.")
            print("   - Check missing environment variables")
            print("   - Verify voice model paths")
            print("   - Review health check logs")
        else:
            print("❌ DEPLOYMENT FAILED! Critical issues detected.")
            print("   - Check service logs in Railway dashboard")
            print("   - Verify environment variables")
            print("   - Ensure voice models are properly uploaded")
        
        print("=" * 60)

def main():
    """Main verification function"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        # Default Railway deployment URL format
        project_name = "hana-voice-saas"
        print(f"🔍 Railway deployment verification for {project_name}")
        print("Usage: python deploy_verification.py <railway_url>")
        print("Example: python deploy_verification.py https://hana-voice-service-production.up.railway.app")
        return
    
    verifier = DeploymentVerifier(base_url)
    results = verifier.verify_deployment()
    verifier.print_results(results)
    
    # Save detailed results to JSON file
    results_file = f"deployment_verification_{int(time.time())}.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    # Exit with appropriate code
    if results["overall_status"] == "deployment_successful":
        sys.exit(0)
    elif results["overall_status"] == "deployment_partially_successful":
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
