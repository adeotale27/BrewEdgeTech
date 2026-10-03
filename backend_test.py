#!/usr/bin/env python3
"""
Comprehensive backend API test for Brew EdgeTech Next.js + MongoDB app.
Tests all endpoints as specified in the review request.
"""

import requests
import json
import io
import os
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
API_BASE = f"{BASE_URL}/api"

# Admin credentials
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', '')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_result(test_name, passed, message=""):
    """Log test result"""
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
        if message:
            print(f"   {message}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append(f"{test_name}: {message}")
        print(f"❌ FAIL: {test_name}")
        print(f"   {message}")

def test_health():
    """Test 1: GET /api/health"""
    print("\n=== TEST 1: Health Check ===")
    try:
        r = requests.get(f"{API_BASE}/health", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("status") == "ok" and data.get("database") == "connected":
                log_result("Health check", True, f"Status: {data.get('status')}, DB: {data.get('database')}")
            else:
                log_result("Health check", False, f"Unexpected response: {data}")
        else:
            log_result("Health check", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("Health check", False, f"Exception: {str(e)}")

def test_public_leads():
    """Test 2: POST /api/leads - valid and invalid"""
    print("\n=== TEST 2: Public Leads Submission ===")
    
    # Valid lead
    try:
        valid_lead = {
            "name": "John Smith",
            "email": "john.smith@example.com",
            "service": "Website Design",
            "message": "I need a new website for my business. Looking for modern design with e-commerce capabilities."
        }
        r = requests.post(f"{API_BASE}/leads", json=valid_lead, timeout=10)
        if r.status_code == 201:
            data = r.json()
            if data.get("ok") and data.get("id"):
                log_result("Valid lead submission", True, f"Lead ID: {data.get('id')}")
            else:
                log_result("Valid lead submission", False, f"Missing ok/id in response: {data}")
        else:
            log_result("Valid lead submission", False, f"Expected 201, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("Valid lead submission", False, f"Exception: {str(e)}")
    
    # Invalid - missing email
    try:
        invalid_lead = {
            "name": "Jane Doe",
            "service": "SEO",
            "message": "Need SEO services"
        }
        r = requests.post(f"{API_BASE}/leads", json=invalid_lead, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get("error", {}).get("code") == "VALIDATION_ERROR":
                log_result("Invalid lead (missing email)", True, "Correctly rejected with VALIDATION_ERROR")
            else:
                log_result("Invalid lead (missing email)", False, f"Wrong error code: {data}")
        else:
            log_result("Invalid lead (missing email)", False, f"Expected 400, got {r.status_code}")
    except Exception as e:
        log_result("Invalid lead (missing email)", False, f"Exception: {str(e)}")
    
    # Invalid - bad email format
    try:
        bad_email_lead = {
            "name": "Bob Johnson",
            "email": "notanemail",
            "service": "Custom Software",
            "message": "Need custom software development"
        }
        r = requests.post(f"{API_BASE}/leads", json=bad_email_lead, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get("error", {}).get("code") == "VALIDATION_ERROR":
                log_result("Invalid lead (bad email)", True, "Correctly rejected with VALIDATION_ERROR")
            else:
                log_result("Invalid lead (bad email)", False, f"Wrong error code: {data}")
        else:
            log_result("Invalid lead (bad email)", False, f"Expected 400, got {r.status_code}")
    except Exception as e:
        log_result("Invalid lead (bad email)", False, f"Exception: {str(e)}")
    
    # Invalid - missing message
    try:
        no_message_lead = {
            "name": "Alice Brown",
            "email": "alice@example.com",
            "service": "AI Automation"
        }
        r = requests.post(f"{API_BASE}/leads", json=no_message_lead, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get("error", {}).get("code") == "VALIDATION_ERROR":
                log_result("Invalid lead (missing message)", True, "Correctly rejected with VALIDATION_ERROR")
            else:
                log_result("Invalid lead (missing message)", False, f"Wrong error code: {data}")
        else:
            log_result("Invalid lead (missing message)", False, f"Expected 400, got {r.status_code}")
    except Exception as e:
        log_result("Invalid lead (missing message)", False, f"Exception: {str(e)}")

def test_public_content():
    """Test 3: GET /api/site-content and /api/portfolio"""
    print("\n=== TEST 3: Public Content Endpoints ===")
    
    # Site content
    try:
        r = requests.get(f"{API_BASE}/site-content", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "content" in data and isinstance(data["content"], dict):
                log_result("GET /api/site-content", True, f"Content keys: {list(data['content'].keys())}")
            else:
                log_result("GET /api/site-content", False, f"Missing 'content' object: {data}")
        else:
            log_result("GET /api/site-content", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/site-content", False, f"Exception: {str(e)}")
    
    # Portfolio
    try:
        r = requests.get(f"{API_BASE}/portfolio", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "projects" in data and isinstance(data["projects"], list):
                log_result("GET /api/portfolio", True, f"Found {len(data['projects'])} published projects")
            else:
                log_result("GET /api/portfolio", False, f"Missing 'projects' array: {data}")
        else:
            log_result("GET /api/portfolio", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/portfolio", False, f"Exception: {str(e)}")

def test_error_logging():
    """Test 4: Error logging - public POST, then admin GET/PUT/DELETE"""
    print("\n=== TEST 4: Error Logging System ===")
    
    error_id = None
    
    # Public POST /api/error-log
    try:
        error_data = {
            "message": "Test error from automated testing",
            "source": "backend_test.py",
            "area": "testing",
            "url": "/test-page"
        }
        r = requests.post(f"{API_BASE}/error-log", json=error_data, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("id"):
                error_id = data.get("id")
                log_result("POST /api/error-log (public)", True, f"Error logged with ID: {error_id}")
            else:
                log_result("POST /api/error-log (public)", False, f"Missing ok/id: {data}")
        else:
            log_result("POST /api/error-log (public)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/error-log (public)", False, f"Exception: {str(e)}")
    
    # We'll test admin GET/PUT/DELETE after authentication
    return error_id

def test_auth_negative():
    """Test 5: Auth negative - all admin routes should return 401 without cookie"""
    print("\n=== TEST 5: Auth Negative Tests ===")
    
    admin_routes = [
        ("GET", "/admin/content"),
        ("GET", "/admin/portfolio"),
        ("GET", "/admin/leads"),
        ("GET", "/admin/media"),
        ("GET", "/admin/error-logs"),
        ("GET", "/admin/audit"),
        ("GET", "/admin/seo-audit"),
        ("GET", "/engagement/summary"),
    ]
    
    for method, route in admin_routes:
        try:
            if method == "GET":
                r = requests.get(f"{API_BASE}{route}", timeout=10)
            else:
                r = requests.request(method, f"{API_BASE}{route}", timeout=10)
            
            if r.status_code == 401:
                data = r.json()
                if data.get("error", {}).get("code") == "UNAUTHORIZED":
                    log_result(f"Unauthorized {method} {route}", True, "Correctly returned 401 UNAUTHORIZED")
                else:
                    log_result(f"Unauthorized {method} {route}", False, f"Wrong error code: {data}")
            else:
                log_result(f"Unauthorized {method} {route}", False, f"Expected 401, got {r.status_code}")
        except Exception as e:
            log_result(f"Unauthorized {method} {route}", False, f"Exception: {str(e)}")
    
    # Wrong credentials
    try:
        r = requests.post(f"{API_BASE}/admin-auth", json={"username": ADMIN_USERNAME, "password": "wrongpassword"}, timeout=10)
        if r.status_code == 401:
            data = r.json()
            if data.get("error", {}).get("code") == "INVALID_CREDENTIALS":
                log_result("Login with wrong password", True, "Correctly returned 401 INVALID_CREDENTIALS")
            else:
                log_result("Login with wrong password", False, f"Wrong error code: {data}")
        else:
            log_result("Login with wrong password", False, f"Expected 401, got {r.status_code}")
    except Exception as e:
        log_result("Login with wrong password", False, f"Exception: {str(e)}")

def test_auth_positive():
    """Test 6: Auth positive - login, check, logout"""
    print("\n=== TEST 6: Auth Positive Tests ===")
    
    session = requests.Session()
    
    # Login
    try:
        r = session.post(f"{API_BASE}/admin-auth", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("username") == ADMIN_USERNAME:
                # Check for cookie
                if "brew_admin_session" in session.cookies:
                    log_result("Admin login", True, f"Logged in as {data.get('username')}, cookie set")
                else:
                    log_result("Admin login", False, "Login succeeded but cookie not set")
            else:
                log_result("Admin login", False, f"Unexpected response: {data}")
        else:
            log_result("Admin login", False, f"Expected 200, got {r.status_code}: {r.text}")
            return None
    except Exception as e:
        log_result("Admin login", False, f"Exception: {str(e)}")
        return None
    
    # Check authentication
    try:
        r = session.get(f"{API_BASE}/admin-auth", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("authenticated") == True:
                log_result("GET /api/admin-auth (authenticated)", True, "Session verified")
            else:
                log_result("GET /api/admin-auth (authenticated)", False, f"Not authenticated: {data}")
        else:
            log_result("GET /api/admin-auth (authenticated)", False, f"Expected 200, got {r.status_code}")
    except Exception as e:
        log_result("GET /api/admin-auth (authenticated)", False, f"Exception: {str(e)}")
    
    return session

def test_content_cms(session):
    """Test 7: Content CMS - GET, PUT draft, POST publish, GET revisions"""
    print("\n=== TEST 7: Content CMS ===")
    
    if not session:
        print("⚠️  Skipping content CMS tests - no authenticated session")
        return
    
    # GET /api/admin/content
    try:
        r = session.get(f"{API_BASE}/admin/content", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "items" in data and isinstance(data["items"], list):
                log_result("GET /api/admin/content", True, f"Found {len(data['items'])} content items")
            else:
                log_result("GET /api/admin/content", False, f"Missing 'items' array: {data}")
        else:
            log_result("GET /api/admin/content", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/content", False, f"Exception: {str(e)}")
    
    # PUT /api/admin/content (save draft)
    try:
        draft_content = {
            "key": "homepage",
            "content": {
                "hero_title": "Test Hero",
                "hero_subtitle": "This is a test from automated testing"
            }
        }
        r = session.put(f"{API_BASE}/admin/content", json=draft_content, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                log_result("PUT /api/admin/content (save draft)", True, "Draft saved successfully")
            else:
                log_result("PUT /api/admin/content (save draft)", False, f"Unexpected response: {data}")
        else:
            log_result("PUT /api/admin/content (save draft)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("PUT /api/admin/content (save draft)", False, f"Exception: {str(e)}")
    
    # POST /api/admin/content (publish)
    try:
        r = session.post(f"{API_BASE}/admin/content", json={"key": "homepage"}, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                log_result("POST /api/admin/content (publish)", True, "Content published successfully")
            else:
                log_result("POST /api/admin/content (publish)", False, f"Unexpected response: {data}")
        else:
            log_result("POST /api/admin/content (publish)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/admin/content (publish)", False, f"Exception: {str(e)}")
    
    # Verify published content appears in public endpoint
    try:
        r = requests.get(f"{API_BASE}/site-content", timeout=10)
        if r.status_code == 200:
            data = r.json()
            hero_title = data.get("content", {}).get("homepage", {}).get("hero_title")
            if hero_title == "Test Hero":
                log_result("Published content verification", True, f"hero_title correctly shows: {hero_title}")
            else:
                log_result("Published content verification", False, f"Expected 'Test Hero', got: {hero_title}")
        else:
            log_result("Published content verification", False, f"Expected 200, got {r.status_code}")
    except Exception as e:
        log_result("Published content verification", False, f"Exception: {str(e)}")
    
    # GET /api/admin/revisions?key=homepage
    try:
        r = session.get(f"{API_BASE}/admin/revisions?key=homepage", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "revisions" in data and isinstance(data["revisions"], list):
                # Should have at least draft + publish entries
                if len(data["revisions"]) >= 2:
                    log_result("GET /api/admin/revisions", True, f"Found {len(data['revisions'])} revisions")
                else:
                    log_result("GET /api/admin/revisions", False, f"Expected at least 2 revisions, got {len(data['revisions'])}")
            else:
                log_result("GET /api/admin/revisions", False, f"Missing 'revisions' array: {data}")
        else:
            log_result("GET /api/admin/revisions", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/revisions", False, f"Exception: {str(e)}")

def test_portfolio_crud(session):
    """Test 8: Portfolio CRUD - POST, GET, PUT, DELETE with validation"""
    print("\n=== TEST 8: Portfolio CRUD ===")
    
    if not session:
        print("⚠️  Skipping portfolio CRUD tests - no authenticated session")
        return
    
    project_id = None
    
    # POST /api/admin/portfolio (create)
    try:
        new_project = {
            "title": "Demo Project",
            "category": "Website",
            "description": "A test project created by automated testing",
            "live_url": "https://example.com",
            "published": True
        }
        r = session.post(f"{API_BASE}/admin/portfolio", json=new_project, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("id"):
                project_id = data.get("id")
                log_result("POST /api/admin/portfolio (create)", True, f"Project created with ID: {project_id}")
            else:
                log_result("POST /api/admin/portfolio (create)", False, f"Missing ok/id: {data}")
        else:
            log_result("POST /api/admin/portfolio (create)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/admin/portfolio (create)", False, f"Exception: {str(e)}")
    
    # GET /api/admin/portfolio (list)
    try:
        r = session.get(f"{API_BASE}/admin/portfolio", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "projects" in data and isinstance(data["projects"], list):
                found = any(p.get("id") == project_id for p in data["projects"])
                if found:
                    log_result("GET /api/admin/portfolio (list)", True, f"Found created project in list of {len(data['projects'])} projects")
                else:
                    log_result("GET /api/admin/portfolio (list)", False, f"Created project not found in list")
            else:
                log_result("GET /api/admin/portfolio (list)", False, f"Missing 'projects' array: {data}")
        else:
            log_result("GET /api/admin/portfolio (list)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/portfolio (list)", False, f"Exception: {str(e)}")
    
    # Verify it appears in public endpoint (since published=true)
    try:
        r = requests.get(f"{API_BASE}/portfolio", timeout=10)
        if r.status_code == 200:
            data = r.json()
            found = any(p.get("id") == project_id for p in data.get("projects", []))
            if found:
                log_result("Public portfolio verification", True, "Published project appears in public endpoint")
            else:
                log_result("Public portfolio verification", False, "Published project not found in public endpoint")
        else:
            log_result("Public portfolio verification", False, f"Expected 200, got {r.status_code}")
    except Exception as e:
        log_result("Public portfolio verification", False, f"Exception: {str(e)}")
    
    # PUT /api/admin/portfolio (update)
    if project_id:
        try:
            updated_project = {
                "id": project_id,
                "title": "Updated Demo Project",
                "category": "Website",
                "description": "Updated description",
                "live_url": "https://example.com/updated",
                "published": True
            }
            r = session.put(f"{API_BASE}/admin/portfolio", json=updated_project, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("PUT /api/admin/portfolio (update)", True, "Project updated successfully")
                else:
                    log_result("PUT /api/admin/portfolio (update)", False, f"Unexpected response: {data}")
            else:
                log_result("PUT /api/admin/portfolio (update)", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("PUT /api/admin/portfolio (update)", False, f"Exception: {str(e)}")
    
    # Invalid URL validation
    try:
        invalid_project = {
            "title": "Invalid URL Project",
            "category": "Website",
            "live_url": "notaurl",
            "published": False
        }
        r = session.post(f"{API_BASE}/admin/portfolio", json=invalid_project, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get("error", {}).get("code") == "VALIDATION_ERROR":
                log_result("Portfolio invalid URL validation", True, "Correctly rejected invalid URL")
            else:
                log_result("Portfolio invalid URL validation", False, f"Wrong error code: {data}")
        else:
            log_result("Portfolio invalid URL validation", False, f"Expected 400, got {r.status_code}")
    except Exception as e:
        log_result("Portfolio invalid URL validation", False, f"Exception: {str(e)}")
    
    # DELETE /api/admin/portfolio
    if project_id:
        try:
            r = session.delete(f"{API_BASE}/admin/portfolio", json={"id": project_id}, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("DELETE /api/admin/portfolio", True, "Project deleted successfully")
                else:
                    log_result("DELETE /api/admin/portfolio", False, f"Unexpected response: {data}")
            else:
                log_result("DELETE /api/admin/portfolio", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("DELETE /api/admin/portfolio", False, f"Exception: {str(e)}")

def test_leads_crm(session):
    """Test 9: Leads CRM - GET, PUT"""
    print("\n=== TEST 9: Leads CRM ===")
    
    if not session:
        print("⚠️  Skipping leads CRM tests - no authenticated session")
        return
    
    lead_id = None
    
    # GET /api/admin/leads
    try:
        r = session.get(f"{API_BASE}/admin/leads", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "leads" in data and isinstance(data["leads"], list):
                if len(data["leads"]) > 0:
                    lead_id = data["leads"][0].get("id")
                    log_result("GET /api/admin/leads", True, f"Found {len(data['leads'])} leads (including test lead from step 2)")
                else:
                    log_result("GET /api/admin/leads", True, "No leads found (empty list is valid)")
            else:
                log_result("GET /api/admin/leads", False, f"Missing 'leads' array: {data}")
        else:
            log_result("GET /api/admin/leads", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/leads", False, f"Exception: {str(e)}")
    
    # PUT /api/admin/leads (update)
    if lead_id:
        try:
            update_data = {
                "id": lead_id,
                "status": "contacted",
                "notes": "Test note from automated testing"
            }
            r = session.put(f"{API_BASE}/admin/leads", json=update_data, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("PUT /api/admin/leads (update)", True, "Lead updated successfully")
                else:
                    log_result("PUT /api/admin/leads (update)", False, f"Unexpected response: {data}")
            else:
                log_result("PUT /api/admin/leads (update)", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("PUT /api/admin/leads (update)", False, f"Exception: {str(e)}")
    else:
        print("⚠️  Skipping lead update - no lead ID available")

def test_engagement(session):
    """Test 10: Engagement - POST public, GET summary with session"""
    print("\n=== TEST 10: Engagement Tracking ===")
    
    # POST /api/engagement (public)
    try:
        engagement_data = {
            "event": "contact_cta_clicked",
            "page": "/"
        }
        r = requests.post(f"{API_BASE}/engagement", json=engagement_data, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                log_result("POST /api/engagement (public)", True, "Engagement event tracked")
            else:
                log_result("POST /api/engagement (public)", False, f"Unexpected response: {data}")
        else:
            log_result("POST /api/engagement (public)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/engagement (public)", False, f"Exception: {str(e)}")
    
    # GET /api/engagement/summary (admin)
    if session:
        try:
            r = session.get(f"{API_BASE}/engagement/summary?days=30", timeout=10)
            if r.status_code == 200:
                data = r.json()
                if "events" in data and isinstance(data["events"], list):
                    log_result("GET /api/engagement/summary (admin)", True, f"Found {len(data['events'])} event types")
                else:
                    log_result("GET /api/engagement/summary (admin)", False, f"Missing 'events' array: {data}")
            else:
                log_result("GET /api/engagement/summary (admin)", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("GET /api/engagement/summary (admin)", False, f"Exception: {str(e)}")
    else:
        print("⚠️  Skipping engagement summary - no authenticated session")

def test_media(session):
    """Test 11: Media - POST upload, GET list, GET serve, DELETE"""
    print("\n=== TEST 11: Media Upload/Management ===")
    
    if not session:
        print("⚠️  Skipping media tests - no authenticated session")
        return
    
    media_key = None
    media_url = None
    
    # Create a small test PNG (1x1 red pixel)
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # POST /api/admin/media (upload)
    try:
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        r = session.post(f"{API_BASE}/admin/media", files=files, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("key") and data.get("url"):
                media_key = data.get("key")
                media_url = data.get("url")
                log_result("POST /api/admin/media (upload)", True, f"Media uploaded: {media_key}")
            else:
                log_result("POST /api/admin/media (upload)", False, f"Missing ok/key/url: {data}")
        else:
            log_result("POST /api/admin/media (upload)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/admin/media (upload)", False, f"Exception: {str(e)}")
    
    # GET /api/admin/media (list)
    try:
        r = session.get(f"{API_BASE}/admin/media", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "items" in data and isinstance(data["items"], list):
                found = any(m.get("key") == media_key for m in data["items"])
                if found:
                    log_result("GET /api/admin/media (list)", True, f"Found uploaded media in list of {len(data['items'])} items")
                else:
                    log_result("GET /api/admin/media (list)", False, "Uploaded media not found in list")
            else:
                log_result("GET /api/admin/media (list)", False, f"Missing 'items' array: {data}")
        else:
            log_result("GET /api/admin/media (list)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/media (list)", False, f"Exception: {str(e)}")
    
    # GET media URL (public serve)
    if media_url:
        try:
            full_url = f"{BASE_URL}{media_url}"
            r = requests.get(full_url, timeout=10)
            if r.status_code == 200:
                if r.headers.get('Content-Type', '').startswith('image/'):
                    log_result("GET media URL (serve)", True, f"Media served successfully, size: {len(r.content)} bytes")
                else:
                    log_result("GET media URL (serve)", False, f"Wrong content type: {r.headers.get('Content-Type')}")
            else:
                log_result("GET media URL (serve)", False, f"Expected 200, got {r.status_code}")
        except Exception as e:
            log_result("GET media URL (serve)", False, f"Exception: {str(e)}")
    
    # Test disallowed file type
    try:
        files = {'file': ('test.txt', io.BytesIO(b'test'), 'text/plain')}
        r = session.post(f"{API_BASE}/admin/media", files=files, timeout=10)
        if r.status_code == 400:
            data = r.json()
            if data.get("error", {}).get("code") == "VALIDATION_ERROR":
                log_result("Media upload (disallowed type)", True, "Correctly rejected disallowed file type")
            else:
                log_result("Media upload (disallowed type)", False, f"Wrong error code: {data}")
        else:
            log_result("Media upload (disallowed type)", False, f"Expected 400, got {r.status_code}")
    except Exception as e:
        log_result("Media upload (disallowed type)", False, f"Exception: {str(e)}")
    
    # DELETE /api/admin/media
    if media_key:
        try:
            r = session.delete(f"{API_BASE}/admin/media", json={"key": media_key}, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("DELETE /api/admin/media", True, "Media deleted successfully")
                else:
                    log_result("DELETE /api/admin/media", False, f"Unexpected response: {data}")
            else:
                log_result("DELETE /api/admin/media", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("DELETE /api/admin/media", False, f"Exception: {str(e)}")

def test_schedule_audit(session):
    """Test 12: Schedule and Audit - GET schedule, POST schedule, GET audit"""
    print("\n=== TEST 12: Schedule & Audit ===")
    
    if not session:
        print("⚠️  Skipping schedule/audit tests - no authenticated session")
        return
    
    # GET /api/admin/schedule
    try:
        r = session.get(f"{API_BASE}/admin/schedule", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "schedules" in data and isinstance(data["schedules"], list):
                log_result("GET /api/admin/schedule", True, f"Found {len(data['schedules'])} schedules")
            else:
                log_result("GET /api/admin/schedule", False, f"Missing 'schedules' array: {data}")
        else:
            log_result("GET /api/admin/schedule", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/schedule", False, f"Exception: {str(e)}")
    
    # POST /api/admin/schedule
    try:
        future_time = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        schedule_data = {
            "key": "homepage",
            "publish_at": future_time
        }
        r = session.post(f"{API_BASE}/admin/schedule", json=schedule_data, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok") and data.get("id"):
                log_result("POST /api/admin/schedule", True, f"Schedule created with ID: {data.get('id')}")
            else:
                log_result("POST /api/admin/schedule", False, f"Missing ok/id: {data}")
        else:
            log_result("POST /api/admin/schedule", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("POST /api/admin/schedule", False, f"Exception: {str(e)}")
    
    # GET /api/admin/audit
    try:
        r = session.get(f"{API_BASE}/admin/audit", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "events" in data and isinstance(data["events"], list):
                # Should contain entries from prior operations (login, publish, create, etc.)
                if len(data["events"]) > 0:
                    log_result("GET /api/admin/audit", True, f"Found {len(data['events'])} audit events")
                else:
                    log_result("GET /api/admin/audit", False, "No audit events found (expected some from prior operations)")
            else:
                log_result("GET /api/admin/audit", False, f"Missing 'events' array: {data}")
        else:
            log_result("GET /api/admin/audit", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/audit", False, f"Exception: {str(e)}")

def test_error_logs_admin(session, error_id):
    """Test error logs admin endpoints (continuation of test 4)"""
    print("\n=== TEST 4 (continued): Error Logs Admin Management ===")
    
    if not session:
        print("⚠️  Skipping error logs admin tests - no authenticated session")
        return
    
    # GET /api/admin/error-logs
    try:
        r = session.get(f"{API_BASE}/admin/error-logs", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if "logs" in data and isinstance(data["logs"], list) and "unresolved" in data:
                found = any(log.get("id") == error_id for log in data["logs"]) if error_id else True
                if found or not error_id:
                    log_result("GET /api/admin/error-logs", True, f"Found {len(data['logs'])} logs, {data['unresolved']} unresolved")
                else:
                    log_result("GET /api/admin/error-logs", False, "Posted error not found in logs")
            else:
                log_result("GET /api/admin/error-logs", False, f"Missing 'logs' or 'unresolved': {data}")
        else:
            log_result("GET /api/admin/error-logs", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("GET /api/admin/error-logs", False, f"Exception: {str(e)}")
    
    # PUT /api/admin/error-logs (mark resolved)
    if error_id:
        try:
            r = session.put(f"{API_BASE}/admin/error-logs", json={"id": error_id, "resolved": True}, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("PUT /api/admin/error-logs (resolve)", True, "Error marked as resolved")
                else:
                    log_result("PUT /api/admin/error-logs (resolve)", False, f"Unexpected response: {data}")
            else:
                log_result("PUT /api/admin/error-logs (resolve)", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("PUT /api/admin/error-logs (resolve)", False, f"Exception: {str(e)}")
    
    # DELETE /api/admin/error-logs (delete one)
    if error_id:
        try:
            r = session.delete(f"{API_BASE}/admin/error-logs", json={"id": error_id}, timeout=10)
            if r.status_code == 200:
                data = r.json()
                if data.get("ok"):
                    log_result("DELETE /api/admin/error-logs (single)", True, "Error log deleted")
                else:
                    log_result("DELETE /api/admin/error-logs (single)", False, f"Unexpected response: {data}")
            else:
                log_result("DELETE /api/admin/error-logs (single)", False, f"Expected 200, got {r.status_code}: {r.text}")
        except Exception as e:
            log_result("DELETE /api/admin/error-logs (single)", False, f"Exception: {str(e)}")

def test_logout(session):
    """Test logout"""
    print("\n=== TEST: Logout ===")
    
    if not session:
        print("⚠️  Skipping logout test - no authenticated session")
        return
    
    try:
        r = session.delete(f"{API_BASE}/admin-auth", timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get("ok"):
                log_result("DELETE /api/admin-auth (logout)", True, "Logged out successfully")
            else:
                log_result("DELETE /api/admin-auth (logout)", False, f"Unexpected response: {data}")
        else:
            log_result("DELETE /api/admin-auth (logout)", False, f"Expected 200, got {r.status_code}: {r.text}")
    except Exception as e:
        log_result("DELETE /api/admin-auth (logout)", False, f"Exception: {str(e)}")

def main():
    print("=" * 80)
    print("BREW EDGETECH BACKEND API TEST SUITE")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print(f"Admin User: {ADMIN_USERNAME}")
    print("=" * 80)
    
    # Run tests in order
    test_health()
    test_public_leads()
    test_public_content()
    error_id = test_error_logging()
    test_auth_negative()
    session = test_auth_positive()
    
    if session:
        test_content_cms(session)
        test_portfolio_crud(session)
        test_leads_crm(session)
        test_engagement(session)
        test_media(session)
        test_schedule_audit(session)
        test_error_logs_admin(session, error_id)
        test_logout(session)
    else:
        print("\n⚠️  WARNING: Could not establish authenticated session. Skipping admin tests.")
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {test_results['passed']}")
    print(f"❌ Failed: {test_results['failed']}")
    print(f"Total: {test_results['passed'] + test_results['failed']}")
    
    if test_results['failed'] > 0:
        print("\n" + "=" * 80)
        print("FAILED TESTS:")
        print("=" * 80)
        for error in test_results['errors']:
            print(f"  • {error}")
    
    print("\n" + "=" * 80)
    
    return test_results['failed'] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
