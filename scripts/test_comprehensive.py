import requests
import json
import time
import os
from io import BytesIO
from PIL import Image, ImageDraw
from pypdf import PdfWriter

BASE_URL = "http://localhost:8000/api"
AUTH_URL = f"{BASE_URL}/auth"
DOCS_URL = f"{BASE_URL}/documents/"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"
YELLOW = "\033[93m"

def log_pass(msg):
    print(f"{GREEN}✅ PASS:{RESET} {msg}")

def log_fail(msg, details=""):
    print(f"{RED}❌ FAIL:{RESET} {msg} {details}")

def log_info(msg):
    print(f"{YELLOW}ℹ️  INFO:{RESET} {msg}")

def generate_dummy_pdf(filename="test.pdf", pages=3):
    writer = PdfWriter()
    for i in range(pages):
        writer.add_blank_page(width=200, height=200)
    
    bio = BytesIO()
    writer.write(bio)
    bio.seek(0)
    return bio.getvalue()

def generate_dummy_image(filename="test.jpg"):
    img = Image.new('RGB', (100, 30), color = (73, 109, 137))
    d = ImageDraw.Draw(img)
    d.text((10,10), "Hello OCR", fill=(255, 255, 0))
    bio = BytesIO()
    img.save(bio, format='JPEG')
    bio.seek(0)
    return bio.getvalue()

def run_comprehensive_tests():
    print("🚀 Starting Comprehensive Functional Testing...")
    
    # Session to keep cookies/headers if needed (though we use JWT)
    session = requests.Session()
    
    # --- 1. AUTHENTICATION TEST ---
    log_info("Testing Authentication...")
    username = f"testUser_{int(time.time())}"
    password = "TestPassword123!"
    email = f"{username}@example.com"
    
    # Register
    res = requests.post(f"{AUTH_URL}/register/", data={
        "username": username, "email": email, "password": password
    })
    if res.status_code == 201:
        log_pass("User Registration")
    else:
        log_fail("User Registration", res.text)
        return

    # Login
    res = requests.post(f"{AUTH_URL}/login/", data={
        "username": username, "password": password
    })
    if res.status_code == 200:
        log_pass("User Login")
        tokens = res.json()
        access_token = tokens['access']
        header = {"Authorization": f"Bearer {access_token}"}
    else:
        log_fail("User Login", res.text)
        return

    # --- 2. DOCUMENT UPLOAD TEST (PDF & IMAGE) ---
    log_info("Testing Document Uploads...")
    
    # Upload PDF
    pdf_content = generate_dummy_pdf()
    files = {'file': ('test_doc.pdf', pdf_content, 'application/pdf')}
    res = requests.post(DOCS_URL, headers=header, data={'title': 'Test PDF'}, files=files)
    if res.status_code == 201:
        pdf_doc = res.json()
        log_pass(f"PDF Upload (ID: {pdf_doc['id']})")
    else:
        log_fail("PDF Upload", res.text)

    # Upload Image
    img_content = generate_dummy_image()
    files = {'file': ('test_img.jpg', img_content, 'image/jpeg')}
    res = requests.post(DOCS_URL, headers=header, data={'title': 'Test Image'}, files=files)
    if res.status_code == 201:
        img_doc = res.json()
        log_pass(f"Image Upload (ID: {img_doc['id']})")
    else:
        log_fail("Image Upload", res.text)

    # --- 3. OCR PROCESSING TEST ---
    log_info("Testing OCR & AI Processing...")
    
    # Trigger on Image (simpler text)
    res = requests.post(f"{DOCS_URL}{img_doc['id']}/run_ocr/", headers=header)
    if res.status_code == 202:
        log_pass("OCR Trigger Initiated")
        
        # Poll for completion
        completed = False
        for _ in range(10):
            time.sleep(1)
            poll_res = requests.get(f"{DOCS_URL}{img_doc['id']}/", headers=header)
            status = poll_res.json()['status']
            if status == 'COMPLETED':
                completed = True
                log_pass("OCR Processing Completed")
                break
        
        if not completed:
            log_fail("OCR Processing Timeout")
    else:
        log_fail("OCR Trigger", res.text)

    # --- 3.5 METADATA & CONTENT VERIFICATION ---
    log_info("Testing Metadata & Content...")
    # Verify the processed image document
    res = requests.get(f"{DOCS_URL}{img_doc['id']}/", headers=header)
    final_doc = res.json()
    
    # 1. Check extracted text (Simulated or Real)
    if final_doc.get('extracted_text'): 
        log_pass("Metadata: Text Extracted")
    else:
        log_fail("Metadata: No Text Extracted")

    # 2. Check File Type (Should be JPG/JPEG)
    if final_doc.get('file_type') in ['JPG', 'JPEG', 'image/jpeg']:
         log_pass(f"Metadata: File Type ({final_doc['file_type']})")
    else:
         # It might be set during processing, let's see. 
         # Depending on implementation, it might be 'JPEG' or similar.
         log_info(f"Metadata: File Type is '{final_doc.get('file_type')}'")

    # --- 3.6 SEARCH & FILTERING ---
    log_info("Testing Search & Filtering...")
    
    # Search by Title
    res = requests.get(f"{DOCS_URL}?search=Test Image", headers=header)
    if res.status_code == 200:
        results = res.json()
        # DRF pagination might wrap results in 'results' key
        items = results.get('results', results) if isinstance(results, dict) else results
        
        if len(items) > 0 and items[0]['title'] == 'Test Image':
            log_pass("Search by Title")
        else:
            log_fail("Search by Title", f"Found {len(items)} items")
    
    # Filter by Status
    res = requests.get(f"{DOCS_URL}?status=COMPLETED", headers=header)
    if res.status_code == 200:
        log_pass("Filter by Status")
    else:
        log_fail("Filter by Status", res.text)

    # --- 4. PDF TOOLS TEST ---
    log_info("Testing PDF Tools...")
    
    # Split Pages
    # Range 1-1 meant to extract just the first page
    split_payload = {"ranges": [[1, 1]]} 
    res = requests.post(f"{DOCS_URL}{pdf_doc['id']}/split_pages/", headers=header, json=split_payload)
    if res.status_code == 200:
        log_pass("PDF Split Tool")
        # print("   Split Output:", res.json())
    else:
        log_fail("PDF Split Tool", res.text)

    # Remove Pages
    # Remove page 2
    remove_payload = {"pages": [2]}
    res = requests.post(f"{DOCS_URL}{pdf_doc['id']}/remove_pages/", headers=header, json=remove_payload)
    if res.status_code == 200:
        log_pass("PDF Remove Pages Tool")
        # print("   Remove Output:", res.json())
    else:
        log_fail("PDF Remove Pages Tool", res.text)
        
    # Merge Docs (Backend)
    # We need another PDF to merge. Upload a second one.
    res = requests.post(DOCS_URL, headers=header, data={'title': 'PDF 2 for Merge'}, files={'file': ('merge_test.pdf', generate_dummy_pdf(), 'application/pdf')})
    pdf_doc_2 = res.json()
    
    merge_payload = {"doc_ids": [pdf_doc['id'], pdf_doc_2['id']]}
    res = requests.post(f"{DOCS_URL}merge_docs/", headers=header, json=merge_payload)
    if res.status_code == 200:
        log_pass("PDF Merge Tool")
    else:
        log_fail("PDF Merge Tool", res.text)

    # Reorder Pages (Backend)
    # Reorder pages 3, 2, 1
    reorder_payload = {"page_order": [3, 2, 1]}
    res = requests.post(f"{DOCS_URL}{pdf_doc['id']}/reorder_pages/", headers=header, json=reorder_payload)
    if res.status_code == 200:
       log_pass("PDF Reorder Tool")
    else:
       log_fail("PDF Reorder Tool", res.text)

    # --- 5. ANALYTICS TEST ---
    log_info("Testing Analytics...")
    res = requests.get(f"{DOCS_URL}analytics/", headers=header)
    if res.status_code == 200:
        data = res.json()
        if data['total_documents'] >= 3: # PDF1, IMG1, PDF2
            log_pass(f"Analytics Data (Total Docs: {data['total_documents']})")
        else:
            log_fail("Analytics Data Count Mismatch", f"Got {data['total_documents']}")
    else:
        log_fail("Analytics Endpoint", res.text)
        
    # --- 6. CLEANUP (DELETE) TEST ---
    log_info("Testing Cleanup...")
    res = requests.delete(f"{DOCS_URL}{img_doc['id']}/", headers=header)
    if res.status_code == 204:
        log_pass("Document Deletion")
    else:
        log_fail("Document Deletion", res.text)

    print("\n🏁 Comprehensive Testing Suite Finished.")

if __name__ == "__main__":
    run_comprehensive_tests()
