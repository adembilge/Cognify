from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, CollectionViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'documents', DocumentViewSet, basename='document')

urlpatterns = [
    path('analytics/', DocumentViewSet.as_view({'get': 'analytics'})),
    path('global_chat/', DocumentViewSet.as_view({'post': 'global_chat'})),
    path('', include(router.urls)),
]
