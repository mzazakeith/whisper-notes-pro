import { useState } from 'react';
import { useStore } from '../store/store';
import { Note } from '../types/Note';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
    Plus as PlusIcon,
    Moon as MoonIcon,
    Sun as SunIcon,
    Search as SearchIcon,
    FileText as DocumentTextIcon,
    ChevronDown as ChevronDownIcon,
    X as XIcon,
} from 'lucide-react';
import { format } from 'date-fns';

export default function NoteSidebar() {
    const notes = useStore((state) => state.notes);
    const selectedNote = useStore((state) => state.selectedNote);
    const createNote = useStore((state) => state.createNote);
    const selectNote = useStore((state) => state.selectNote);
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);
    const [searchQuery, setSearchQuery] = useState('');

    const handleCreateNote = async () => {
        try {
            const timestamp = new Date();
            const title = `Note ${format(timestamp, 'PPp')}`;
            await createNote(title, '');
        } catch (error) {
            console.error('Error creating note:', error);
        }
    };

    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full flex-col border-r border-border bg-card">
            <div className="flex flex-col space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCreateNote}
                                    className="h-8 w-8"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Create new note</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            onClick={() => setSearchQuery('')}
                        >
                            <XIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1 px-3">
                <div className="space-y-1 p-2">
                    {filteredNotes.length === 0 ? (
                        <div className="flex h-32 items-center justify-center">
                            <p className="text-sm text-muted-foreground">No notes found</p>
                        </div>
                    ) : (
                        filteredNotes.map((note: Note) => (
                            <div
                                key={`note-${note.id}`}
                                className={`group flex cursor-pointer flex-col space-y-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent ${
                                    selectedNote?.id === note.id
                                        ? 'bg-accent'
                                        : 'hover:bg-accent/50'
                                }`}
                                onClick={() => selectNote(note)}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="line-clamp-1 flex-1 font-medium">
                                        {note.title}
                                    </span>
                                    <ChevronDownIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{format(new Date(note.timestamp), 'MMM d, yyyy')}</span>
                                    <Badge variant="secondary" className="opacity-0 transition-opacity group-hover:opacity-100">
                                        {format(new Date(note.timestamp), 'p')}
                                    </Badge>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            <Separator className="my-2" />
            <div className="p-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="h-8 w-8"
                            >
                                {theme === 'dark' ? (
                                    <SunIcon className="h-4 w-4" />
                                ) : (
                                    <MoonIcon className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Toggle theme</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
} 