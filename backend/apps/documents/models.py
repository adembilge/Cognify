from django.db import models
from django.contrib.auth.models import User

class Collection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Document(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING_OCR', 'Processing OCR'),
        ('PROCESSING_AI', 'Processing AI'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    file_type = models.CharField(max_length=20, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    
    # AI Results
    extracted_text = models.TextField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    ai_insights = models.JSONField(default=dict, blank=True)
    manual_tags = models.JSONField(default=list, blank=True)
    
    # Versioning
    version = models.IntegerField(default=1)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='versions')
    
    # Semantic Search
    embedding = models.JSONField(default=list, blank=True)
    
    # Advanced Features
    is_bookmarked = models.BooleanField(default=False)
    is_sensitive = models.BooleanField(default=False) # Scenario 29
    manual_text = models.TextField(blank=True, null=True)
    is_corrected = models.BooleanField(default=False)
    audit_log = models.JSONField(default=list, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True) # Scenario 36 (Recovery Window)
    
    # Metadata
    word_count = models.IntegerField(default=0)
    page_count = models.IntegerField(default=0)
    file_size = models.BigIntegerField(default=0)
    processing_log = models.JSONField(default=list, blank=True)

    def __str__(self):
        return self.title

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    is_bookmarked = models.BooleanField(default=False) # Scenario 19
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: support highlighting by storing start/end indices or text selection
    # For now, we'll keep it as general notes linked to the doc.
    quote = models.TextField(blank=True, null=True) # Text being referenced

    def __str__(self):
        return f"Note on {self.document.title} ({self.created_at.date()})"


