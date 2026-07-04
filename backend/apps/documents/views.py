from rest_framework import viewsets, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Document, Collection, Note
from .serializers import DocumentSerializer, CollectionSerializer, NoteSerializer
from .services.processor import DocumentProcessingService
from .services.processor import DocumentProcessingService
from django.db.models import Case, When
import os

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['document']

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_bookmark(self, request, pk=None):
        note = self.get_object()
        note.is_bookmarked = not note.is_bookmarked
        note.save()
        return Response({'is_bookmarked': note.is_bookmarked})

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'file_type']
    search_fields = ['title', 'extracted_text']
    ordering_fields = ['uploaded_at', 'title', 'file_size', 'word_count', 'page_count']

    def get_queryset(self):
        show_trash = self.request.query_params.get('trash', 'false').lower() == 'true'
        queryset = Document.objects.filter(user=self.request.user)
        
        if show_trash:
            queryset = queryset.filter(deleted_at__isnull=False)
        else:
            queryset = queryset.filter(deleted_at__isnull=True)

        # Date Filtering (Req 17)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(uploaded_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(uploaded_at__date__lte=end_date)
        return queryset.order_by('-uploaded_at')

    def perform_destroy(self, instance):
        # Scenario 36: Soft Delete Logic
        import datetime
        instance.deleted_at = datetime.datetime.now()
        instance.save()
        self.log_event(instance, "TRASH", "Document moved to recovery window.")

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        # Scenario 36: Restore Logic
        doc = Document.objects.filter(user=request.user, pk=pk).first()
        if doc and doc.deleted_at:
            doc.deleted_at = None
            doc.save()
            self.log_event(doc, "RESTORE", "Document restored from recovery window.")
            return Response({'status': 'Restored'})
        return Response({'error': 'Document not in trash'}, status=400)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        self.log_event(instance, "UPLOAD", "Document ingestion initiated.")
        from .tasks import process_document_task
        process_document_task.delay(instance.id)

    def log_event(self, doc, action, detail):
        import datetime
        event = {
            'timestamp': datetime.datetime.now().isoformat(),
            'action': action,
            'detail': detail
        }
        if not doc.audit_log:
            doc.audit_log = []
        doc.audit_log.append(event)
        doc.save(update_fields=['audit_log'])

    @action(detail=True, methods=['post'])
    def run_ocr(self, request, pk=None):
        document = self.get_object()
        self.log_event(document, "OCR_START", "AI pipeline requested for entity.")
        from .tasks import process_document_task
        process_document_task.delay(document.id)
        return Response({'status': 'Background processing initiated'}, status=status.HTTP_202_ACCEPTED)
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        import pandas as pd
        # Scenario 29: Exclude sensitive from global analytics
        queryset = self.get_queryset().filter(is_sensitive=False, deleted_at__isnull=True)
        if not queryset.exists():
            return Response({
                'total_documents': 0,
                'total_storage': 0,
                'total_words': 0,
                'status_distribution': {},
                'upload_trend': [],
                'storage_growth': [],
                'type_distribution': []
            })
            
        df = pd.DataFrame(list(queryset.values('uploaded_at', 'status', 'file_type', 'file_size', 'word_count', 'ai_insights')))
        df['date'] = df['uploaded_at'].dt.date
        
        # 1. Status Distribution
        status_dist = df['status'].value_counts().to_dict()
        
        # 2. Upload Trend (Daily Count)
        trend = df.groupby('date').size().reset_index()
        trend.columns = ['date', 'count']
        trend['date'] = trend['date'].apply(lambda x: x.strftime('%Y-%m-%d'))
        
        # 3. Storage Growth (Cumulative MB)
        storage_trend = df.groupby('date')['file_size'].sum().cumsum().reset_index()
        storage_trend.columns = ['date', 'size_bytes']
        storage_trend['size_mb'] = (storage_trend['size_bytes'] / (1024 * 1024)).round(2)
        storage_trend['date'] = storage_trend['date'].apply(lambda x: x.strftime('%Y-%m-%d'))
        
        # 4. File Type Distribution (Formatted for Recharts)
        type_counts = df['file_type'].value_counts()
        type_dist = [{'name': k, 'value': v} for k, v in type_counts.items()]

        # 5. Topic Distribution (Req 16/20)
        all_tags = []
        for doc in queryset:
            tags = doc.ai_insights.get('tags', []) if doc.ai_insights else []
            all_tags.extend(tags)
        
        from collections import Counter
        topic_counts = Counter(all_tags)
        topic_dist = [{'name': k, 'value': v} for k, v in topic_counts.most_common(10)]

        # 6. Global Audit Log / Health (Req 47/48)
        global_logs = []
        for doc in queryset:
            if doc.audit_log:
                doc_logs = [{**l, 'doc_title': doc.title, 'doc_id': doc.id} for l in doc.audit_log]
                global_logs.extend(doc_logs)
        
        # Sort by timestamp desc
        global_logs = sorted(global_logs, key=lambda x: x['timestamp'], reverse=True)[:50]

        # 7. Topic Evolution (Req 45)
        topic_evolution = []
        # Get top 3 topics first
        top_topics = [t['name'] for t in topic_dist[:3]]
        
        # We need a time series of counts for these top topics
        # We can reuse the df dates
        if not df.empty:
            for topic in top_topics:
                # Portable in-memory filtering for SQLite compatibility
                topic_series = df[df['ai_insights'].apply(lambda x: isinstance(x, dict) and topic in x.get('tags', []))]
                for date in sorted(df['date'].unique()):
                    count = len(topic_series[topic_series['date'] == date])
                    topic_evolution.append({
                        'date': date.strftime('%Y-%m-%d'),
                        'topic': topic,
                        'count': count
                    })
        
        # 8. "Since Last Visit" Highlights (Scenario 27)
        since_ts = request.query_params.get('since')
        recent_highlights = []
        if since_ts:
            try:
                since_date = datetime.datetime.fromisoformat(since_ts)
                recent_docs = queryset.filter(uploaded_at__gt=since_date).order_by('-uploaded_at')[:5]
                recent_highlights = DocumentSerializer(recent_docs, many=True).data
            except:
                pass

        return Response({
            'total_documents': len(df),
            'total_storage': df['file_size'].sum(),
            'total_words': df['word_count'].sum(),
            'status_distribution': status_dist,
            'upload_trend': trend.to_dict(orient='records'),
            'storage_growth': storage_trend[['date', 'size_mb']].to_dict(orient='records'),
            'type_distribution': type_dist,
            'topic_distribution': topic_dist,
            'topic_evolution': topic_evolution,
            'activity_feed': global_logs,
            'recent_highlights': recent_highlights
        })

    @action(detail=True, methods=['post'])
    def split_pages(self, request, pk=None):
        from .services.pdf_tools import PDFToolsService
        document = self.get_object()
        ranges = request.data.get('ranges', []) # List of [start, end]
        output_dir = os.path.dirname(document.file.path)
        
        generated_paths = PDFToolsService.split_pdf(document.file.path, ranges, output_dir)
        
        # In a real app, we'd create new Document objects for these
        return Response({'status': 'Split completed', 'files': [os.path.basename(p) for p in generated_paths]})

    @action(detail=True, methods=['post'])
    def remove_pages(self, request, pk=None):
        from .services.pdf_tools import PDFToolsService
        document = self.get_object()
        pages = request.data.get('pages', []) # List of page numbers
        output_path = document.file.path.replace('.pdf', '_edited.pdf')
        
        PDFToolsService.remove_pages(document.file.path, pages, output_path)
        return Response({'status': 'Pages removed', 'new_file': os.path.basename(output_path)})

    @action(detail=False, methods=['post'])
    def clear_vault(self, request):
        """Permanent removal of all user data."""
        docs = Document.objects.filter(user=request.user)
        count = docs.count()
        docs.delete()
        return Response({'status': 'Vault cleared', 'removed_count': count})

    @action(detail=False, methods=['post'])
    def merge_docs(self, request):
        from .services.pdf_tools import PDFToolsService
        doc_ids = request.data.get('doc_ids', [])
        documents = Document.objects.filter(id__in=doc_ids, user=request.user)
        if not documents:
            return Response({'error': 'No documents found'}, status=400)
            
        paths = [d.file.path for d in documents]
        output_path = os.path.join(os.path.dirname(paths[0]), 'merged_output.pdf')
        
        PDFToolsService.merge_pdfs(paths, output_path)
        return Response({'status': 'Merge completed', 'new_file': 'merged_output.pdf'})

    @action(detail=True, methods=['post'])
    def reorder_pages(self, request, pk=None):
        from .services.pdf_tools import PDFToolsService
        document = self.get_object()
        page_order = request.data.get('page_order', []) # List of page numbers
        output_path = document.file.path.replace('.pdf', '_reordered.pdf')
        
        PDFToolsService.reorder_pages(document.file.path, page_order, output_path)
        return Response({'status': 'Pages reordered', 'new_file': os.path.basename(output_path)})

    @action(detail=True, methods=['post'])
    def ask_question(self, request, pk=None):
        from ai_pipeline.llm.qa import QuestionAnswering
        document = self.get_object()
        question = request.data.get('question')
        
        if not document.extracted_text:
            return Response({'error': 'Document content not indexed. Run OCR first.'}, status=400)
            
        qa_model = QuestionAnswering()
        result = qa_model.answer_question(question, document.extracted_text)
        self.log_event(document, "QUERY", f"Question asked: {question[:50]}")
        
        # Ensure result is a dict for consistency
        if isinstance(result, str):
            result = {'answer': result}
        
        # Scenario 13/14: Suggested follow-ups
        suggested = [
            f"Can you elaborate on {result.get('answer', 'the topic')[:20]}...?",
            "How does this relate to the previous section?",
            "What are the key takeaways here?"
        ]
        
        return Response({**result, 'suggested_questions': suggested})

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Semantic search endpoint.
        Usage: /api/documents/search/?q=neural networks&semantic=true
        """
        query = request.query_params.get('q', '')
        tag = request.query_params.get('tag', None)
        use_semantic = request.query_params.get('semantic', 'false').lower() == 'true'
        
        # Topic Drill-down (Req 43)
        if tag:
            # SQLite workaround for __contains in JSON
            all_docs = self.get_queryset()
            relevant_ids = [d.id for d in all_docs if d.ai_insights and tag in d.ai_insights.get('tags', [])]
            queryset = Document.objects.filter(id__in=relevant_ids)
            return Response(DocumentSerializer(queryset, many=True).data)

        if not query:
            return Response([])

        if use_semantic:
            from ai_pipeline.llm.semantic_search import SemanticSearch
            
            # Get all docs for user that have embeddings
            docs = Document.objects.filter(user=request.user).exclude(embedding=[])
            if not docs.exists():
                 # Fallback to standard search if no embeddings
                 return Response(DocumentSerializer(Document.objects.filter(user=request.user, title__icontains=query), many=True).data)

            # Prepare data for computation
            doc_embeddings = [(d.id, d.embedding) for d in docs]
            
            searcher = SemanticSearch()
            query_embedding = searcher.generate_embedding(query)
            
            # Compute similarity
            results = searcher.compute_similarity(query_embedding, doc_embeddings)
            
            # Filter results > threshold (e.g. 0.3) and get Django objects
            relevant_ids = [doc_id for doc_id, score in results if score > 0.25]
            
            # Preserve order
            preserved_order = Case(*[When(pk=pk, then=pos) for pos, pk in enumerate(relevant_ids)])
            queryset = Document.objects.filter(pk__in=relevant_ids).order_by(preserved_order)
            
            serializer = DocumentSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            # Standard exact match
            queryset = Document.objects.filter(user=request.user, title__icontains=query)
            serializer = DocumentSerializer(queryset, many=True)
            serializer = DocumentSerializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def global_chat(self, request):
        """
        Retrieval Augmented Generation (RAG) endpoint.
        """
        question = request.data.get('question')
        if not question:
            return Response({'error': 'Question is required'}, status=400)
            
        from ai_pipeline.llm.semantic_search import SemanticSearch
        from ai_pipeline.llm.qa import QuestionAnswering

        # 1. Retrieval
        docs = Document.objects.filter(user=request.user).exclude(embedding=[])
        doc_embeddings = [(d.id, d.embedding) for d in docs]
        
        searcher = SemanticSearch()
        query_embedding = searcher.generate_embedding(question)
        results = searcher.compute_similarity(query_embedding, doc_embeddings)
        
        # Get top 3 relevant docs
        top_doc_ids = [r[0] for r in results[:3] if r[1] > 0.2]
        
        if not top_doc_ids:
             return Response({
                 'answer': 'I could not find enough relevant context in your vault to answer this.',
                 'sources': []
             })
             
        # 2. Context Construction
        relevant_docs = Document.objects.filter(id__in=top_doc_ids)
        # Combine summaries or text. For better accuracy, use extracted text, 
        # but truncate to fit model limits.
        context_parts = []
        sources = []
        for doc in relevant_docs:
            snippet = doc.extracted_text[:1000] if doc.extracted_text else (doc.summary or "")
            context_parts.append(f"Source ({doc.title}): {snippet}")
            sources.append({'id': doc.id, 'title': doc.title})
            
        full_context = "\n\n".join(context_parts)
        
        # 3. Generation / Extraction
        qa_model = QuestionAnswering()
        result = qa_model.answer_question(question, full_context)
        
        suggested = [
            "Explain this in more detail.",
            "Find more documents related to this.",
            "Summarize the key differences between these sources."
        ]
        
        return Response({
            'answer': result.get('answer', 'No answer found.'),
            'score': result.get('score', 0),
            'sources': sources,
            'suggested_questions': suggested
        })

    @action(detail=True, methods=['post'])
    def toggle_sensitive(self, request, pk=None):
        doc = self.get_object()
        doc.is_sensitive = not doc.is_sensitive
        doc.save()
        self.log_event(doc, "PRIVACY_TOGGLE", f"Sensitive flag set to {doc.is_sensitive}")
        return Response({'is_sensitive': doc.is_sensitive})

    @action(detail=False, methods=['get'])
    def export_analytics(self, request):
        """
        Export analytics data as CSV.
        """
        import pandas as pd
        from django.http import HttpResponse
        
        queryset = self.get_queryset()
        if not queryset.exists():
            return Response({'error': 'No data to export'}, status=400)
            
        # Create DataFrame
        data = list(queryset.values('title', 'uploaded_at', 'status', 'file_type', 'file_size', 'word_count'))
        df = pd.DataFrame(data)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="cognify_analytics_report.csv"'
        
        df.to_csv(path_or_buf=response, index=False)
        return response

    @action(detail=False, methods=['post'])
    def export_bulk(self, request):
        import pandas as pd
        from django.http import HttpResponse
        
        doc_ids = request.data.get('doc_ids', [])
        queryset = self.get_queryset().filter(id__in=doc_ids)
        
        if not queryset.exists():
            return Response({'error': 'No documents selected'}, status=400)
            
        data = []
        for doc in queryset:
            data.append({
                'ID': doc.id,
                'Title': doc.title,
                'Type': doc.file_type,
                'Uploaded At': doc.uploaded_at.strftime('%Y-%m-%d %H:%M'),
                'Status': doc.status,
                'Word Count': doc.word_count,
                'Summary': doc.summary or '',
                'Tags': ", ".join(doc.ai_insights.get('tags', [])) if doc.ai_insights else ''
            })
            
        df = pd.DataFrame(data)
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="cognify_bulk_export.csv"'
        df.to_csv(path_or_buf=response, index=False)
        return response

    @action(detail=True, methods=['post'])
    def bookmark(self, request, pk=None):
        document = self.get_object()
        document.is_bookmarked = not document.is_bookmarked
        self.log_event(document, "BOOKMARK", f"Bookmark toggled: {document.is_bookmarked}")
        document.save()
        return Response({'is_bookmarked': document.is_bookmarked})

    @action(detail=True, methods=['post'])
    def save_correction(self, request, pk=None):
        document = self.get_object()
        document.manual_text = request.data.get('text')
        document.is_corrected = True
        self.log_event(document, "CORRECTION", "Manual authoritative text correction saved.")
        document.save()
        return Response({'status': 'Correction saved as authoritative'})

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        document = self.get_object()
        from .tasks import process_document_task
        document.status = 'PENDING'
        document.save()
        process_document_task.delay(document.id)
        return Response({'status': 'Regeneration initiated'})

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        """Find related documents based on embedding similarity."""
        document = self.get_object()
        if not document.embedding:
            return Response([])

        from ai_pipeline.llm.semantic_search import SemanticSearch
        searcher = SemanticSearch()
        
        # Get other docs
        others = Document.objects.filter(user=request.user).exclude(id=document.id).exclude(embedding=[])
        others_data = [(d.id, d.embedding) for d in others]
        
        if not others_data:
            return Response([])

        similarities = searcher.compute_similarity(document.embedding, others_data)
        related_ids = [doc_id for doc_id, score in similarities if score > 0.4][:5]
        
        related_docs = Document.objects.filter(id__in=related_ids)
        return Response(DocumentSerializer(related_docs, many=True).data)

    @action(detail=True, methods=['post'])
    def update_tags(self, request, pk=None):
        """Manually update tags."""
        document = self.get_object()
        tags = request.data.get('tags', [])
        if not document.ai_insights:
            document.ai_insights = {}
        document.ai_insights['tags'] = tags
        document.save()
        self.log_event(document, "TAG_UPDATE", f"Tags updated: {tags}")
        return Response({'status': 'Tags updated', 'tags': tags})

    @action(detail=True, methods=['post'])
    def upload_version(self, request, pk=None):
        """Upload a newer version of an existing entity."""
        parent_doc = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
            
        new_doc = Document.objects.create(
            user=self.request.user,
            title=f"{parent_doc.title} (v{parent_doc.version + 1})",
            file=file,
            parent=parent_doc,
            version=parent_doc.version + 1,
            collection=parent_doc.collection
        )
        self.log_event(parent_doc, "VERSION_NEW", f"New version created: ID {new_doc.id}")
        
        from .tasks import process_document_task
        process_document_task.delay(new_doc.id)
        
        return Response(DocumentSerializer(new_doc).data, status=201)

    @action(detail=True, methods=['get'])
    def lineage(self, request, pk=None):
        """Get all versions of this knowledge unit."""
        from django.db.models import Q
        document = self.get_object()
        # Find root
        root = document
        while root.parent:
            root = root.parent
            
        # Get all children of this root
        family = Document.objects.filter(Q(id=root.id) | Q(parent=root) | Q(parent__parent=root) | Q(parent__parent__parent=root)).order_by('version')
        return Response(DocumentSerializer(family, many=True).data)

