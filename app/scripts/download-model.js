const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin';
const APP_NAME = 'com.notes.dev';

function getAppDataPath() {
    switch (process.platform) {
        case 'darwin': // macOS
            return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME);
        case 'win32': // Windows
            return path.join(process.env.APPDATA || '', APP_NAME);
        default: // Linux and others
            return path.join(os.homedir(), '.local', 'share', APP_NAME);
    }
}

async function downloadModel() {
    const appDataPath = getAppDataPath();
    const modelsDir = path.join(appDataPath, 'models');
    const modelPath = path.join(modelsDir, 'ggml-base.en.bin');

    // Create directories if they don't exist
    if (!fs.existsSync(modelsDir)) {
        fs.mkdirSync(modelsDir, { recursive: true });
    }

    if (fs.existsSync(modelPath)) {
        console.log('Model already exists at:', modelPath);
        return;
    }

    console.log('Downloading Whisper model...');
    console.log('This may take a few minutes...');

    const file = fs.createWriteStream(modelPath);

    return new Promise((resolve, reject) => {
        https.get(MODEL_URL, response => {
            const total = parseInt(response.headers['content-length'], 10);
            let current = 0;
            let lastPercentage = 0;

            response.pipe(file);

            response.on('data', chunk => {
                current += chunk.length;
                const percentage = Math.floor((current / total) * 100);
                if (percentage > lastPercentage) {
                    process.stdout.write(`Progress: ${percentage}%\r`);
                    lastPercentage = percentage;
                }
            });

            file.on('finish', () => {
                file.close();
                console.log('\nModel downloaded successfully to:', modelPath);
                resolve();
            });
        }).on('error', err => {
            fs.unlink(modelPath, () => {}); // Delete the file if download failed
            reject(err);
        });
    });
}

downloadModel().catch(console.error); 