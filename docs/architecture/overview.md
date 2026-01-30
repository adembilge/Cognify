# System Architecture - Cognify PKM

## Overview
Cognify is a modular, AI-powered Personal Knowledge Management (PKM) system designed to process unstructured data (PDFs, images, slides) into structured, searchable, and actionable knowledge.

## High-Level Components

### 1. Frontend (Next.js)
- **Framework**: Next.js 14+ with App Router.
- **Styling**: Tailwind CSS for a modern, responsive dashboard aesthetic.
- **Features**: 
    - Document management dashboard.
    - AI-powered search and Q&A interface.
    - Analytics visualization (using Recharts/Visx).

### 2. Backend (Django + DRF)
- **Framework**: Django 5.0+ with Django REST Framework.
- **Responsibility**: State management, business logic, and orchestration.
- **Async Processing**: Integrated with Celery and Redis to handle long-running AI tasks without blocking the user interface.
- **Database**: 
    - **Primary Storage**: SQLite (used for both development and production for simplicity).
    - **Vector Store**: JSON-based storage for embeddings within SQLite.

### 3. AI Pipeline (Standalone Module)
- **Philosophy**: Stateless, independently testable Python package.
- **Modules**:
    - **OCR**: Image preprocessing and text extraction.
    - **Classification**: PyTorch models to categorize knowledge.
    - **NLP/LLM**: Summarization, key extraction, and Question Answering.
    - **Analytics**: Numerical processing and trend detection.

## Design Principles
- **Separation of Concerns**: Core AI logic is decouple from the web framework.
- **Modularity**: Components (like the OCR engine) can be swapped with minimal impact.
- **Scalability**: Designed to be containerized and scaled across multiple worker nodes.

## Data Flow
1. **Ingestion**: User uploads a file via the Frontend.
2. **Storage**: Backend saves the raw file and creates a 'PENDING' metadata record.
3. **Orchestration**: A background task is triggered.
4. **Processing**: AI Pipeline extracts text, classifies the document, and generates insights.
5. **Update**: Outcomes are stored in the database, and the document status is updated to 'COMPLETED'.
6. **Insight**: User views the dashboard, seeing updated analytics and summaries.
