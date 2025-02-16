import { useState } from 'react';
import { MoonIcon, PlusIcon, SunIcon } from '@heroicons/react/solid';
import { useStore } from '../store/store';
import { Note } from '../types/Note';
import Button from './Button';

export default function NoteSidebar() {
    const notes = useStore((state) => state.notes);
    const selectedNote = useStore((state) => state.selectedNote);
    const createNote = useStore((state) => state.createNote);
    const selectNote = useStore((state) => state.selectNote);
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);

    const handleCreateNote = async () => {
        console.log('Creating new note...');
        try {
            const timestamp = new Date();
            const title = `Note ${timestamp.toLocaleString()}`;
            await createNote(title, '');
            console.log('Note created successfully');
        } catch (error) {
            console.error('Error creating note:', error);
        }
    };

    return (
        <div className="border-gray-100 border-r dark:border-slate-900 flex flex-col max-w-lg min-w-[250px] py-2 w-1/4">
            <div className="flex flex-row justify-between mb-2 px-4">
                <p className="flex font-medium self-end text-lg">Notes</p>
                <Button
                    icon={<PlusIcon className="h-[22px] w-[16px]" />}
                    onClick={handleCreateNote}
                />
            </div>
            <div className="flex flex-col gap-2 grow overflow-auto px-2">
                {notes.map((note: Note) => (
                    <div
                        key={`note-${note.id}`}
                        className={`cursor-pointer p-2 rounded-md transition-colors ${
                            selectedNote?.id === note.id
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                        onClick={() => selectNote(note)}
                    >
                        <div className="font-medium truncate">{note.title}</div>
                        <div className="text-sm truncate opacity-75">
                            {new Date(note.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-row px-2">
                {theme === 'dark' && (
                    <Button
                        icon={<SunIcon className="h-6 w-4" />}
                        onClick={() => setTheme('light')}
                    />
                )}
                {theme === 'light' && (
                    <Button
                        icon={<MoonIcon className="h-6 w-4" />}
                        onClick={() => setTheme('dark')}
                    />
                )}
            </div>
        </div>
    );
} 