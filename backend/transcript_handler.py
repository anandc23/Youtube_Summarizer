from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound 
from utils import download_youtube_audio, convert_video_to_audio
import tempfile
import os
import re
import warnings

warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")

# Load Whisper model
try:
    import whisper
    whisper_model = whisper.load_model("base")
except ImportError:
    whisper_model = None

def extract_video_id(url):
    regex = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(regex, url)
    return match.group(1) if match else None

def validate_audio_file(audio_file):
    if not os.path.exists(audio_file):
        raise ValueError("Audio file not found")
    if os.path.getsize(audio_file) == 0:
        raise ValueError("Audio file is empty")
    return True

def get_transcript(url):
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    # Try YouTube transcript first
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = " ".join([x["text"] for x in transcript_list])
        return transcript
    except (TranscriptsDisabled, NoTranscriptFound):
        pass  # Proceed to Whisper fallback

    # Whisper fallback
    if whisper_model is None:
        raise RuntimeError("Whisper model not available for transcription.")

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            video_file = download_youtube_audio(url, temp_dir)
            audio_file = convert_video_to_audio(video_file, temp_dir)

            validate_audio_file(audio_file)

            result = whisper_model.transcribe(audio_file)
            return result['text']

        except Exception as e:
            raise RuntimeError(f"Transcription failed: {str(e)}")
