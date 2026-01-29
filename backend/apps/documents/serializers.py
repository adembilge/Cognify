from rest_framework import serializers
from rest_framework import serializers
from .models import Document, Collection, Note

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class CollectionSerializer(serializers.ModelSerializer):
    document_count = serializers.IntegerField(source='documents.count', read_only=True)
    
    class Meta:
        model = Collection
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'
