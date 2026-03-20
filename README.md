# 🎥 YouTube AI Summarizer

A high-performance AI workspace to **Summarize, Transcribe, and Repurpose** YouTube content from any language (Hindi, Marathi, Spanish, etc.) into professional English insights and viral shorts.

---

## 🛠️ How it Works (Step-by-Step)

The project leverages a decoupled frontend (React) and backend (Python/Flask) architecture:

1. **Input**: The user pastes a YouTube URL into the React dashboard.
2. **Metadata Extraction**: The backend uses `yt-dlp` to fetch the video's title, thumbnail, views, duration, and author info.
3. **Data Acquisition**: 
   - For **Summaries**: The backend downloads the audio portion of the video using `yt-dlp` and `ffmpeg`.
   - For **Shorts**: The full video is downloaded.
4. **Transcription**: The audio is processed through the `faster-whisper` AI model (running locally), mapping speech to high-quality text, translating non-English languages to English on the fly.
5. **AI Processing**:
   - For **Summaries**: The `BART-CNN` neural summarizing model condenses the transcript into an executive summary, hook, and tags.
   - For **Shorts**: The transcript is analyzed for "hook words" and high-engagement density. It then uses `ffmpeg` to precisely crop 9:16 vertical clips from those specific timestamps.
6. **Streaming Response**: Real-time progress updates are streamed back to the frontend using Server-Sent Events (SSE) so the user sees a live terminal operation log.
7. **Result Delivery**: The React interface cleanly presents the final intel report or the downloadable viral shorts.

---

## ⚙️ How to Set Up the Project Step-by-Step

### Prerequisites
- **Python 3.10+**
- **Node.js & NPM**
- **FFmpeg** (Must be installed and added to your system's PATH)

### 1. Clone the Repository
```bash
git clone https://github.com/anandc23/Youtube_Summarizer.git
cd Youtube_Summarizer
```

### 2. Set Up the Python Backend
The backend powers the heavy lifting (Whisper and BART).
```bash
# Navigate to the backend or project root
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
..\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install the required Python packages
pip install -r ../requirements.txt
```
*(Optionally, create a `.env` file in the backend directory if needed for API keys or custom config).*

### 3. Set Up the React Frontend
The frontend provides the modern, YouTube-branded dashboard.
```bash
# Open a new terminal and navigate to the frontend folder
cd frontend-react

# Install the Node.js packages
npm install
```

---

## 🚀 How to Start the Project Step-by-Step

You will need **two separate terminal windows** open simultaneously.

### Terminal 1: Start the AI Backend
```bash
cd Youtube_Summarizer
.\venv\Scripts\activate
cd backend
python app.py
```
*The backend server will run at: `http://localhost:5000`*

### Terminal 2: Start the UI Frontend
```bash
cd Youtube_Summarizer\frontend-react
npm run dev
```
*The frontend dashboard will run at: `http://localhost:5173`*

### Ready to Use
1. Open `http://localhost:5173` in your browser.
2. Paste a YouTube URL.
3. Select the number of short clips (if extracting shorts) and hit **Build Summary**.

---

## 🔥 Key Features
- **Multilingual Support**: Automatically processes non-English videos into English.
- **Viral Shorts Engine**: Algorithmically cuts high-retention 30-second vertical clips.
- **Custom Clip Count**: Choose the exact number of shorts to generate (1 to 10) to save processing time.
- **Pro Dashboard**: A sleek, YouTube-branded light theme UI with live terminal logs.
- **High Performance**: Powered by `faster-whisper` with INT8 quantization for fast CPU execution.

---
Developed by Anand Chaudhari.
