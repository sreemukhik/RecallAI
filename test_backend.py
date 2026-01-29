import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def test_signup(email, password):
    print(f"Testing Signup for {email}...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": email, "password": password}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Signup Exception: {e}")
        return False

def test_login(email, password):
    print(f"Testing Login for {email}...")
    try:
        response = requests.post( # Login endpoint expects form data
            f"{BASE_URL}/auth/login",
            data={"username": email, "password": password}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Login Exception: {e}")
        return False

if __name__ == "__main__":
    email = "test_debug_final@example.com"
    password = "password123"
    
    # Try signup
    if test_signup(email, password):
        print("Signup successful")
    else:
        print("Signup failed")
        
    # Try login
    if test_login(email, password):
        print("Login successful")
    else:
        print("Login failed")
