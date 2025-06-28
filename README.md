# YouTube Video Summarizer

A web application that generates concise summaries and introductions for YouTube videos using their transcripts. This tool helps users quickly understand the content of long videos without watching them in full.

---

## Features

- Accepts a YouTube video link and fetches its transcript.
- Generates a summary and an introduction for the video.
- Simple web interface (frontend) and REST API backend.
- **Supports only English-language YouTube videos.**
- No database or MongoDB required.

---

## Project Structure

```
yt_summarizer/
├── backend/
│   ├── app.py                 # Flask backend API
│   ├── transcript_handler.py  # Transcript extraction logic
│   ├── summarizer.py          # Summarization logic
│   └── auth.py                # Authentication blueprint
├── frontend/                  # Frontend static files (HTML, JS, CSS)
└── README.md
```

---

## Prerequisites

- **Python 3.8+** (Recommended: Python 3.10 or newer)
- **pip** (Python package manager)
- **Git** (for cloning the repository)
- **Node.js & npm** (if you want to modify or build the frontend)

---

## Required Python Packages

Install the backend dependencies:

```bash
pip install flask flask_cors
```

If your transcript or summarizer logic uses other packages (e.g., `youtube-transcript-api`, `transformers`, etc.), install them as well:

```bash
pip install youtube-transcript-api
# pip install transformers torch  # Uncomment if your summarizer uses these
```

---

## Environment Variables

Set the following environment variables if required by your code (for example, API keys for external services):

- `SECRET_KEY` (Flask secret key for session management)
- Any other API keys required by your summarizer or transcript handler

**How to set environment variables:**

On Windows (Command Prompt):

```cmd
set SECRET_KEY=your_secret_key
```

On Linux/macOS:

```bash
export SECRET_KEY=your_secret_key
```

Alternatively, you can set these in a `.env` file and use `python-dotenv` to load them.

---

## Setup & Usage

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/yt_summarizer.git
    cd yt_summarizer
    ```

2. **Install dependencies:**

    ```bash
    pip install flask flask_cors youtube-transcript-api
    # Add any other dependencies your code requires
    ```

3. **Set environment variables** (see above).

4. **Start the backend server:**

    ```bash
    cd backend
    python app.py
    ```

5. **Access the frontend:**

    - By default, the backend serves the frontend static files.
    - Open your browser and go to: [http://localhost:5000](http://localhost:5000)

---

## Code Workflow

1. **Frontend**: User submits a YouTube video link via the web interface.
2. **Backend API** (`/summarize` endpoint):
    - Receives the video URL.
    - Extracts the transcript using `transcript_handler.py`.
    - Summarizes the transcript and generates an introduction using `summarizer.py`.
    - Returns the summary, introduction, and title to the frontend.
3. **Frontend**: Displays the summary and introduction to the user.

---

## Important Notes

- **MongoDB is NOT used** in this project. All data is processed in-memory.
- Only **English-language YouTube videos** are supported (transcript extraction and summarization require English audio).
- The YouTube video **must have an available transcript** (auto-generated or manual).
- If you want to use advanced summarization (e.g., with HuggingFace Transformers), ensure you have the required models and dependencies installed.
- For production, set a strong `SECRET_KEY` and consider disabling debug mode in Flask.

---

## Troubleshooting

- If you get errors about missing transcripts, check that the video is public and has English transcripts enabled.
- If you encounter CORS issues, ensure `flask_cors` is installed and properly configured.
- For any missing package errors, install them using `pip`.

---

## License

MIT License

---

## How to update README.md on GitHub

1. **Edit the README.md file locally**  
   - Make your changes to the `README.md` file using a text editor or IDE.

2. **Save the file**  
   - Ensure your changes are saved.

3. **Commit the changes using Git**  
   - Open a terminal and navigate to your project directory.
   - Run:
     ```bash
     git add README.md
     git commit -m "Update README.md"
     ```

4. **Push the changes to GitHub**  
   - Run:
     ```bash
     git push
     ```



