import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
AUTH_URL = f"{BASE_URL}/auth"
DOCS_URL = f"{BASE_URL}/documents/"

def run_verification():
    print("🚀 Starting System Verification...")

    # 1. Register
    user_data = {
        "username": "verify_user",
        "email": "verify@example.com",
        "password": "StrongPassword123!"
    }
    print(f"1. Registering user {user_data['username']}...")
    res = requests.post(f"{AUTH_URL}/register/", data=user_data)
    if res.status_code == 201:
        print("   ✅ Registration Successful")
    elif res.status_code == 400 and "username" in res.json():
        print("   ⚠️ User already exists, proceeding to login.")
    else:
        print(f"   ❌ Registration Failed: {res.text}")
        return

    # 2. Login
    print("2. Logging in...")
    res = requests.post(f"{AUTH_URL}/login/", data={"username": user_data['username'], "password": user_data['password']})
    if res.status_code == 200:
        tokens = res.json()
        access_token = tokens['access']
        print("   ✅ Login Successful. Token acquired.")
    else:
        print(f"   ❌ Login Failed: {res.text}")
        return

    headers = {"Authorization": f"Bearer {access_token}"}

    # 3. Upload Document
    print("3. Uploading Test Document...")
    files = {'file': ('test_doc.txt', 'This is a test document for OCR verification.', 'text/plain')}
    data = {'title': 'Verification Doc'}
    res = requests.post(DOCS_URL, headers=headers, data=data, files=files)
    if res.status_code == 201:
        doc = res.json()
        doc_id = doc['id']
        print(f"   ✅ Upload Successful. Doc ID: {doc_id}")
    else:
        print(f"   ❌ Upload Failed: {res.text}")
        return

    # 4. Trigger OCR
    print(f"4. Triggering Intelligence Pipeline for Doc {doc_id}...")
    res = requests.post(f"{DOCS_URL}{doc_id}/run_ocr/", headers=headers)
    if res.status_code == 202:
        print("   ✅ Pipeline Triggered (Background Task Started).")
    else:
        print(f"   ❌ Trigger Failed: {res.text}")
        return

    # 5. Check Status (Polling)
    print("5. Polling for Completion...")
    for _ in range(5):
        time.sleep(1)
        res = requests.get(f"{DOCS_URL}{doc_id}/", headers=headers)
        doc = res.json()
        status = doc['status']
        print(f"   Current Status: {status}")
        if status == 'COMPLETED':
            print("   ✅ Processing Completed.")
            break
        if status == 'FAILED':
            print(f"   ❌ Processing Failed. Log: {doc.get('processing_log')}")
            break
    else:
        print("   ⚠️ Timed out waiting for completion.")

    # 6. Verify Content
    if doc.get('extracted_text') == 'This is a test document for OCR verification.': # Since logic handles .txt reading directly
        print("   ✅ Content Verification Passed: Text matches exactly.")
    else:
        print(f"   ⚠️ Content Verification: Extracted '{doc.get('extracted_text')}'")

    # 7. Check Analytics
    print("7. Checking Analytics Endpoint...")
    res = requests.get(f"{DOCS_URL}analytics/", headers=headers)
    if res.status_code == 200:
        stats = res.json()
        print(f"   ✅ Analytics Data Retrieved: {stats['total_documents']} total docs.")
    else:
        print(f"   ❌ Analytics Failed: {res.text}")

    print("\n🎉 System Verification Complete.")

if __name__ == "__main__":
    run_verification()
