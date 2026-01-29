import os
from ai_pipeline.ocr.processor import OCRProcessor
from ai_pipeline.llm.summarizer import Summarizer
from ai_pipeline.llm.classifier import ContentClassifier
from ai_pipeline.llm.semantic_search import SemanticSearch
from ..models import Document

class DocumentProcessingService:
    @staticmethod
    def process_document(document_id):
        try:
            doc = Document.objects.get(id=document_id)
            doc.status = 'PROCESSING_OCR'
            doc.save()

            file_path = doc.file.path
            processor = OCRProcessor()
            
            doc.processing_log.append({"step": "OCR_START", "timestamp": "now"}) # OCR Process
            extracted_text = processor.process_file(file_path)
            doc.extracted_text = extracted_text
            doc.status = 'PROCESSING_AI'
            doc.save()

            # AI Process (Summary & Tags)
            summarizer_llm = Summarizer()
            classifier_llm = ContentClassifier()
            
            doc.summary = summarizer_llm.summarize(extracted_text)
            tags = classifier_llm.classify(extracted_text)
            
            # Generate Embedding
            embedder = SemanticSearch()
            doc.embedding = embedder.generate_embedding(extracted_text[:1000]) # Embed first 1000 chars for speed/relevance
            
            doc.ai_insights = {
                "tags": tags,
                "model_used": f"Summarizer: {summarizer_llm.model_name} | Classifier: valhalla/distilbart-mnli-12-1",
                "confidence": 0.88 # Placeholder confidence for now, derived from classifier ideally
            }

            doc.status = 'COMPLETED'
            doc.word_count = len(extracted_text.split())
            doc.file_size = os.path.getsize(file_path)
            doc.file_type = os.path.splitext(file_path)[1][1:].upper()
            doc.processing_log.append({"step": "OCR_COMPLETED", "success": True})
            doc.save()
            return True
        except Exception as e:
            if 'doc' in locals():
                doc.status = 'FAILED'
                doc.processing_log.append({"step": "ERROR", "message": str(e)})
                doc.save()
            return False
