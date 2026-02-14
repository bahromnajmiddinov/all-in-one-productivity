from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NoteFolderViewSet, NoteTagViewSet, 
    NoteViewSet, NoteChecklistItemViewSet
)

router = DefaultRouter()
router.register(r'folders', NoteFolderViewSet, basename='note-folder')
router.register(r'tags', NoteTagViewSet, basename='note-tag')
router.register(r'checklist-items', NoteChecklistItemViewSet, basename='note-checklist-item')
router.register(r'', NoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
]
