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
        <div className="bg-gray-50 dark:bg-slate-800 dark:text-white flex flex-row h-screen w-screen">
            <NoteSidebar />
            {selectedNote ? (
                <NoteEditor note={selectedNote} />
            ) : (
                <div className="flex grow h-full justify-center items-center">
                    <p className="font-medium text-lg">Select a note or create a new one to get started</p>
                </div>
            )}
            <Toaster
                position="bottom-center"
                toastOptions={{
                    className: 'bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md shadow-md',
                }}
            />
        </div>
    );
}
