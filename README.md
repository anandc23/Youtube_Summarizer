# YouTube Video Summarizer

A modern web app to generate AI-powered summaries of any YouTube video.

## Features

- Paste a YouTube link and get a summary, intro, and video preview
- Works with or without captions (uses Whisper for audio transcription)
- Clean, responsive UI with YouTube-style branding
- Clickable video thumbnail and video info
- Backend: Flask, yt-dlp, ffmpeg, Whisper, Hugging Face Transformers

## Setup

1. **Clone the repo:**
   ```
   git clone https://github.com/yourusername/yt_summarizer.git
   cd yt_summarizer
   ```

2. **Install Python dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Install [ffmpeg](https://ffmpeg.org/download.html) and make sure it's in your PATH.**

4. **Start the backend:**
   ```
   python backend/app.py
   ```

5. **Open your browser at:**  
   [http://127.0.0.1:5000/](http://127.0.0.1:5000/)

## Notes

- Make sure MongoDB is running if you use authentication.
- All frontend files (`index.html`, `styles.css`, `script.js`) are in the project root.

## License

MIT
