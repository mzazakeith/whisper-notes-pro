import { useState, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/outline';
import { invoke } from '@tauri-apps/api/tauri';
import Button from './Button';

type AudioRecorderProps = {
    onTranscriptionComplete: (text: string) => void;
};

export default function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isPreparingModel, setIsPreparingModel] = useState(true);

    useEffect(() => {
        const prepareModel = async () => {
            try {
                await invoke('ensure_model_ready');
                setIsModelReady(true);
            } catch (error) {
                console.error('Failed to prepare model:', error);
                // TODO: Show error toast
            } finally {
                setIsPreparingModel(false);
            }
        };

        prepareModel();
    }, []);

    const startRecording = async () => {
        if (!isModelReady) return;
        
        try {
            await invoke('start_audio_recording');
            setIsRecording(true);
        } catch (error) {
            console.error('Failed to start recording:', error);
            // TODO: Show error toast
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
            // TODO: Show error toast
        } finally {
            setIsProcessing(false);
        }
    };

    if (isPreparingModel) {
        return (
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Preparing speech recognition...
            </span>
        );
    }

    if (!isModelReady) {
        return (
            <span className="text-sm text-red-500 dark:text-red-400">
                Speech recognition unavailable
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {!isRecording && !isProcessing ? (
                <Button
                    icon={<MicrophoneIcon className="h-5 w-5" />}
                    text="Record"
                    onClick={startRecording}
                    variant="primary"
                />
            ) : isRecording ? (
                <Button
                    icon={<StopIcon className="h-5 w-5" />}
                    text="Stop"
                    onClick={stopRecording}
                    variant="danger"
                />
            ) : null}
            {isProcessing && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Processing audio...
                </span>
            )}
        </div>
    );
} 