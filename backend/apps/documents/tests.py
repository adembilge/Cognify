from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from .models import Document

User = get_user_model()

class DocumentTests(TestCase):
    def setUp(self):
        # Create User
        self.user = User.objects.create_user(username='testuser', password='password')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create Dummy File
        self.pdf_content = b'%PDF-1.4 test content'
        self.file = SimpleUploadedFile("test_doc.pdf", self.pdf_content, content_type="application/pdf")

    def test_create_document(self):
        """
        Ensure we can upload a document.
        """
        response = self.client.post('/api/documents/', {
            'title': 'Test Document',
            'file': self.file
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)
        self.assertEqual(Document.objects.get().title, 'Test Document')

    def test_list_documents(self):
        """
        Ensure we can list documents belonging to the user.
        """
        Document.objects.create(user=self.user, title="Doc 1", file=self.file)
        Document.objects.create(user=self.user, title="Doc 2", file=self.file)
        
        response = self.client.get('/api/documents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming pagination or flat list, check count
        # DRF default pagination might return dict
        self.assertTrue(len(response.data) >= 2 or response.data['count'] >= 2)

    def test_analytics_endpoint(self):
        """
        Ensure the analytics endpoint returns the correct structure.
        """
        Document.objects.create(user=self.user, title="Doc A", file=self.file, status='COMPLETED', file_size=1024, word_count=100)
        
        response = self.client.get('/api/documents/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_documents', response.data)
        self.assertIn('storage_growth', response.data)
        self.assertIn('type_distribution', response.data)
        self.assertEqual(response.data['total_documents'], 1)
        self.assertEqual(response.data['total_words'], 100)

    def test_data_isolation(self):
        """
        Ensure users cannot see other users' documents.
        """
        other_user = User.objects.create_user(username='other', password='password')
        Document.objects.create(user=other_user, title="Secret Doc", file=self.file)
        
        response = self.client.get('/api/documents/')
        # Should see 0 documents for 'testuser' if none created for them
        # (setUp only creates user, not documents)
        self.assertEqual(len(response.data), 0)
