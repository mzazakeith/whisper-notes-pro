import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { Note } from '../types/Note';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
    Save as SaveIcon,
    Trash as TrashIcon,
    MoreHorizontal as DotsHorizontalIcon,
    Clock as ClockIcon,
    Pencil as PencilIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import AudioRecorder from './AudioRecorder';
import toast from 'react-hot-toast';

interface NoteEditorProps {
    note: Note;
}

export default function NoteEditor({ note }: NoteEditorProps) {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const updateNote = useStore((state) => state.updateNote);
    const deleteNote = useStore((state) => state.deleteNote);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastSavedRef = useRef({ title, content });

    useEffect(() => {
        setTitle(note.title);
        setContent(note.content);
        lastSavedRef.current = { title: note.title, content: note.content };
        setIsEditing(false);
    }, [note]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Title cannot be empty');
            return;
        }

        try {
            setIsSaving(true);
            await updateNote(note.id, title, content);
            lastSavedRef.current = { title, content };
            toast.success('Note saved successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to save note');
            console.error('Error saving note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteNote(note.id);
            toast.success('Note deleted successfully');
        } catch (error) {
            toast.error('Failed to delete note');
            console.error('Error deleting note:', error);
        }
    };

    const handleTranscription = (transcription: string) => {
        const newContent = content ? `${content}\n\n${transcription}` : transcription;
        setContent(newContent);
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    const hasUnsavedChanges = 
        title !== lastSavedRef.current.title || 
        content !== lastSavedRef.current.content;

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [content]);

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex flex-1 items-center gap-4">
                    {isEditing ? (
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="max-w-md text-lg font-semibold"
                            placeholder="Note title"
                        />
                    ) : (
                        <h1 className="text-lg font-semibold">{title}</h1>
                    )}
                    {hasUnsavedChanges && (
                        <span className="text-sm text-muted-foreground">
                            (Unsaved changes)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <AudioRecorder onTranscriptionComplete={handleTranscription} />
                    
                    <Separator orientation="vertical" className="h-6" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isEditing ? 'Preview mode' : 'Edit mode'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={hasUnsavedChanges ? "default" : "ghost"}
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving || !hasUnsavedChanges}
                                >
                                    <SaveIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Save changes</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <DotsHorizontalIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Note Options</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <TrashIcon className="mr-2 h-4 w-4" />
                                Delete Note
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                <span>Last modified: {format(new Date(note.timestamp), 'PPpp')}</span>
            </div>

            <ScrollArea className="flex-1 p-4">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[200px] w-full resize-none bg-transparent p-0 text-lg leading-relaxed focus:outline-none"
                        placeholder="Start writing your note here..."
                        onInput={adjustTextareaHeight}
                    />
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {content.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4 last:mb-0">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
} 