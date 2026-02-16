from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NoteFolderViewSet, NoteTagViewSet, 
    NoteViewSet, NoteChecklistItemViewSet,
    NoteAttachmentViewSet, NoteTemplateViewSet,
    QuickCaptureViewSet, NoteAnalyticsViewSet
)

router = DefaultRouter()
router.register(r'folders', NoteFolderViewSet, basename='note-folder')
router.register(r'tags', NoteTagViewSet, basename='note-tag')
router.register(r'checklist-items', NoteChecklistItemViewSet, basename='note-checklist-item')
router.register(r'attachments', NoteAttachmentViewSet, basename='note-attachment')
router.register(r'templates', NoteTemplateViewSet, basename='note-template')
router.register(r'quick-captures', QuickCaptureViewSet, basename='quick-capture')
router.register(r'analytics', NoteAnalyticsViewSet, basename='note-analytics')
router.register(r'', NoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
]
