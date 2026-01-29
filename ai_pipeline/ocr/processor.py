import os
import cv2
import pytesseract
from PIL import Image
import numpy as np
from pypdf import PdfReader

class OCRProcessor:
    def __init__(self, tesseract_cmd=None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def preprocess_image(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        return thresh

    def extract_text_from_image(self, image_path):
        try:
            # Robust check for Tesseract
            try:
                pytesseract.get_tesseract_version()
            except pytesseract.TesseractNotFoundError:
                return "[System System]: Tesseract OCR engine not found on host. \n\n(Simulation): This is a placeholder for extracted text. install Tesseract to see real results."

            processed_img = self.preprocess_image(image_path)
            text = pytesseract.image_to_string(processed_img)
            if not text.strip():
                text = pytesseract.image_to_string(Image.open(image_path))
            return text.strip()
        except Exception as e:
            return f"OCR Error: {e}"

    def extract_text_from_pdf(self, pdf_path):
        text = ""
        try:
            reader = PdfReader(pdf_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as e:
            return f"PDF Error: {e}"

    def process_file(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return self.extract_text_from_pdf(file_path)
        elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
            return self.extract_text_from_image(file_path)
        elif ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        return "Unsupported format"
