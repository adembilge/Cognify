import os
import tempfile
import datetime
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from ..models import Document, Collection, Note

class CognifyScenarioTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client.force_authenticate(user=self.user)
        self.collection = Collection.objects.create(user=self.user, name="Project Alpha")

    def test_scenario_1_landing_to_dashboard_logic(self):
        """A new user sees an empty dashboard."""
        response = self.client.get('/api/documents/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(data), 0)

    @patch('apps.documents.tasks.process_document_task.delay')
    def test_scenario_2_upload_and_processing_state(self, mock_task):
        """User uploads a PDF, sees it in processing."""
        file = SimpleUploadedFile("test.pdf", b"pdf content", content_type="application/pdf")
        response = self.client.post('/api/documents/documents/', {'title': 'My Research', 'file': file})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        doc_id = response.data['id']
        doc = Document.objects.get(id=doc_id)
        self.assertEqual(doc.status, 'PENDING')
        mock_task.assert_called_once()
        self.assertTrue(any(log['action'] == 'UPLOAD' for log in doc.audit_log))

    def test_scenario_4_correction_and_authoritative_logic(self):
        """User corrects text and it becomes authoritative."""
        doc = Document.objects.create(user=self.user, title="Scan", extracted_text="Low quality extraction", file="test.jpg")
        response = self.client.post(f'/api/documents/documents/{doc.id}/save_correction/', {'text': 'High quality logic'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.manual_text, 'High quality logic')
        self.assertTrue(doc.is_corrected)

    @patch('ai_pipeline.llm.qa.QuestionAnswering.answer_question')
    def test_scenario_8_single_doc_qa(self, mock_answer):
        """Single Doc Q&A logic."""
        mock_answer.return_value = {'answer': 'Model Answer', 'score': 0.9}
        doc = Document.objects.create(user=self.user, title="Policy", extracted_text="Some text", file="test.pdf")
        response = self.client.post(f'/api/documents/documents/{doc.id}/ask_question/', {'question': 'What?'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['answer'], 'Model Answer')

    def test_scenario_13_31_deletion_and_reset(self):
        """Deletion and Vault Clear."""
        doc = Document.objects.create(user=self.user, title="Temp", file="t.pdf")
        Note.objects.create(user=self.user, document=doc, content="Important note")
        
        # Scenario 13: Soft Delete
        self.client.delete(f'/api/documents/documents/{doc.id}/')
        self.assertEqual(Document.objects.filter(deleted_at__isnull=True).count(), 0)
        self.assertEqual(Document.objects.filter(deleted_at__isnull=False).count(), 1)
        
        # Scenario 31: Clear vault (Hard purge)
        self.client.post('/api/documents/documents/clear_vault/')
        self.assertEqual(Document.objects.count(), 0)

    @patch('apps.documents.tasks.process_document_task.delay')
    def test_scenario_14_versioning(self, mock_task):
        """Versioning lineage."""
        root = Document.objects.create(user=self.user, title="Manuscript", version=1, file="v1.pdf")
        file = SimpleUploadedFile("v2.pdf", b"v2 content")
        response = self.client.post(f'/api/documents/documents/{root.id}/upload_version/', {'file': file})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['version'], 2)
        self.assertEqual(response.data['parent'], root.id)

    def test_scenario_17_date_filter(self):
        """Date filtering."""
        past_date = timezone.now() - datetime.timedelta(days=10)
        doc = Document.objects.create(user=self.user, title="Old", file="old.pdf")
        Document.objects.filter(id=doc.id).update(uploaded_at=past_date)
        
        today = datetime.date.today().isoformat()
        response = self.client.get(f'/api/documents/documents/?start_date={today}')
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(data), 0)

    def test_scenario_25_bulk_export(self):
        """Bulk export CSV."""
        doc1 = Document.objects.create(user=self.user, title="Doc 1", file="d1.pdf")
        response = self.client.post('/api/documents/documents/export_bulk/', {'doc_ids': [doc1.id]})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')

    def test_scenario_11_tag_management(self):
        """Manual tag edits."""
        doc = Document.objects.create(user=self.user, title="AI Paper", file="ai.pdf")
        response = self.client.post(f'/api/documents/documents/{doc.id}/update_tags/', {'tags': ['Neural']}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        doc.refresh_from_db()
        self.assertEqual(doc.ai_insights['tags'], ['Neural'])

    def test_scenario_28_annotations(self):
        """Personal annotations (Notes)."""
        doc = Document.objects.create(user=self.user, title="Study", file="s.pdf")
        response = self.client.post('/api/documents/notes/', {'document': doc.id, 'content': 'My thoughts'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Note.objects.filter(document=doc).count(), 1)

    def test_scenario_36_soft_delete_and_restore(self):
        """Soft delete (trash) and recovery window logic."""
        doc = Document.objects.create(user=self.user, title="To Be Recovered", file="test.pdf")
        
        # 1. Delete (Trash)
        self.client.delete(f'/api/documents/documents/{doc.id}/')
        doc.refresh_from_db()
        self.assertIsNotNone(doc.deleted_at)
        
        # 2. Check it's hidden from normal view
        res = self.client.get('/api/documents/documents/')
        data = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertFalse(any(d['id'] == doc.id for d in data))
        
        # 3. Check it's in trash view
        res_trash = self.client.get('/api/documents/documents/?trash=true')
        data_trash = res_trash.data.get('results', res_trash.data) if isinstance(res_trash.data, dict) else res_trash.data
        self.assertTrue(any(d['id'] == doc.id for d in data_trash))
        
        # 4. Restore
        self.client.post(f'/api/documents/documents/{doc.id}/restore/')
        doc.refresh_from_db()
        self.assertIsNone(doc.deleted_at)

    def test_scenario_29_sensitive_analytics_exclusion(self):
        """Documents marked sensitive are excluded from global trends/counts."""
        Document.objects.create(user=self.user, title="Normal Doc", file="n.pdf", word_count=500, file_size=1000)
        Document.objects.create(user=self.user, title="Secret Doc", file="s.pdf", is_sensitive=True, word_count=5000, file_size=10000)
        
        res = self.client.get('/api/documents/documents/analytics/')
        self.assertEqual(res.data['total_documents'], 1)
        self.assertEqual(res.data['total_words'], 500)

    def test_scenario_13_suggested_questions(self):
        """Q&A provides follow-up guidance."""
        doc = Document.objects.create(user=self.user, title="Policy", extracted_text="The law is simple.", file="p.pdf")
        res = self.client.post(f'/api/documents/documents/{doc.id}/ask_question/', {'question': 'What is the law?'})
        self.assertIn('suggested_questions', res.data)
        self.assertTrue(len(res.data['suggested_questions']) > 0)

    def test_scenario_19_insight_bookmarking(self):
        """Specific notes/insights can be bookmarked separately."""
        doc = Document.objects.create(user=self.user, title="Project", file="p.pdf")
        note = Note.objects.create(user=self.user, document=doc, content="Crucial insight")
        
        res = self.client.post(f'/api/documents/notes/{note.id}/toggle_bookmark/')
        self.assertTrue(res.data['is_bookmarked'])
        note.refresh_from_db()
        self.assertTrue(note.is_bookmarked)
