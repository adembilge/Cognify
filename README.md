# Cognify PKM: The Intelligent Knowledge Vault

Cognify is a professional-grade, AI-powered Personal Knowledge Management (PKM) system built with modern engineering practices. It handles everything from OCR extraction to LLM-powered insights, all within a premium, high-performance interface.

## 💎 Core Features

-   **Intelligent Ingestion**: Upload PDFs, Scanned Images, and Text. Automatic processing via OpenCV and Tesseract OCR.
-   **AI Exploration Layer**: LLM-powered summarization, topic classification, and entity extraction.
-   **Knowledge Analytics**: Real-time data visualization of your library's growth and processing health using Recharts and Pandas.
-   **PDF Intelligence Toolkit**: Visual tools to Split, Merge, Redact, and Reorganize PDF sources.
-   **Security & Privacy**: Secure JWT authentication with User-level data isolation.
-   **Observability**: Integrated Prometheus monitoring for system performance tracking.
-   **Containerized**: Full Docker and Docker-Compose support for clean, reproducible deployments.

## 📁 Repository Structure
```text
cognify/
├── ai_pipeline/       # OCR (OpenCV) & LLM (HuggingFace) modules
├── backend/           # Django REST Framework + Celery Workers
├── frontend/          # Next.js 15 (App Router) + Framer Motion
├── infra/             # Prometheus & Monitoring config
├── docker-compose.yml # Full stack orchestration
└── README.md
```

## 🚀 Quick Start (Docker - Recommended)

```bash
docker-compose up --build
```
-   **Frontend**: `http://localhost:3000`
-   **Backend**: `http://localhost:8000`
-   **Monitoring**: `http://localhost:9090` (Prometheus)

## 🛠 Manual Setup

### Backend (Django)
1.  **Virtual Environment**: 
    - Windows: `.\venv\Scripts\activate`
    - Unix/macOS: `source venv/bin/activate`
    - *(Note: A virtual environment `venv` already exists in the project root)*
2.  **Dependencies**: `pip install -r backend/requirements.txt`
3.  **Database**: `cd backend && python manage.py migrate`
4.  **Task Queue**: Ensure Redis is running, then `celery -A config worker -l info`
5.  **Run**: `python manage.py runserver`

### Frontend (Next.js)
1. **Deps**: `cd frontend && npm install`
2. **Run**: `npm run dev`

## 🧠 AI Pipeline Details
-   **OCR**: Tesseract 5.0 + OpenCV Pre-processing (Grayscale, Deskeewing, Noise Reduction).
-   **LLM**: BART/T5 models for summarization (Simulation layer included).
-   **Analytics**: Aggregated via Pandas `DataFrame` operations in the Django service layer.

## 🔒 Security
Cognify uses SQLite for data storage and JWT tokens for secure, stateless authentication. Every document is strictly tied to the user profile that uploaded it.
