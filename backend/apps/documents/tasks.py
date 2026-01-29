from celery import shared_task
from .services.processor import DocumentProcessingService

@shared_task
def process_document_task(document_id):
    """
    Background task to process a document (OCR + AI)
    """
    return DocumentProcessingService.process_document(document_id)
