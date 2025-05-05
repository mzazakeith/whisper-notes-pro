import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import {
    Mic,
    MicOff,
    Loader2,
    Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
    onTranscriptionComplete: (transcription: string) => void;
}

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [modelReady, setModelReady] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isRecording]);

    useEffect(() => {
        const initializeModel = async () => {
            try {
                await invoke('ensure_model_ready');
                setModelReady(true);
            } catch (error) {
                console.error('Failed to initialize model:', error);
            }
        };
        initializeModel();
    }, []);

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            await invoke('start_audio_recording');
            setIsRecording(true);
            setRecordingDuration(0);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async () => {
        try {
            setIsRecording(false);
            setIsProcessing(true);
            const transcription = await invoke<string>('stop_audio_recording');
            onTranscriptionComplete(transcription);
        } catch (error) {
            console.error('Failed to stop recording:', error);
        } finally {
            setIsProcessing(false);
            setRecordingDuration(0);
        }
    };

    if (!modelReady) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="relative"
                            disabled
                        >
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        Initializing speech recognition...
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={isRecording ? "destructive" : "outline"}
                            size="icon"
                            className={cn(
                                "relative",
                                isRecording && "animate-pulse"
                            )}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isRecording ? (
                                <>
                                    <MicOff className="h-4 w-4" />
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                    </span>
                                </>
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isProcessing
                            ? "Processing audio..."
                            : isRecording
                            ? "Stop recording"
                            : "Start recording"}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {isRecording && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-5">
                    <Waves className="h-4 w-4 animate-pulse text-destructive" />
                    <span className="text-sm font-medium">
                        {formatDuration(recordingDuration)}
                    </span>
                    <Progress 
                        value={((recordingDuration % 60) / 60) * 100} 
                        className="w-[60px]"
                    />
                </div>
            )}
        </div>
    );
} 