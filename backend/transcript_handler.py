from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound 
import tempfile
import os
import re
import warnings

# Import our optimized summarizer/whisper logic
from summarizer import download_audio, transcribe_audio

def extract_video_id(url):
    regex = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(regex, url)
    return match.group(1) if match else None

def get_transcript(url):
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    # Path 1: YouTube Official API/Captains
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.fetch(video_id)
        transcript = " ".join([x["text"] for x in transcript_list])
        return transcript
    except Exception as e:
        print(f"YouTube Official Transcript API failed: {e}. Falling back to AI Transcription (Whisper)...")

    # Path 2: Whisper AI Transcription (fallback for videos without captions)
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Re-using the efficient downloader and faster-whisper from summarizer.py
            audio_path = download_audio(url, temp_dir)
            transcript = transcribe_audio(audio_path)
            return transcript
        except Exception as e:
            raise RuntimeError(f"All transcription methods failed: {str(e)}")
