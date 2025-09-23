#!/usr/bin/env python3
"""
Render Configuration Validator for Hana Voice SaaS
Validates that all paths and configurations are correct for Render deployment
"""

import os
import sys
import yaml
from pathlib import Path

def validate_directory_structure():
    """Validate that all required directories and files exist"""
    print("🔍 Validating directory structure...")
    
    required_dirs = [
        "api-service/src",
        "voice-service/src", 
        "data-service/src",
        "frontend/src",
        "config",
        "config/clients",
        "config/surveys"
    ]
    
    required_files = [
        "api-service/requirements.txt",
        "api-service/src/main.py",
        "api-service/src/api/routes.py",
        "voice-service/requirements.txt", 
        "voice-service/src/main.py",
        "data-service/requirements.txt",
        "data-service/src/main.py",
        "frontend/package.json",
        "frontend/next.config.ts",
        "render.yaml"
    ]
    
    errors = []
    
    # Check directories
    for dir_path in required_dirs:
        if not os.path.exists(dir_path):
            errors.append(f"❌ Missing directory: {dir_path}")
        else:
            print(f"✅ Directory exists: {dir_path}")
    
    # Check files
    for file_path in required_files:
        if not os.path.exists(file_path):
            errors.append(f"❌ Missing file: {file_path}")
        else:
            print(f"✅ File exists: {file_path}")
    
    return errors

def validate_render_yaml():
    """Validate render.yaml configuration"""
    print("\n🔍 Validating render.yaml...")
    
    try:
        with open('render.yaml', 'r') as f:
            config = yaml.safe_load(f)
        
        errors = []
        
        # Check required sections
        if 'services' not in config:
            errors.append("❌ Missing 'services' section in render.yaml")
        else:
            print("✅ Services section found")
            
            # Check each service
            service_names = []
            for service in config['services']:
                name = service.get('name', 'unknown')
                service_names.append(name)
                
                # Check build commands
                build_cmd = service.get('buildCommand', '')
                if not build_cmd:
                    errors.append(f"❌ Service {name}: Missing buildCommand")
                
                # Check start commands
                start_cmd = service.get('startCommand', '')
                if not start_cmd:
                    errors.append(f"❌ Service {name}: Missing startCommand")
                
                # Check health check paths
                health_path = service.get('healthCheckPath', '')
                if not health_path:
                    errors.append(f"❌ Service {name}: Missing healthCheckPath")
            
            print(f"✅ Found {len(service_names)} services: {', '.join(service_names)}")
        
        # Check database configuration
        if 'databases' in config:
            print("✅ Database configuration found")
        else:
            print("⚠️  No database configuration found (using external Supabase)")
        
        return errors
        
    except Exception as e:
        return [f"❌ Error parsing render.yaml: {str(e)}"]

def validate_python_services():
    """Validate Python service configurations"""
    print("\n🔍 Validating Python services...")
    
    errors = []
    
    # Check API service
    api_main = "api-service/src/main.py"
    if os.path.exists(api_main):
        try:
            with open(api_main, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'health' in content and 'FastAPI' in content:
                    print("✅ API service main.py looks correct")
                else:
                    errors.append("❌ API service main.py may be missing health endpoint")
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(api_main, 'r', encoding='latin-1') as f:
                    content = f.read()
                    if 'health' in content and 'FastAPI' in content:
                        print("✅ API service main.py looks correct (latin-1 encoding)")
                    else:
                        errors.append("❌ API service main.py may be missing health endpoint")
            except Exception as e:
                errors.append(f"❌ Error reading API service main.py: {e}")
    
    # Check requirements files
    for service in ['api-service', 'voice-service', 'data-service']:
        req_file = f"{service}/requirements.txt"
        if os.path.exists(req_file):
            try:
                with open(req_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'fastapi' in content.lower() or 'uvicorn' in content.lower():
                        print(f"✅ {service} requirements.txt looks correct")
                    else:
                        errors.append(f"❌ {service} requirements.txt may be missing FastAPI dependencies")
            except UnicodeDecodeError:
                try:
                    with open(req_file, 'r', encoding='latin-1') as f:
                        content = f.read()
                        if 'fastapi' in content.lower() or 'uvicorn' in content.lower():
                            print(f"✅ {service} requirements.txt looks correct (latin-1 encoding)")
                        else:
                            errors.append(f"❌ {service} requirements.txt may be missing FastAPI dependencies")
                except Exception as e:
                    errors.append(f"❌ Error reading {service} requirements.txt: {e}")
    
    return errors

def validate_frontend():
    """Validate frontend configuration"""
    print("\n🔍 Validating frontend...")
    
    errors = []
    
    # Check package.json
    pkg_json = "frontend/package.json"
    if os.path.exists(pkg_json):
        with open(pkg_json, 'r') as f:
            content = f.read()
            if '"next"' in content and '"react"' in content:
                print("✅ Frontend package.json looks correct")
            else:
                errors.append("❌ Frontend package.json may be missing Next.js/React dependencies")
    
    # Check next.config.ts
    next_config = "frontend/next.config.ts"
    if os.path.exists(next_config):
        print("✅ Next.js configuration found")
    else:
        errors.append("❌ Missing next.config.ts")
    
    return errors

def validate_environment_variables():
    """Validate required environment variables"""
    print("\n🔍 Validating environment variables...")
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_KEY', 
        'OPENAI_API_KEY',
        'JWT_SECRET_KEY'
    ]
    
    print("✅ Environment variables will be configured in Render dashboard")
    print(f"⚠️  Required variables: {', '.join(required_vars)}")
    
    return []

def generate_deployment_commands():
    """Generate deployment commands for reference"""
    print("\n🚀 Deployment Commands:")
    
    commands = [
        "# Connect to GitHub repository in Render dashboard",
        "# Render will automatically detect render.yaml",
        "# Set environment variables in Render dashboard:",
        "# - SUPABASE_URL, SUPABASE_KEY",
        "# - OPENAI_API_KEY", 
        "# - JWT_SECRET_KEY (auto-generated)",
        "# Deploy services"
    ]
    
    for cmd in commands:
        print(cmd)

def main():
    """Main validation function"""
    print("=" * 60)
    print("HANA VOICE SAAS - RENDER DEPLOYMENT VALIDATION")
    print("=" * 60)
    
    all_errors = []
    
    # Run all validations
    all_errors.extend(validate_directory_structure())
    all_errors.extend(validate_render_yaml()) 
    all_errors.extend(validate_python_services())
    all_errors.extend(validate_frontend())
    all_errors.extend(validate_environment_variables())
    
    # Summary
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    
    if all_errors:
        print("❌ VALIDATION FAILED - Found errors:")
        for error in all_errors:
            print(f"  {error}")
        print(f"\nTotal errors: {len(all_errors)}")
        return 1
    else:
        print("✅ VALIDATION PASSED - Ready for deployment!")
        generate_deployment_commands()
        return 0

if __name__ == "__main__":
    sys.exit(main())
