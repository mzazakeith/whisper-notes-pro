import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import NoteSidebar from './components/NoteSidebar';
import NoteEditor from './components/NoteEditor';
import { useStore } from './store/store';

export default function App() {
    const getNotes = useStore((state) => state.getNotes);
    const selectedNote = useStore((state) => state.selectedNote);
    const setTheme = useStore((state) => state.setTheme);

    useEffect(() => {
        getNotes();
        setTheme();
    }, []);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            <div className="w-80 flex-shrink-0">
                <NoteSidebar />
            </div>
            <main className="flex-1">
                {selectedNote ? (
                    <NoteEditor note={selectedNote} />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="max-w-md text-center">
                            <h2 className="mb-2 text-xl font-semibold tracking-tight">No Note Selected</h2>
                            <p className="text-sm text-muted-foreground">
                                Select a note from the sidebar or create a new one to get started
                            </p>
                        </div>
                    </div>
                )}
            </main>
            <Toaster
                position="bottom-right"
                toastOptions={{
                    className: '!bg-background !text-foreground border border-border',
                    duration: 3000,
                }}
            />
        </div>
    );
}
