import { useEffect, useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { useStore } from '../store/store';
import { Note } from '../types/Note';
import Button from './Button';
import AudioRecorder from './AudioRecorder';

type NoteEditorProps = {
    note: Note;
};

export default function NoteEditor({ note }: NoteEditorProps) {
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
        // Automatically enter edit mode if the note title starts with "Note " followed by a date
        if (note.title.startsWith('Note 2')) {
            setIsEditing(true);
        }
    }, [note]);

    const handleSave = () => {
        updateNote({
            ...note,
            title,
            content,
            timestamp: new Date().toISOString(),
        });
        setIsEditing(false);
    };

    const handleTranscription = (transcription: string) => {
        const newContent = content ? `${content}\n\n${transcription}` : transcription;
        setContent(newContent);
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    return (
        <div className="flex flex-col grow px-4 py-2 h-full">
            <div className="flex flex-row justify-between items-center mb-4">
                {isEditing ? (
                    <input
                        className="text-2xl font-medium bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 w-full mr-4"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Note title"
                    />
                ) : (
                    <h1 className="text-2xl font-medium grow">{title}</h1>
                )}
                <div className="flex flex-row gap-2">
                    <AudioRecorder onTranscriptionComplete={handleTranscription} />
                    <Button
                        icon={<PencilIcon className="h-4 w-4" />}
                        onClick={() => setIsEditing(!isEditing)}
                    />
                    <Button
                        icon={<TrashIcon className="h-4 w-4" />}
                        onClick={() => deleteNote(note.id)}
                        variant="danger"
                    />
                </div>
            </div>
            {isEditing ? (
                <div className="flex flex-col h-full">
                    <textarea
                        className="w-full h-full p-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your note here..."
                    />
                    <div className="flex justify-end mt-4">
                        <Button
                            text="Save"
                            onClick={handleSave}
                            variant="primary"
                        />
                    </div>
                </div>
            ) : (
                <div className="whitespace-pre-wrap">{content}</div>
            )}
        </div>
    );
} 