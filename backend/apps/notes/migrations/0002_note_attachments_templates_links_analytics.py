# Generated migration for notes enhancements

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0001_initial'),
    ]

    operations = [
        # Update Note model
        migrations.AlterField(
            model_name='note',
            name='note_type',
            field=models.CharField(choices=[('text', 'Text'), ('checklist', 'Checklist'), ('code', 'Code'), ('voice', 'Voice Note'), ('web_clip', 'Web Clip'), ('markdown', 'Markdown')], default='text', max_length=20),
        ),
        migrations.AddField(
            model_name='note',
            name='rendered_content',
            field=models.TextField(blank=True, help_text='HTML rendered from markdown'),
        ),
        migrations.AlterModelOptions(
            name='note',
            options={'ordering': ['-is_pinned', '-updated_at']},
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['user', '-updated_at'], name='notes_note_user_id_9af683_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['user', 'is_archived'], name='notes_note_user_id_ee9d2e_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['user', 'is_favorite'], name='notes_note_user_id_6356fd_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['note_type'], name='notes_note_note_ty_f847fb_idx'),
        ),

        # NoteAttachment model
        migrations.CreateModel(
            name='NoteAttachment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('file', models.FileField(blank=True, null=True, upload_to='note_attachments/%Y/%m/')),
                ('attachment_type', models.CharField(choices=[('image', 'Image'), ('file', 'File'), ('audio', 'Audio'), ('video', 'Video'), ('link', 'Link')], default='file', max_length=20)),
                ('url', models.URLField(blank=True)),
                ('title', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('file_size', models.PositiveIntegerField(blank=True, null=True)),
                ('mime_type', models.CharField(blank=True, max_length=100)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='notes.note')),
            ],
            options={
                'ordering': ['order', 'created_at'],
            },
        ),

        # NoteTemplate model
        migrations.CreateModel(
            name='NoteTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('template_type', models.CharField(choices=[('blank', 'Blank Note'), ('meeting', 'Meeting Notes'), ('daily', 'Daily Log'), ('project', 'Project Plan'), ('research', 'Research Notes'), ('code', 'Code Snippet'), ('journal', 'Journal Entry'), ('todo', 'To-Do List'), ('custom', 'Custom')], default='blank', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(default='document', max_length=50)),
                ('color', models.CharField(default='#3B82F6', max_length=7)),
                ('title_template', models.CharField(blank=True, max_length=200)),
                ('content_template', models.TextField(blank=True)),
                ('is_default', models.BooleanField(default=False)),
                ('is_system', models.BooleanField(default=False)),
                ('usage_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('default_folder', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='notes.notefolder')),
                ('default_tags', models.ManyToManyField(blank=True, to='notes.notetag')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='note_templates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-usage_count', 'name'],
                'unique_together': {('user', 'name')},
            },
        ),

        # Add template field to Note
        migrations.AddField(
            model_name='note',
            name='template',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_notes', to='notes.notetemplate'),
        ),

        # NoteLink model
        migrations.CreateModel(
            name='NoteLink',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('link_text', models.CharField(blank=True, max_length=200)),
                ('context', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('source_note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='outgoing_links', to='notes.note')),
                ('target_note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incoming_links', to='notes.note')),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('source_note', 'target_note')},
            },
        ),

        # NoteRevision model
        migrations.CreateModel(
            name='NoteRevision',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=300)),
                ('content', models.TextField(blank=True)),
                ('edited_at', models.DateTimeField(auto_now_add=True)),
                ('word_count', models.PositiveIntegerField(default=0)),
                ('note', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='revisions', to='notes.note')),
            ],
            options={
                'ordering': ['-edited_at'],
            },
        ),

        # NoteAnalytics model
        migrations.CreateModel(
            name='NoteAnalytics',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('word_count', models.PositiveIntegerField(default=0)),
                ('character_count', models.PositiveIntegerField(default=0)),
                ('reading_time_minutes', models.PositiveIntegerField(default=0)),
                ('view_count', models.PositiveIntegerField(default=0)),
                ('edit_count', models.PositiveIntegerField(default=0)),
                ('outgoing_link_count', models.PositiveIntegerField(default=0)),
                ('incoming_link_count', models.PositiveIntegerField(default=0)),
                ('first_viewed_at', models.DateTimeField(blank=True, null=True)),
                ('last_viewed_at', models.DateTimeField(blank=True, null=True)),
                ('last_edited_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('note', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='analytics', to='notes.note')),
            ],
            options={
                'verbose_name_plural': 'Note Analytics',
            },
        ),

        # QuickCapture model
        migrations.CreateModel(
            name='QuickCapture',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('capture_type', models.CharField(choices=[('text', 'Text'), ('voice', 'Voice'), ('web_clip', 'Web Clip'), ('image', 'Image')], default='text', max_length=20)),
                ('content', models.TextField()),
                ('title', models.CharField(blank=True, max_length=300)),
                ('source_url', models.URLField(blank=True)),
                ('source_title', models.CharField(blank=True, max_length=300)),
                ('audio_file', models.FileField(blank=True, null=True, upload_to='voice_notes/%Y/%m/')),
                ('transcription', models.TextField(blank=True)),
                ('duration_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('is_processed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('converted_note', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='quick_captures', to='notes.note')),
                ('folder', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='notes.notefolder')),
                ('tags', models.ManyToManyField(blank=True, to='notes.notetag')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='quick_captures', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
