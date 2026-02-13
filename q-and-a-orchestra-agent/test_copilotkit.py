#!/usr/bin/env python3
"""
Test script to validate CopilotKit integration without full dependencies.
"""

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_basic_imports():
    """Test basic FastAPI imports"""
    try:
        from fastapi import FastAPI
        from fastapi.routing import APIRouter
        print("✓ FastAPI imports successful")
        return True
    except ImportError as e:
        print(f"✗ FastAPI import failed: {e}")
        return False

def test_copilotkit_schemas():
    """Test CopilotKit schema imports"""
    try:
        from schemas.copilotkit_schemas import (
            CopilotKitActionRequest, 
            AgentTaskRequest, 
            WorkflowRequest,
            AgentTaskResponse,
            WorkflowResponse
        )
        print("✓ CopilotKit schemas import successful")
        return True
    except ImportError as e:
        print(f"✗ CopilotKit schemas import failed: {e}")
        return False

def test_copilotkit_integration():
    """Test CopilotKit integration module"""
    try:
        # Test basic import without initializing
        import copilotkit_integration
        print("✓ CopilotKit integration module import successful")
        
        # Test router creation
        router = copilotkit_integration.router
        if hasattr(router, 'prefix'):
            print(f"✓ Router created with prefix: {router.prefix}")
        else:
            print("✗ Router missing prefix")
            return False
            
        return True
    except Exception as e:
        print(f"✗ CopilotKit integration test failed: {e}")
        return False

def test_api_endpoints():
    """Test API endpoint definitions"""
    try:
        import copilotkit_integration
        
        # Check if router has the expected endpoints
        routes = copilotkit_integration.router.routes
        endpoint_paths = [route.path for route in routes]
        
        expected_endpoints = ['/actions', '/messages']
        for endpoint in expected_endpoints:
            if any(endpoint in path for path in endpoint_paths):
                print(f"✓ Endpoint {endpoint} found")
            else:
                print(f"✗ Endpoint {endpoint} missing")
                return False
                
        return True
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Testing CopilotKit Integration...")
    print("=" * 50)
    
    tests = [
        test_basic_imports,
        test_copilotkit_schemas,
        test_copilotkit_integration,
        test_api_endpoints,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! CopilotKit integration is ready.")
        return True
    else:
        print("❌ Some tests failed. Check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
