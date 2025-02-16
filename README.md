# Whisper Notes 🎙️📝

Transform your voice into text effortlessly with Whisper Notes - a modern, lightweight note-taking app powered by whisper.cpp. Capture your thoughts, ideas, and notes through speech, all processed locally on your machine.

## ✨ Features

- **Voice-to-Text**: Seamlessly convert speech to text using state-of-the-art Whisper technology
- **Local Processing**: All speech recognition happens offline on your device - no cloud services needed
- **Lightweight & Fast**: Built with Rust and Tauri for optimal performance
- **Cross-Platform**: Available for Windows, macOS, and Linux
- **Privacy-First**: Your voice data never leaves your computer

## 🚀 Getting Started

1. Download the latest release for your platform
2. Launch Whisper Notes
3. Click the microphone button and start speaking
4. Watch your words transform into text in real-time

## 🛠️ Development

### Prerequisites
- Rust
- Node.js
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/whisper-notes

# Install dependencies
cd whisper-notes
pnpm install

# Run in development mode
pnpm tauri dev
```

### Building

```bash
# Build for production
pnpm tauri build
```

## 🗺️ Roadmap

- [ ] System audio recording support
- [ ] Multiple language support
- [ ] Custom hotkeys
- [ ] Export notes in various formats
- [ ] Rich text editing
- [ ] Cloud sync (optional)

## 📝 License

MIT License - feel free to use and modify as you wish!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Your OS version
- Steps to reproduce
- Expected behavior
- Actual behavior

---

Built with ❤️ using [Tauri](https://tauri.app), [Rust](https://www.rust-lang.org), and [whisper.cpp](https://github.com/ggerganov/whisper.cpp)

## Credits

This project was inspired by and forked from [Benjamin Streit's Tauri Todo App](https://github.com/mbenja/tauri-todo-app) - a beautifully crafted minimalistic todo application built with Tauri and React. Many thanks to Benjamin for open-sourcing his work which served as an excellent foundation for this project.