# Project Notes: YouTube Summarizer

## Tools Used

- **Flask**: Python web framework for backend API.
- **yt-dlp**: Downloads audio from YouTube videos.
- **ffmpeg**: Converts downloaded audio/video to WAV format for transcription.
- **openai-whisper**: Transcribes audio to text (supports many languages).
- **transformers (Hugging Face)**: Provides the BART summarization model for generating summaries.
- **pymongo**: (If using authentication) Connects Flask to MongoDB for user management.
- **MongoDB**: (If using authentication) NoSQL database for storing user data.
- **HTML/CSS/JavaScript**: Frontend interface.
- **YouTube oEmbed API**: Fetches video title and description for preview.
- **FontAwesome**: Provides icons for UI buttons.

## How the Code Works

1. **Frontend (index.html, styles.css, script.js)**
    - User pastes a YouTube URL.
    - The video thumbnail, title, and description are fetched and shown.
    - User clicks "Generate Summary".
    - A loading spinner appears while the backend processes the request.
    - When done, the AI-generated intro and summary are displayed.
    - User can copy, share, or download the summary.

2. **Backend (Flask API)**
    - `/summarize` endpoint receives the YouTube URL.
    - **Transcript Handler**:
        - Tries to fetch captions using `youtube-transcript-api`.
        - If captions are unavailable, downloads audio using `yt-dlp` and converts it to WAV with `ffmpeg`.
        - Transcribes the audio using Whisper.
    - **Summarizer**:
        - Splits the transcript into manageable chunks.
        - Summarizes each chunk using Hugging Face's BART model.
        - Combines chunk summaries for a full, coherent summary.
        - Generates a short AI-style intro.
    - Returns `{title, intro, summary}` as JSON to the frontend.

3. **Authentication (Optional)**
    - User can register, login, and logout using MongoDB as the backend database.

## Summary

- The app works for any YouTube video, with or without captions.
- It uses state-of-the-art open-source AI for transcription and summarization.
- The frontend is modern, responsive, and user-friendly.
- The backend is robust, handles errors, and cleans up temporary files.
