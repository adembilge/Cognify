from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from apps.documents.models import Document, Collection, Note
from unittest.mock import patch, MagicMock
import json
import datetime

class RequirementVerificationTests(TestCase):
    def setUp(self):
        # User 1 (Main test user)
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # User 2 (For isolation tests)
        self.other_user = User.objects.create_user(username='otheruser', password='password123')
        self.other_client = APIClient()
        self.other_client.force_authenticate(user=self.other_user)

        # Common Test Data
        self.pdf_file = SimpleUploadedFile("test.pdf", b"file_content", content_type="application/pdf")

    # --- Req 1: Account, Auth, Workspace Isolation ---
    def test_req_01_auth_and_isolation(self):
        """Verify user can auth and only see their own assets."""
        # Create doc for User 1
        doc1 = Document.objects.create(user=self.user, title="User 1 Doc", file=self.pdf_file)
        # Create doc for User 2
        doc2 = Document.objects.create(user=self.other_user, title="User 2 Doc", file=self.pdf_file)

        # User 1 requests documents
        response = self.client.get('/api/documents/documents/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "User 1 Doc")
        
        # User 2 requests documents
        response = self.other_client.get('/api/documents/documents/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "User 2 Doc")

    # --- Req 2 & 3: Uploads & Metadata ---
    def test_req_02_03_upload_and_metadata(self):
        """Verify upload of different formats and metadata storage."""
        data = {'title': 'Test PDF', 'file': self.pdf_file}
        response = self.client.post('/api/documents/documents/', data, format='multipart')
        self.assertEqual(response.status_code, 201)
        
        doc = Document.objects.get(id=response.data['id'])
        self.assertEqual(doc.title, 'Test PDF')
        self.assertTrue(doc.uploaded_at is not None)
        # Check processing status tracking (REQ 25)
        self.assertIn(doc.status, ['PENDING', 'PROCESSING_OCR', 'PROCESSING_AI', 'COMPLETED'])

    # --- Req 4: Organization (Collections) ---
    def test_req_04_organization(self):
        """Verify creation of collections and assigning documents."""
        # Create Collection
        col = Collection.objects.create(user=self.user, name="Research Project")
        
        # Create Doc in Collection
        doc = Document.objects.create(user=self.user, title="Org Doc", file=self.pdf_file, collection=col)
        
        self.assertEqual(doc.collection.name, "Research Project")
        self.assertEqual(col.documents.count(), 1)

    # --- Req 5: Tags (Manual & Auto) ---
    def test_req_05_tagging(self):
        """Verify manual tagging and storage for auto-generated tags."""
        doc = Document.objects.create(
            user=self.user, 
            title="Tagged Doc", 
            file=self.pdf_file,
            manual_tags=['finance', 'Q1'],
            ai_insights={'tags': ['auto-generated-1', 'auto-generated-2']}
        )
        
        self.assertIn('finance', doc.manual_tags)
        self.assertIn('auto-generated-1', doc.ai_insights['tags'])

    # --- Req 6: Versioning ---
    def test_req_06_versioning(self):
        """Verify versioning fields exist and work."""
        parent = Document.objects.create(user=self.user, title="Original v1", file=self.pdf_file, version=1)
        child = Document.objects.create(user=self.user, title="Updated v2", file=self.pdf_file, version=2, parent=parent)
        
        self.assertEqual(child.parent, parent)
        self.assertEqual(parent.versions.first(), child)

    # --- Req 7 & 8 & 9: OCR, Semantic Type, Summaries (Mocked) ---
    def test_req_07_08_09_processing_results(self):
        """Verify storage of extracted text, summaries, and types."""
        doc = Document.objects.create(
            user=self.user, 
            title="Processed Doc", 
            file=self.pdf_file,
            extracted_text="This is the content.",
            summary="This is the summary.",
            ai_insights={'semantic_type': 'Research Paper'}
        )
        
        self.assertEqual(doc.extracted_text, "This is the content.")
        self.assertEqual(doc.summary, "This is the summary.")
        self.assertEqual(doc.ai_insights['semantic_type'], 'Research Paper')

    # --- Req 10 & 11: QA (Single/Multi) ---
    @patch('ai_pipeline.llm.qa.QuestionAnswering.answer_question')
    def test_req_10_single_qa(self, mock_qa):
        """Verify single document QA endpoint."""
        doc = Document.objects.create(user=self.user, title="QA Doc", file=self.pdf_file, extracted_text="Context")
        mock_qa.return_value = {'answer': 'Test Answer', 'score': 0.9}
        
        response = self.client.post(f'/api/documents/documents/{doc.id}/ask_question/', {'question': 'What?'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['answer'], 'Test Answer')

    @patch('ai_pipeline.llm.semantic_search.SemanticSearch.generate_embedding')
    @patch('ai_pipeline.llm.semantic_search.SemanticSearch.compute_similarity')
    @patch('ai_pipeline.llm.qa.QuestionAnswering.answer_question')
    def test_req_11_global_qa(self, mock_qa, mock_sim, mock_emb):
        """Verify multi-document QA endpoint."""
        Document.objects.create(user=self.user, title="Global Doc", file=self.pdf_file, embedding=[0.1]*384, extracted_text="Global Context")
        
        mock_emb.return_value = [0.1]*384
        mock_sim.return_value = [(1, 0.9)] # Id 1, score 0.9
        mock_qa.return_value = {'answer': 'Global Answer', 'score': 0.9}
        
        response = self.client.post('/api/documents/documents/global_chat/', {'question': 'Everything?'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['answer'], 'Global Answer')
        self.assertEqual(len(response.data['sources']), 1) # Req 28 (Tracing)

    # --- Req 13: Search ---
    def test_req_13_search(self):
        """Verify search functionality."""
        Document.objects.create(user=self.user, title="Alpha Document", file=self.pdf_file)
        Document.objects.create(user=self.user, title="Beta Document", file=self.pdf_file)
        
        response = self.client.get('/api/documents/documents/search/?q=Alpha&semantic=false')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "Alpha Document")

    # --- Req 14 - 18: Dashboard & Charts ---
    def test_req_14_to_18_analytics_data(self):
        """Verify analytics endpoint returns required chart data structure."""
        Document.objects.create(user=self.user, title="Doc A", file=self.pdf_file, file_type="PDF", file_size=1024, uploaded_at=datetime.datetime.now())
        
        response = self.client.get('/api/documents/documents/analytics/')
        self.assertEqual(response.status_code, 200)
        data = response.data
        
        # Req 15: Distribution by type
        self.assertIn('type_distribution', data)
        # Req 17: Growth trends
        self.assertIn('storage_growth', data)
        self.assertIn('upload_trend', data)
        # Req 16: Topic/Status distribution
        self.assertIn('status_distribution', data)

    # --- Req 22: Export ---
    def test_req_22_export(self):
        """Verify export functionality."""
        Document.objects.create(user=self.user, title="Exportable", file=self.pdf_file)
        response = self.client.get('/api/documents/documents/export_analytics/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')

    # --- Req 23: Notes/Annotations ---
    def test_req_23_notes(self):
        """Verify notes creation."""
        doc = Document.objects.create(user=self.user, title="Note Doc", file=self.pdf_file)
        response = self.client.post('/api/documents/notes/', {'document': doc.id, 'content': 'My annotation'})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Note.objects.count(), 1)

    # --- Req 25: Feedback ---
    def test_req_25_feedback(self):
        """Verify status field for feedback."""
        doc = Document.objects.create(user=self.user, title="Pending Doc", file=self.pdf_file, status="PROCESSING_OCR")
        self.assertEqual(doc.status, "PROCESSING_OCR")

    # --- Req 28: Tracing ---
    def test_req_28_implements_tracing(self):
        """Verify Note and Document relationship for tracing."""
        doc = Document.objects.create(user=self.user, title="Source Doc", file=self.pdf_file)
        note = Note.objects.create(user=self.user, document=doc, content="Insight")
        self.assertEqual(note.document, doc) # Can trace note back to doc

