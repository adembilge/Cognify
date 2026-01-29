from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from ..models import Document, Collection, Note
from unittest.mock import patch, MagicMock
import os
import datetime

class UseCaseFulfillmentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='usecase_user', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.pdf_file = SimpleUploadedFile("research.pdf", b"pdf content", content_type="application/pdf")

    def test_uc_regeneration_on_correction(self):
        """Use case: Regenerate insights after manual correction."""
        doc = Document.objects.create(
            user=self.user, 
            title="Wrong OCR", 
            extracted_text="The sky is green.", 
            file=self.pdf_file
        )
        # Correct it
        self.client.post(f'/api/documents/documents/{doc.id}/save_correction/', {'text': 'The sky is blue.'})
        
        with patch('apps.documents.tasks.process_document_task.delay') as mock_task:
            # Regenerate
            response = self.client.post(f'/api/documents/documents/{doc.id}/regenerate/')
            self.assertEqual(response.status_code, 200)
            mock_task.assert_called_once_with(doc.id)

    def test_uc_move_between_collections(self):
        """Use case: Move document between folders without losing insights."""
        col1 = Collection.objects.create(user=self.user, name="Folder A")
        col2 = Collection.objects.create(user=self.user, name="Folder B")
        doc = Document.objects.create(
            user=self.user, 
            title="Entity", 
            file=self.pdf_file, 
            collection=col1,
            summary="Important summary"
        )
        
        # Move
        response = self.client.patch(f'/api/documents/documents/{doc.id}/', {'collection': col2.id})
        self.assertEqual(response.status_code, 200)
        doc.refresh_from_db()
        self.assertEqual(doc.collection, col2)
        self.assertEqual(doc.summary, "Important summary") # Preserved

    def test_uc_sorting_and_filtering(self):
        """Use case: Sort and filter by relevance, upload date, or length."""
        # Note: Relevance sorting is usually handled by DB SearchFilter or Semantic Search
        d1 = Document.objects.create(user=self.user, title="Short", file=self.pdf_file, word_count=10)
        d2 = Document.objects.create(user=self.user, title="Medium Content", file=self.pdf_file, word_count=100)
        d3 = Document.objects.create(user=self.user, title="Very Long Research", file=self.pdf_file, word_count=1000)

        # Sort by word count desc
        response = self.client.get('/api/documents/documents/?ordering=-word_count')
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(data[0]['title'], "Very Long Research")
        self.assertEqual(data[2]['title'], "Short")

    def test_uc_related_content_navigation(self):
        """Use case: Navigate through related documents through topic links."""
        d1 = Document.objects.create(user=self.user, title="AI Intro", file=self.pdf_file, embedding=[0.5]*384)
        d2 = Document.objects.create(user=self.user, title="Neural Nets", file=self.pdf_file, embedding=[0.51]*384)
        
        with patch('ai_pipeline.llm.semantic_search.SemanticSearch.compute_similarity') as mock_sim:
            mock_sim.return_value = [(d2.id, 0.95)]
            response = self.client.get(f'/api/documents/documents/{d1.id}/related/')
            self.assertEqual(len(response.data), 1)
            self.assertEqual(response.data[0]['id'], d2.id)

    def test_uc_bulk_deletion_folder(self):
        """Use case: Delete folder and all associated documents."""
        col = Collection.objects.create(user=self.user, name="Project X")
        Document.objects.create(user=self.user, title="Doc 1", file=self.pdf_file, collection=col)
        Document.objects.create(user=self.user, title="Doc 2", file=self.pdf_file, collection=col)
        
        # Delete collection
        self.client.delete(f'/api/documents/collections/{col.id}/')
        self.assertEqual(Document.objects.count(), 0) # Verified CASCADE behavior
        
    def test_uc_ocr_failure_and_retry(self):
        """Use case: Retry processing for a document that previously failed."""
        doc = Document.objects.create(user=self.user, title="Bad Doc", file=self.pdf_file, status="FAILED")
        
        with patch('apps.documents.tasks.process_document_task.delay') as mock_task:
            response = self.client.post(f'/api/documents/documents/{doc.id}/run_ocr/')
            self.assertEqual(response.status_code, 202)
            mock_task.assert_called_once_with(doc.id)

    def test_uc_lineage_comparison(self):
        """Use case: Compare different versions of the same document."""
        v1 = Document.objects.create(user=self.user, title="Thesis v1", file=self.pdf_file, version=1, summary="Start")
        v2 = Document.objects.create(user=self.user, title="Thesis v2", file=self.pdf_file, version=2, parent=v1, summary="End")
        
        response = self.client.get(f'/api/documents/documents/{v2.id}/lineage/')
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['summary'], "Start")
        self.assertEqual(response.data[1]['summary'], "End")
