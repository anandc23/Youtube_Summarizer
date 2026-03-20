import shutil
import os
import re
import datetime
import yt_dlp
import json
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from dotenv import load_dotenv

# Feature Imports
from transcript_handler import get_transcript
from summarizer import summarize, intro, extract_tags
from shorts_generator import generate_shorts

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "pro-dev-key-777")

# Pro-level CORS
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]}}, supports_credentials=True)

# Register blueprint for auth if it exists
try:
    from auth import auth_bp
    app.register_blueprint(auth_bp)
except (ImportError, Exception):
    print("⚠️ Auth module not found, proceeding without it.")

def is_valid_youtube_url(url):
    youtube_regex = (
        r'(https?://)?(www\.)?'
        '(youtube|youtu|youtube-nocookie)\.(com|be)/'
        '(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    return re.match(youtube_regex, url) is not None

def get_video_metadata(url):
    """Fetch video title, author, date, and views using yt-dlp."""
    ydl_opts = {'quiet': True, 'noplaylist': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            "title": info.get('title', 'Unknown Title'),
            "author": info.get('uploader', 'Unknown Creator'),
            "date": info.get('upload_date', 'Unknown Date'),
            "duration": str(datetime.timedelta(seconds=info.get('duration', 0))),
            "views": info.get('view_count', 0),
            "thumbnail": info.get('thumbnail', '')
        }

@app.route("/stream_process", methods=["POST"])
def stream_process():
    data = request.get_json()
    url = data.get("url")
    mode = data.get("mode", "summarize")
    num_shorts = data.get("num_shorts", 3)

    if not url or not is_valid_youtube_url(url):
        return jsonify({"error": "Invalid URL"}), 400

    def generate():
        try:
            # Step 1: Init
            yield json.dumps({"status": "connected", "message": "Backend connected. Starting pipeline..."}) + "\n"
            
            # Step 2: Metadata
            yield json.dumps({"status": "metadata", "message": "Fetching video metadata..."}) + "\n"
            metadata = get_video_metadata(url)
            yield json.dumps({"status": "metadata_done", "data": metadata}) + "\n"

            # Step 3: Transcript
            yield json.dumps({"status": "transcript", "message": "Extracting audio & multi-language transcription..."}) + "\n"
            transcript = get_transcript(url)
            if not transcript:
                yield json.dumps({"status": "error", "message": "Transcript failed."}) + "\n"
                return

            if mode == "summarize":
                # Step 4: Summarize
                yield json.dumps({"status": "summarizing", "message": "AI is architecting the summary..."}) + "\n"
                summary_text = summarize(transcript)
                
                yield json.dumps({"status": "finishing", "message": "Extracting tags and refined hook..."}) + "\n"
                initial_hook = intro(transcript)
                keywords = extract_tags(transcript)
                
                final_data = {
                    "intro": initial_hook,
                    "summary": summary_text,
                    "tags": keywords,
                    "transcript": transcript,
                    "metadata": metadata
                }
                yield json.dumps({"status": "complete", "data": final_data}) + "\n"
            
            elif mode == "shorts":
                # Step 4: Shorts
                yield json.dumps({"status": "shorts_processing", "message": "Creating Viral Clips (FFmpeg Engine)..."}) + "\n"
                result = generate_shorts(url, num_shorts=num_shorts, clip_duration=30)
                if result["status"] == "error":
                     yield json.dumps({"status": "error", "message": "Shorts generation failed."}) + "\n"
                else:
                     yield json.dumps({"status": "complete", "data": result}) + "\n"

        except Exception as e:
            yield json.dumps({"status": "error", "message": str(e)}) + "\n"

    return Response(generate(), mimetype='application/x-ndjson')

@app.route("/ping")
def ping():
    return jsonify({"status": "connected"})

@app.route('/downloads/<path:filename>')
def download_file(filename):
    return send_from_directory('downloads', filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)