import { invoke } from '@tauri-apps/api/tauri';
import create from 'zustand';
import { Note } from '../types/Note';
import { Theme } from '../types/Theme';
import toast from 'react-hot-toast';

type State = {
    notes: Note[];
    selectedNote: Note | null;
    selectNote: (note: Note | null) => void;
    getNotes: () => Promise<void>;
    createNote: (title: string, content: string) => Promise<void>;
    updateNote: (id: number, title: string, content: string) => Promise<void>;
    deleteNote: (noteId: number) => Promise<void>;
    theme: Theme;
    setTheme: (theme?: Theme) => void;
};

export const useStore = create<State>((set, get) => ({
    notes: [],
    selectedNote: null,
    selectNote: (note: Note | null) => {
        set({ selectedNote: note });
    },
    getNotes: async () => {
        try {
            const result = await invoke<Note[]>('load_notes');
            console.log('Loaded notes:', result);
            set({ notes: result });
        } catch (error) {
            console.error('Failed to load notes:', error);
            toast.error('Failed to load notes');
            throw error;
        }
    },
    createNote: async (title: string, content: string) => {
        try {
            const note: Note = {
                id: Date.now(),
                title,
                content,
                timestamp: new Date().toISOString(),
            };
            console.log('Creating note:', note);
            await invoke('save_note', { note });
            console.log('Note saved successfully');
            set({
                notes: [note, ...get().notes],
                selectedNote: note,
            });
            toast.success('Note created');
        } catch (error) {
            console.error('Failed to create note:', error);
            toast.error('Failed to create note');
            throw error;
        }
    },
    updateNote: async (id: number, title: string, content: string) => {
        try {
            const note: Note = {
                id,
                title,
                content,
                timestamp: new Date().toISOString(),
            };
            console.log('Updating note:', note);
            await invoke('save_note', { note });
            console.log('Note updated successfully');
            set({
                notes: get().notes.map((n) => (n.id === id ? note : n)),
                selectedNote: note,
            });
            // toast.success('Note saved');
        } catch (error) {
            console.error('Failed to update note:', error);
            toast.error('Failed to save note');
            throw error;
        }
    },
    deleteNote: async (noteId: number) => {
        try {
            console.log('Deleting note:', noteId);
            await invoke('delete_note', { noteId });
            console.log('Note deleted successfully');
            set({
                notes: get().notes.filter((note) => note.id !== noteId),
                selectedNote: get().selectedNote?.id === noteId ? null : get().selectedNote,
            });
        } catch (error) {
            console.error('Failed to delete note:', error);
            toast.error('Failed to delete note');
            throw error;
        }
    },
    theme: localStorage.getItem('theme') === 'dark' ? 'dark' : 'light',
    setTheme: (theme?: Theme) => {
        theme = theme ?? get().theme;
        theme === 'dark'
            ? document.body.classList.add('dark')
            : document.body.classList.remove('dark');
        localStorage.setItem('theme', theme);
        set({ theme });
    },
}));
