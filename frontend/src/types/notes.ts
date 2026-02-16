export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parent?: string;
  children?: NoteFolder[];
  is_default: boolean;
  note_count: number;
  full_path: string;
  created_at: string;
}

export interface NoteTag {
  id: string;
  name: string;
  color: string;
  note_count: number;
}

export interface NoteChecklistItem {
  id: string;
  content: string;
  is_checked: boolean;
  order: number;
}

export interface NoteAttachment {
  id: string;
  attachment_type: 'image' | 'file' | 'audio' | 'video' | 'link';
  file?: string;
  file_url?: string;
  url?: string;
  title: string;
  description: string;
  file_size?: number;
  mime_type?: string;
  order: number;
  created_at: string;
}

export interface NoteLink {
  id: string;
  target_note: string;
  target_note_id: string;
  target_note_title: string;
  link_text: string;
  context?: string;
  created_at: string;
}

export interface Backlink {
  id: string;
  source_note_id: string;
  source_note_title: string;
  link_text: string;
  context?: string;
  created_at: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  template_type: 'blank' | 'meeting' | 'daily' | 'project' | 'research' | 'code' | 'journal' | 'todo' | 'custom';
  description: string;
  icon: string;
  color: string;
  title_template: string;
  content_template: string;
  default_tags: NoteTag[];
  default_folder?: string;
  is_default: boolean;
  is_system: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteRevision {
  id: string;
  title: string;
  word_count: number;
  edited_at: string;
}

export interface NoteAnalytics {
  word_count: number;
  character_count: number;
  reading_time_minutes: number;
  view_count: number;
  edit_count: number;
  outgoing_link_count: number;
  incoming_link_count: number;
  first_viewed_at?: string;
  last_viewed_at?: string;
  last_edited_at?: string;
}

export interface QuickCapture {
  id: string;
  capture_type: 'text' | 'voice' | 'web_clip' | 'image';
  content: string;
  title: string;
  source_url?: string;
  source_title?: string;
  audio_file?: string;
  transcription?: string;
  duration_seconds?: number;
  folder?: string;
  tags: NoteTag[];
  is_processed: boolean;
  converted_note?: string;
  created_at: string;
}

export type NoteType = 'text' | 'checklist' | 'code' | 'voice' | 'web_clip' | 'markdown';

export interface Note {
  id: string;
  title: string;
  content: string;
  rendered_content?: string;
  note_type: NoteType;
  folder?: string;
  folder_info?: NoteFolder;
  tags: string[];
  tags_info?: NoteTag[];
  is_pinned: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  checklist_items?: NoteChecklistItem[];
  attachments?: NoteAttachment[];
  outgoing_links?: NoteLink[];
  backlinks?: Backlink[];
  linked_notes?: string[];
  analytics?: NoteAnalytics;
  revisions?: NoteRevision[];
  template?: string;
  template_info?: NoteTemplate;
  created_at: string;
  updated_at: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  preview: string;
  note_type: NoteType;
  folder_name?: string;
  is_pinned: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  tag_list?: NoteTag[];
  word_count: number;
  link_count: number;
  created_at: string;
  updated_at: string;
}

export interface NoteGraphNode {
  id: string;
  title: string;
  note_type: NoteType;
  is_favorite: boolean;
  link_count: number;
  updated_at: string;
}

export interface NoteGraphEdge {
  id: string;
  source: string;
  target: string;
  link_text?: string;
}

export interface NoteGraphData {
  nodes: NoteGraphNode[];
  edges: NoteGraphEdge[];
}

export interface GlobalNoteAnalytics {
  total_notes: number;
  total_words: number;
  notes_this_week: number;
  notes_this_month: number;
  most_active_day?: string;
  most_used_tags: { name: string; count: number }[];
  most_linked_notes: { id: string; title: string; link_count: number }[];
  daily_creation_trend: { date: string; count: number }[];
}

export interface WebClipData {
  url: string;
  title?: string;
  content?: string;
  selected_text?: string;
  folder?: string;
  tags?: string[];
}

export interface NoteSearchFilters {
  query: string;
  folder?: string;
  tag?: string;
  note_type?: NoteType;
  date_from?: string;
  date_to?: string;
  favorites?: boolean;
}
