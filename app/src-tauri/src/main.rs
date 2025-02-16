#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod audio;

use serde::{Deserialize, Serialize};
use std::fs;
use tauri::api::path::data_dir;
use std::sync::Arc;
use audio::{AudioRecorder, ensure_model_exists};

const APP_ID: &str = "com.notes.dev";

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Note {
    id: i64,
    title: String,
    content: String,
    timestamp: String,
}

#[derive(Default)]
struct AudioState {
    recorder: Arc<AudioRecorder>,
}

#[tauri::command]
async fn save_note(note: Note) -> Result<(), String> {
    println!("Saving note: {:?}", note);
    
    let app_data_dir = data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join(APP_ID);
    println!("App data directory: {:?}", app_data_dir);
    
    // Create the directory if it doesn't exist
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;
    
    let notes_dir = app_data_dir.join("notes");
    println!("Notes directory: {:?}", notes_dir);
    
    fs::create_dir_all(&notes_dir)
        .map_err(|e| format!("Failed to create notes directory: {}", e))?;
    
    let note_file = notes_dir.join(format!("{}.json", note.id));
    println!("Note file path: {:?}", note_file);
    
    let json = serde_json::to_string_pretty(&note)
        .map_err(|e| format!("Failed to serialize note: {}", e))?;
    
    fs::write(&note_file, json)
        .map_err(|e| format!("Failed to write note to file: {}", e))?;
    
    println!("Note saved successfully");
    Ok(())
}

#[tauri::command]
async fn delete_note(note_id: i64) -> Result<(), String> {
    let app_data_dir = data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join(APP_ID);
    
    let notes_dir = app_data_dir.join("notes");
    let note_file = notes_dir.join(format!("{}.json", note_id));
    
    if note_file.exists() {
        fs::remove_file(note_file)
            .map_err(|e| format!("Failed to delete note: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
async fn load_notes() -> Result<Vec<Note>, String> {
    let app_data_dir = data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join(APP_ID);
    
    let notes_dir = app_data_dir.join("notes");
    
    // If directory doesn't exist, create it and return empty vector
    if !notes_dir.exists() {
        fs::create_dir_all(&notes_dir)
            .map_err(|e| format!("Failed to create notes directory: {}", e))?;
        return Ok(Vec::new());
    }
    
    let mut notes = Vec::new();
    
    for entry in fs::read_dir(notes_dir)
        .map_err(|e| format!("Failed to read notes directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("Failed to read note file: {}", e))?;
            
            let note: Note = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse note: {}", e))?;
            
            notes.push(note);
        }
    }
    
    // Sort notes by timestamp in descending order (newest first)
    notes.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(notes)
}

#[tauri::command]
async fn start_audio_recording(state: tauri::State<'_, AudioState>) -> Result<(), String> {
    let app_data_dir = data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join(APP_ID);
    
    let recordings_dir = app_data_dir.join("recordings");
    fs::create_dir_all(&recordings_dir)
        .map_err(|e| format!("Failed to create recordings directory: {}", e))?;
    
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let output_path = recordings_dir.join(format!("recording_{}.wav", timestamp));
    
    state.recorder.start_recording(output_path)
}

#[tauri::command]
async fn stop_audio_recording(state: tauri::State<'_, AudioState>) -> Result<String, String> {
    let audio_path = state.recorder.stop_recording()?;
    let transcription = state.recorder.transcribe_audio(audio_path)?;
    Ok(transcription)
}

#[tauri::command]
async fn ensure_model_ready() -> Result<(), String> {
    let app_data_dir = data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join(APP_ID);
    
    ensure_model_exists(app_data_dir).await?;
    Ok(())
}

fn main() {
    let audio_state = AudioState {
        recorder: Arc::new(AudioRecorder::new()),
    };

    tauri::Builder::default()
        .manage(audio_state)
        .invoke_handler(tauri::generate_handler![
            save_note,
            delete_note,
            load_notes,
            start_audio_recording,
            stop_audio_recording,
            ensure_model_ready
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
