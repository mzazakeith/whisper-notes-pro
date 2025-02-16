use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::fs::{self, File};
use std::path::PathBuf;
use std::io::{Write, BufReader};
use hound::{WavSpec, WavWriter, WavReader};
use whisper_rs::{WhisperContext, FullParams, SamplingStrategy};
use std::thread;
use reqwest;

const SAMPLE_RATE: u32 = 16000;
const CHANNELS: u16 = 1;
const MODEL_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin";

pub async fn ensure_model_exists(app_data_dir: PathBuf) -> Result<PathBuf, String> {
    let models_dir = app_data_dir.join("models");
    fs::create_dir_all(&models_dir)
        .map_err(|e| format!("Failed to create models directory: {}", e))?;

    let model_path = models_dir.join("ggml-base.bin");
    
    if !model_path.exists() {
        println!("Downloading Whisper model...");
        
        let response = reqwest::get(MODEL_URL)
            .await
            .map_err(|e| format!("Failed to download model: {}", e))?;
            
        let bytes = response.bytes()
            .await
            .map_err(|e| format!("Failed to get model bytes: {}", e))?;
            
        let mut file = File::create(&model_path)
            .map_err(|e| format!("Failed to create model file: {}", e))?;
            
        file.write_all(&bytes)
            .map_err(|e| format!("Failed to write model file: {}", e))?;
            
        println!("Model downloaded successfully");
    }
    
    Ok(model_path)
}

#[derive(Default)]
pub struct AudioRecorder {
    is_recording: Arc<AtomicBool>,
    recorded_file: Arc<std::sync::Mutex<Option<PathBuf>>>,
}

impl AudioRecorder {
    pub fn new() -> Self {
        AudioRecorder {
            is_recording: Arc::new(AtomicBool::new(false)),
            recorded_file: Arc::new(std::sync::Mutex::new(None)),
        }
    }

    pub fn start_recording(&self, output_path: PathBuf) -> Result<(), String> {
        if self.is_recording.load(Ordering::SeqCst) {
            return Err("Already recording".to_string());
        }

        let host = cpal::default_host();
        let device = host.default_input_device()
            .ok_or_else(|| "No input device available".to_string())?;

        let config = cpal::StreamConfig {
            channels: CHANNELS,
            sample_rate: cpal::SampleRate(SAMPLE_RATE),
            buffer_size: cpal::BufferSize::Default,
        };

        let spec = WavSpec {
            channels: CHANNELS,
            sample_rate: SAMPLE_RATE,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let writer = Arc::new(std::sync::Mutex::new(Some(
            WavWriter::create(&output_path, spec)
                .map_err(|e| format!("Failed to create WAV file: {}", e))?
        )));

        let is_recording = self.is_recording.clone();
        is_recording.store(true, Ordering::SeqCst);

        let writer_clone = Arc::clone(&writer);
        let is_recording_clone = Arc::clone(&is_recording);

        // Create a channel for the stream
        let (tx, rx) = std::sync::mpsc::channel();

        // Spawn a new thread for audio recording
        thread::spawn(move || {
            let err_fn = move |err| {
                eprintln!("An error occurred on stream: {}", err);
            };

            let writer_for_callback = Arc::clone(&writer_clone);
            let is_recording_for_callback = Arc::clone(&is_recording_clone);

            let stream = device.build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if !is_recording_for_callback.load(Ordering::SeqCst) {
                        return;
                    }
                    if let Some(writer) = &mut *writer_for_callback.lock().unwrap() {
                        for &sample in data {
                            let amplitude = (sample * i16::MAX as f32) as i16;
                            writer.write_sample(amplitude).unwrap();
                        }
                    }
                },
                err_fn,
                None
            ).unwrap();

            stream.play().unwrap();
            tx.send(()).unwrap(); // Signal that the stream is ready

            // Keep the stream alive while recording
            while is_recording_clone.load(Ordering::SeqCst) {
                thread::sleep(std::time::Duration::from_millis(100));
            }

            // Finalize the WAV file
            if let Some(writer) = writer_clone.lock().unwrap().take() {
                writer.finalize().unwrap();
            }
        });

        // Wait for the stream to be ready
        rx.recv().map_err(|_| "Failed to start recording thread".to_string())?;

        *self.recorded_file.lock().unwrap() = Some(output_path);
        Ok(())
    }

    pub fn stop_recording(&self) -> Result<PathBuf, String> {
        self.is_recording.store(false, Ordering::SeqCst);
        
        // Give some time for the recording thread to finish
        thread::sleep(std::time::Duration::from_millis(200));
        
        if let Some(path) = self.recorded_file.lock().unwrap().take() {
            Ok(path)
        } else {
            Err("No recording in progress".to_string())
        }
    }

    pub fn transcribe_audio(&self, audio_path: PathBuf) -> Result<String, String> {
        let app_data_dir = tauri::api::path::data_dir()
            .ok_or_else(|| "Failed to get app data directory".to_string())?
            .join("com.notes.dev");

        // Get the model path
        let model_path = app_data_dir.join("models").join("ggml-base.bin");
        if !model_path.exists() {
            return Err("Whisper model not found. Please run the download-model script first.".to_string());
        }

        // Read WAV file and convert to f32 samples
        let reader = WavReader::open(&audio_path)
            .map_err(|e| format!("Failed to read WAV file: {}", e))?;
        
        let samples: Vec<f32> = if reader.spec().sample_format == hound::SampleFormat::Int {
            reader.into_samples::<i16>()
                .map(|s| s.map(|s| s as f32 / i16::MAX as f32))
                .collect::<Result<Vec<f32>, _>>()
                .map_err(|e| format!("Failed to read audio samples: {}", e))?
        } else {
            reader.into_samples::<f32>()
                .collect::<Result<Vec<f32>, _>>()
                .map_err(|e| format!("Failed to read audio samples: {}", e))?
        };

        // Initialize whisper context
        let ctx = WhisperContext::new(
            model_path.to_str().unwrap()
        ).map_err(|e| format!("Failed to create whisper context: {}", e))?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        let mut state = ctx.create_state()
            .map_err(|e| format!("Failed to create state: {}", e))?;

        state.full(params, &samples)
            .map_err(|e| format!("Failed to process audio: {}", e))?;

        let num_segments = state.full_n_segments()
            .map_err(|e| format!("Failed to get number of segments: {}", e))?;

        let mut text = String::new();
        for i in 0..num_segments {
            if let Ok(segment) = state.full_get_segment_text(i) {
                text.push_str(&segment);
                text.push(' ');
            }
        }

        // Clean up the audio file
        if let Err(e) = fs::remove_file(&audio_path) {
            eprintln!("Warning: Failed to delete audio file: {}", e);
        }

        Ok(text.trim().to_string())
    }
} 