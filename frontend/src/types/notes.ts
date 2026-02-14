export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parent?: string;
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

export interface Note {
  id: string;
  title: string;
  content: string;
  note_type: 'text' | 'checklist' | 'code';
  folder?: string;
  folder_info?: NoteFolder;
  tags: string[];
  tags_info?: NoteTag[];
  is_pinned: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  checklist_items?: NoteChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface NoteListItem {
  id: string;
  title: string;
  preview: string;
  folder_name?: string;
  is_pinned: boolean;
  is_favorite: boolean;
  updated_at: string;
}
