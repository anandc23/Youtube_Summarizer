from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from transcript_handler import get_transcript
from summarizer import summarize, intro
import shutil
import os
from auth import auth_bp

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.secret_key = "your_secret_key"  # Set a strong secret key for session management
CORS(app, supports_credentials=True)
app.register_blueprint(auth_bp)

@app.route("/summarize", methods=["POST"])
def summarize_route():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"error": "No URL provided"}), 400
    temp_dir = None
    try:
        transcript = get_transcript(url)
        summary = summarize(transcript)
        introduction = intro(transcript)
        title = introduction  # Optionally, you can extract or generate a better title
        return jsonify({
            "intro": introduction,
            "summary": summary,
            "title": title
        })
    except Exception as e:
        import traceback
        print("Error during summarization:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_dir and temp_dir is not None and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/app")
def app_status():
    return {"status": "Backend is connected!"}

@app.route("/ping")
def ping():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)