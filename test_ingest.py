import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_ingest_flow():
    email = "test_debug_final@example.com"
    password = "password123"
    
    # 1. Login to get token
    print(f"Logging in as {email}...")
    login_resp = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": email, "password": password}
    )
    
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
        
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")
    
    # 2. Try to ingest a document
    print("Attempting to ingest document...")
    doc_data = {
        "title": "Test Document",
        "content": "This is a test document content. It contains some information about the world."
    }
    
    ingest_resp = requests.post(
        f"{BASE_URL}/ingest/",
        json=doc_data,
        headers=headers
    )
    
    print(f"Ingest Status: {ingest_resp.status_code}")
    print(f"Ingest Response: {ingest_resp.text}")

if __name__ == "__main__":
    test_ingest_flow()
