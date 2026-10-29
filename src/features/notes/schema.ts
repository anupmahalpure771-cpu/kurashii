export interface NoteItem {
  id: string;
  workspace: 'personal' | 'professional';
  title: string;
  content: string;
  category: string;
  meetingId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteFormData {
  workspace: 'personal' | 'professional';
  title: string;
  content: string;
  category: string;
  meetingId?: string;
}
